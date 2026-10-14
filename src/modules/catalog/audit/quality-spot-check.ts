import type { OsmCoordinateMethod, OsmSnapshotReadResult } from "../sources/osm-geojson-sequence";
import { clipCandidatesToBoundary, type BoundaryFixture } from "./boundary";
import type { NormalizedPlaceCandidate } from "./candidate";
import { type AuditPlaceCategory, assessSourceCategory } from "./source-category";

export const qualitySpotCheckSize = 25 as const;

export type QualitySpotCheckReason =
  | "category"
  | "category-review"
  | "coordinate-method"
  | "deterministic-fill"
  | "duplicate-risk"
  | "geographic-extreme";

export type QualitySpotCheckCandidate = Readonly<{
  address: NormalizedPlaceCandidate["address"];
  candidateKey: string;
  category: AuditPlaceCategory | null;
  categoryUsability: "review-required" | "unmapped" | "usable";
  coordinateMethod: OsmCoordinateMethod;
  coordinates: NonNullable<NormalizedPlaceCandidate["coordinates"]>;
  name: string;
  potentialDuplicateGroupId: string | null;
  reasons: readonly QualitySpotCheckReason[];
  sourceCategoryLabels: readonly string[];
  sourceCuisineLabels: readonly string[];
  sourceRecordId: string;
}>;

type SelectableRow = Readonly<{
  candidate: NormalizedPlaceCandidate & {
    coordinates: NonNullable<NormalizedPlaceCandidate["coordinates"]>;
  };
  category: ReturnType<typeof assessSourceCategory>;
  coordinateMethod: OsmCoordinateMethod;
}>;

function normalizedName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function distanceMeters(left: SelectableRow, right: SelectableRow): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(
    right.candidate.coordinates.latitude - left.candidate.coordinates.latitude,
  );
  const longitudeDelta = radians(
    right.candidate.coordinates.longitude - left.candidate.coordinates.longitude,
  );
  const leftLatitude = radians(left.candidate.coordinates.latitude);
  const rightLatitude = radians(right.candidate.coordinates.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(leftLatitude) * Math.cos(rightLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 6_371_000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function potentialDuplicateGroups(rows: readonly SelectableRow[]): readonly SelectableRow[][] {
  const byName = new Map<string, SelectableRow[]>();
  for (const row of rows) {
    const name = normalizedName(row.candidate.name);
    if (!name) continue;
    byName.set(name, [...(byName.get(name) ?? []), row]);
  }

  const groups: SelectableRow[][] = [];
  for (const sameNameRows of byName.values()) {
    const remaining = [...sameNameRows].sort((left, right) =>
      left.candidate.candidateKey.localeCompare(right.candidate.candidateKey),
    );

    while (remaining.length > 0) {
      const first = remaining.shift();
      if (!first) break;
      const nearby = remaining.filter((row) => distanceMeters(first, row) <= 75);
      if (nearby.length === 0) continue;
      const group = [first, ...nearby];
      groups.push(group);
      for (const row of nearby) {
        remaining.splice(remaining.indexOf(row), 1);
      }
    }
  }

  return groups.sort((left, right) =>
    left[0].candidate.candidateKey.localeCompare(right[0].candidate.candidateKey),
  );
}

function selectableRows(
  snapshot: OsmSnapshotReadResult,
  boundary: BoundaryFixture,
): readonly SelectableRow[] {
  const clipped = clipCandidatesToBoundary(
    snapshot.accepted.map(({ candidate }) => candidate),
    boundary.geometry,
  );
  const acceptedKeys = new Set(clipped.accepted.map(({ candidateKey }) => candidateKey));

  return snapshot.accepted
    .filter(
      (
        row,
      ): row is typeof row & {
        candidate: typeof row.candidate & {
          coordinates: NonNullable<typeof row.candidate.coordinates>;
        };
      } => acceptedKeys.has(row.candidate.candidateKey) && row.candidate.coordinates !== null,
    )
    .map((row) => ({ ...row, category: assessSourceCategory(row.candidate) }))
    .sort((left, right) => left.candidate.candidateKey.localeCompare(right.candidate.candidateKey));
}

export function selectQualitySpotCheckCandidates(
  snapshot: OsmSnapshotReadResult,
  boundary: BoundaryFixture,
): readonly QualitySpotCheckCandidate[] {
  const rows = selectableRows(snapshot, boundary);
  if (rows.length < qualitySpotCheckSize) {
    throw new Error(`Quality spot check requires at least ${qualitySpotCheckSize} candidates.`);
  }

  const selected = new Map<string, SelectableRow>();
  const reasons = new Map<string, Set<QualitySpotCheckReason>>();
  const duplicateGroupIds = new Map<string, string>();
  const add = (row: SelectableRow, reason: QualitySpotCheckReason) => {
    if (selected.size < qualitySpotCheckSize || selected.has(row.candidate.candidateKey)) {
      selected.set(row.candidate.candidateKey, row);
      const rowReasons = reasons.get(row.candidate.candidateKey) ?? new Set();
      rowReasons.add(reason);
      reasons.set(row.candidate.candidateKey, rowReasons);
    }
  };

  const firstDuplicateGroup = potentialDuplicateGroups(rows)[0];
  if (firstDuplicateGroup) {
    const groupId = `duplicate:${firstDuplicateGroup[0].candidate.candidateKey}`;
    for (const row of firstDuplicateGroup.slice(0, 2)) {
      duplicateGroupIds.set(row.candidate.candidateKey, groupId);
      add(row, "duplicate-risk");
    }
  }

  for (const row of rows.filter((candidate) => candidate.category.usability !== "usable")) {
    add(row, "category-review");
  }

  const categories = [...new Set(rows.map((row) => row.category.category).filter(Boolean))].sort();
  for (const category of categories) {
    const row = rows.find((candidate) => candidate.category.category === category);
    if (row) add(row, "category");
  }

  const coordinateMethods: readonly OsmCoordinateMethod[] = [
    "source-point",
    "polygon-representative",
    "line-midpoint",
  ];
  for (const method of coordinateMethods) {
    const row = rows.find((candidate) => candidate.coordinateMethod === method);
    if (row) add(row, "coordinate-method");
  }

  const extremes = [
    [...rows].sort(
      (left, right) => left.candidate.coordinates.latitude - right.candidate.coordinates.latitude,
    )[0],
    [...rows].sort(
      (left, right) => right.candidate.coordinates.latitude - left.candidate.coordinates.latitude,
    )[0],
    [...rows].sort(
      (left, right) => left.candidate.coordinates.longitude - right.candidate.coordinates.longitude,
    )[0],
    [...rows].sort(
      (left, right) => right.candidate.coordinates.longitude - left.candidate.coordinates.longitude,
    )[0],
  ];
  for (const row of extremes) add(row, "geographic-extreme");

  for (const row of rows) add(row, "deterministic-fill");

  return [...selected.values()].map((row) => ({
    address: row.candidate.address,
    candidateKey: row.candidate.candidateKey,
    category: row.category.category,
    categoryUsability: row.category.usability,
    coordinateMethod: row.coordinateMethod,
    coordinates: row.candidate.coordinates,
    name: row.candidate.name,
    potentialDuplicateGroupId: duplicateGroupIds.get(row.candidate.candidateKey) ?? null,
    reasons: [...(reasons.get(row.candidate.candidateKey) ?? [])],
    sourceCategoryLabels: row.candidate.sourceCategoryLabels,
    sourceCuisineLabels: row.candidate.sourceCuisineLabels,
    sourceRecordId: row.candidate.source.recordId,
  }));
}
