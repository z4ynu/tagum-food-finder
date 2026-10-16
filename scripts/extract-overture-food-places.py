"""Extract a checksummed Tagum food-place snapshot from a pinned Overture release."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import duckdb


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BOUNDARY = ROOT / "validation/fixtures/tagum-boundary-osm-15986415-v8.json"
DEFAULT_OUTPUT_DIRECTORY = ROOT / "validation/snapshots"
DEFAULT_RELEASE = "2026-09-23.1"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Query the public Overture Places release for named food-and-drink "
            "records in the approved Tagum bounding box."
        )
    )
    parser.add_argument("--release", default=DEFAULT_RELEASE)
    parser.add_argument("--boundary", type=Path, default=DEFAULT_BOUNDARY)
    parser.add_argument("--output-directory", type=Path, default=DEFAULT_OUTPUT_DIRECTORY)
    return parser.parse_args()


def iter_positions(value: Any) -> Iterable[tuple[float, float]]:
    if (
        isinstance(value, list)
        and len(value) >= 2
        and isinstance(value[0], (int, float))
        and isinstance(value[1], (int, float))
    ):
        yield float(value[0]), float(value[1])
        return
    if isinstance(value, list):
        for child in value:
            yield from iter_positions(child)


def load_boundary(path: Path) -> tuple[dict[str, Any], tuple[float, float, float, float]]:
    boundary = json.loads(path.read_text(encoding="utf-8"))
    if (
        boundary.get("reviewStatus") != "approved"
        or boundary.get("jurisdiction", {}).get("referenceCode") != "1102319000"
        or boundary.get("geometry", {}).get("type") not in {"Polygon", "MultiPolygon"}
    ):
        raise ValueError("Boundary is not the approved Tagum PSGC 1102319000 fixture.")
    checksum = boundary.get("provenance", {}).get("checksumSha256", "")
    if len(checksum) != 64 or any(character not in "0123456789abcdef" for character in checksum):
        raise ValueError("Boundary provenance is missing a valid SHA-256 checksum.")
    positions = list(iter_positions(boundary["geometry"]["coordinates"]))
    if not positions:
        raise ValueError("Boundary has no usable coordinates.")
    longitudes = [position[0] for position in positions]
    latitudes = [position[1] for position in positions]
    return boundary, (min(longitudes), min(latitudes), max(longitudes), max(latitudes))


def json_default(value: Any) -> str:
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    raise TypeError(f"Cannot serialize {type(value).__name__} to JSON.")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> None:
    arguments = parse_args()
    boundary_path = arguments.boundary.resolve()
    output_directory = arguments.output_directory.resolve()
    boundary, bounds = load_boundary(boundary_path)

    release = arguments.release.strip()
    if not release or any(character not in "0123456789.-" for character in release):
        raise ValueError("Release must be a pinned Overture release identifier.")
    source_url = (
        "s3://overturemaps-us-west-2/release/"
        f"{release}/theme=places/type=place/*"
    )

    connection = duckdb.connect()
    connection.execute("INSTALL httpfs")
    connection.execute("LOAD httpfs")
    connection.execute("SET s3_region='us-west-2'")
    cursor = connection.execute(
        """
        SELECT
          id,
          names,
          taxonomy,
          confidence,
          operating_status,
          bbox.xmin AS longitude,
          bbox.ymin AS latitude,
          addresses,
          websites,
          socials,
          emails,
          phones,
          sources
        FROM read_parquet(?)
        WHERE bbox.xmin BETWEEN ? AND ?
          AND bbox.ymin BETWEEN ? AND ?
          AND list_contains(taxonomy.hierarchy, 'food_and_drink')
          AND names.primary IS NOT NULL
        ORDER BY names.primary, id
        """,
        [source_url, bounds[0], bounds[2], bounds[1], bounds[3]],
    )
    columns = [description[0] for description in cursor.description]
    rows = cursor.fetchall()

    output_directory.mkdir(parents=True, exist_ok=True)
    snapshot_path = output_directory / "overture-tagum-food-places.jsonl"
    manifest_path = output_directory / "overture-tagum-food-places.manifest.json"
    with snapshot_path.open("w", encoding="utf-8", newline="\n") as snapshot:
        for row in rows:
            record = dict(zip(columns, row, strict=True))
            longitude = record.pop("longitude")
            latitude = record.pop("latitude")
            record["geometry"] = {
                "coordinates": [longitude, latitude],
                "type": "Point",
            }
            snapshot.write(
                json.dumps(
                    record,
                    default=json_default,
                    ensure_ascii=False,
                    separators=(",", ":"),
                    sort_keys=True,
                )
            )
            snapshot.write("\n")

    generated_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    manifest = {
        "boundary": {
            "fileName": boundary_path.name,
            "sha256": boundary["provenance"]["checksumSha256"],
        },
        "extractor": {
            "duckdbVersion": duckdb.__version__,
            "filter": "taxonomy.hierarchy contains food_and_drink and names.primary is not null",
        },
        "generatedAt": generated_at,
        "outputs": {
            "jsonLinesFile": snapshot_path.name,
            "jsonLinesRecords": len(rows),
            "jsonLinesSha256": sha256(snapshot_path),
        },
        "schemaVersion": 1,
        "source": {"release": release, "url": source_url},
    }
    manifest_path.write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    print(f"Exported {len(rows)} bounding-box candidates to {snapshot_path}")
    print(f"Manifest: {manifest_path}")


if __name__ == "__main__":
    main()
