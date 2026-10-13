import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import type { BoundaryFixture } from "../../src/modules/catalog/audit/boundary";
import { createOsmPlaceInventory } from "../../src/modules/catalog/audit/osm-inventory";
import { readOsmGeoJsonSequence } from "../../src/modules/catalog/sources/osm-geojson-sequence";

type ExtractionManifest = Readonly<{
  generatedAt: string;
  outputs: Readonly<{
    geoJsonSequenceFile: string;
    geoJsonSequenceRecords: number;
    geoJsonSequenceSha256: string;
  }>;
  source: Readonly<{ md5: string; version: string }>;
}>;

function usage(): never {
  throw new Error(
    "Usage: npm run audit:osm -- <snapshot.geojsonseq> <manifest.json> <boundary.json> <output-directory>",
  );
}

function assertManifest(value: unknown): asserts value is ExtractionManifest {
  if (!value || typeof value !== "object") throw new Error("Extraction manifest is invalid.");
  const manifest = value as Partial<ExtractionManifest>;
  if (
    typeof manifest.generatedAt !== "string" ||
    typeof manifest.source?.version !== "string" ||
    typeof manifest.source.md5 !== "string" ||
    typeof manifest.outputs?.geoJsonSequenceFile !== "string" ||
    typeof manifest.outputs.geoJsonSequenceRecords !== "number" ||
    !/^[a-f0-9]{64}$/.test(manifest.outputs.geoJsonSequenceSha256 ?? "")
  ) {
    throw new Error("Extraction manifest is missing required fields.");
  }
}

function percent(count: number, denominator: number): string {
  return denominator === 0 ? "n/a" : `${((count / denominator) * 100).toFixed(1)}%`;
}

const [snapshotArgument, manifestArgument, boundaryArgument, outputArgument] =
  process.argv.slice(2);
if (!snapshotArgument || !manifestArgument || !boundaryArgument || !outputArgument) usage();

const snapshotPath = resolve(snapshotArgument);
const manifestPath = resolve(manifestArgument);
const boundaryPath = resolve(boundaryArgument);
const outputDirectory = resolve(outputArgument);
const [snapshotBuffer, manifestText, boundaryText] = await Promise.all([
  readFile(snapshotPath),
  readFile(manifestPath, "utf8"),
  readFile(boundaryPath, "utf8"),
]);
const manifestValue: unknown = JSON.parse(manifestText);
assertManifest(manifestValue);
const manifest = manifestValue;

if (basename(snapshotPath) !== manifest.outputs.geoJsonSequenceFile) {
  throw new Error("Snapshot filename does not match the extraction manifest.");
}
const snapshotSha256 = createHash("sha256").update(snapshotBuffer).digest("hex");
if (snapshotSha256 !== manifest.outputs.geoJsonSequenceSha256) {
  throw new Error("Snapshot SHA-256 does not match the extraction manifest.");
}

const readResult = readOsmGeoJsonSequence(snapshotBuffer.toString("utf8"), {
  retrievedAt: manifest.generatedAt,
  snapshotVersion: manifest.source.version,
});
if (readResult.recordsRead !== manifest.outputs.geoJsonSequenceRecords) {
  throw new Error("Snapshot record count does not match the extraction manifest.");
}

const boundary = JSON.parse(boundaryText) as BoundaryFixture;
const inventory = createOsmPlaceInventory(readResult, boundary);
const inside = inventory.boundary.inside;
const report = `# OSM Tagum Place Inventory

Generated from a checksummed local snapshot. This report contains aggregate evidence only.

## Snapshot

- Source version: \`${manifest.source.version}\`
- Source MD5: \`${manifest.source.md5}\`
- Snapshot SHA-256: \`${snapshotSha256}\`
- Records read: ${inventory.reader.recordsRead}
- Adapter-accepted before boundary check: ${inventory.acceptedBeforeBoundary}
- Inside approved Tagum boundary: ${inside}
- Audit decision: incomplete pending the 100-place reference sample and manual lifecycle review

## Reader disposition

| Outcome | Count |
| --- | ---: |
| Accepted | ${inventory.acceptedBeforeBoundary} |
| Invalid feature | ${inventory.reader.rejected["invalid-feature"]} |
| Missing source ID | ${inventory.reader.rejected["missing-id"]} |
| Missing usable name | ${inventory.reader.rejected["missing-name"]} |
| Failed strict food-place rule | ${inventory.reader.rejected["not-food-place"]} |

## Category assessment

| State | Count | Share of in-boundary rows |
| --- | ---: | ---: |
| Usable | ${inventory.categories.usability.usable} | ${percent(inventory.categories.usability.usable, inside)} |
| Review required | ${inventory.categories.usability["review-required"]} | ${percent(inventory.categories.usability["review-required"], inside)} |
| Unmapped | ${inventory.categories.usability.unmapped} | ${percent(inventory.categories.usability.unmapped, inside)} |

| Canonical audit category | Count |
| --- | ---: |
${Object.entries(inventory.categories.byCategory)
  .map(([category, count]) => `| ${category} | ${count} |`)
  .join("\n")}

## Geometry evidence

| Coordinate method | Count |
| --- | ---: |
${Object.entries(inventory.coordinateMethods)
  .map(([method, count]) => `| ${method} | ${count} |`)
  .join("\n")}

| OSM object type | Count |
| --- | ---: |
${Object.entries(inventory.objectTypes)
  .map(([type, count]) => `| ${type} | ${count} |`)
  .join("\n")}

## Field completeness

| Field | Present | Share of in-boundary rows |
| --- | ---: | ---: |
${Object.entries(inventory.fieldCompleteness)
  .map(([field, count]) => `| ${field} | ${count} | ${percent(count, inside)} |`)
  .join("\n")}

## Review signals

- Outside boundary: ${inventory.boundary.outside}
- Missing coordinates: ${inventory.boundary["missing-coordinate"]}
- Invalid coordinates: ${inventory.boundary["invalid-coordinate"]}
- Potential duplicate groups: ${inventory.duplicates.groups}
- Potential extra duplicate rows: ${inventory.duplicates.extraRows}
- Duplicate heuristic: exact normalized name within ${inventory.duplicates.thresholdMeters} metres
- Lifecycle assessed: 0; unknown: ${inventory.lifecycle.unknown}
- Defensible price evidence: 0; unknown: ${inventory.priceEvidence.unknown}

Boundary membership for lines and polygons is based on the documented deterministic representative coordinate. The duplicate heuristic only creates review candidates and does not merge records. Coverage, closed-place accuracy, and price usability are not inferred from this inventory.
`;

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(
    join(outputDirectory, "osm-place-inventory.json"),
    `${JSON.stringify(inventory, null, 2)}\n`,
  ),
  writeFile(join(outputDirectory, "osm-place-inventory.md"), report),
]);

console.log(`Wrote aggregate inventory for ${inside} in-boundary candidates to ${outputDirectory}`);
