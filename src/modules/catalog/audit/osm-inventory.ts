import type { OsmCoordinateMethod, OsmSnapshotReadResult } from "../sources/osm-geojson-sequence";
import {
  assertBoundaryReadyForAudit,
  type BoundaryFixture,
  clipCandidatesToBoundary,
} from "./boundary";
import type { NormalizedPlaceCandidate } from "./candidate";
import { type AuditPlaceCategory, assessSourceCategory } from "./source-category";

type CountBy<T extends string> = Readonly<Record<T, number>>;

export type OsmPlaceInventory = Readonly<{
  acceptedBeforeBoundary: number;
  boundary: CountBy<"inside" | "invalid-coordinate" | "missing-coordinate" | "outside">;
  categories: Readonly<{
    byCategory: CountBy<AuditPlaceCategory>;
    usability: CountBy<"review-required" | "unmapped" | "usable">;
  }>;
  coordinateMethods: CountBy<OsmCoordinateMethod>;
  duplicates: Readonly<{
    extraRows: number;
    groups: number;
    method: "exact-normalized-name-within-75m";
    thresholdMeters: 75;
  }>;
  fieldCompleteness: CountBy<
    "address-line" | "barangay" | "contact" | "cuisine" | "locality" | "opening-hours"
  >;
  lifecycle: Readonly<{ assessed: 0; unknown: number }>;
  objectTypes: CountBy<"node" | "relation" | "unknown" | "way">;
  priceEvidence: Readonly<{ defensible: 0; unknown: number }>;
  reader: Readonly<{
    recordsRead: number;
    rejected: OsmSnapshotReadResult["rejected"];
  }>;
}>;

const categoryKeys: readonly AuditPlaceCategory[] = [
  "bakery",
  "bar-with-food",
  "cafe",
  "dessert",
  "fast-food",
  "food-court",
  "food-stall",
  "prepared-food-shop",
  "restaurant",
];

function emptyCounts<T extends string>(keys: readonly T[]): Record<T, number> {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Record<T, number>;
}

function normalizedName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function distanceMeters(left: NormalizedPlaceCandidate, right: NormalizedPlaceCandidate): number {
  if (!left.coordinates || !right.coordinates) return Number.POSITIVE_INFINITY;

  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(right.coordinates.latitude - left.coordinates.latitude);
  const longitudeDelta = radians(right.coordinates.longitude - left.coordinates.longitude);
  const leftLatitude = radians(left.coordinates.latitude);
  const rightLatitude = radians(right.coordinates.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(leftLatitude) * Math.cos(rightLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 6_371_000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function duplicateCounts(candidates: readonly NormalizedPlaceCandidate[]) {
  const parent = candidates.map((_, index) => index);
  const find = (index: number): number => {
    let root = index;
    while (parent[root] !== root) root = parent[root];
    while (parent[index] !== index) {
      const next = parent[index];
      parent[index] = root;
      index = next;
    }
    return root;
  };
  const union = (left: number, right: number) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot;
  };

  const names = candidates.map((candidate) => normalizedName(candidate.name));
  for (let left = 0; left < candidates.length; left += 1) {
    for (let right = left + 1; right < candidates.length; right += 1) {
      if (
        names[left] &&
        names[left] === names[right] &&
        distanceMeters(candidates[left], candidates[right]) <= 75
      ) {
        union(left, right);
      }
    }
  }

  const sizes = new Map<number, number>();
  for (let index = 0; index < candidates.length; index += 1) {
    const root = find(index);
    sizes.set(root, (sizes.get(root) ?? 0) + 1);
  }
  const duplicateGroups = [...sizes.values()].filter((size) => size > 1);

  return {
    extraRows: duplicateGroups.reduce((total, size) => total + size - 1, 0),
    groups: duplicateGroups.length,
    method: "exact-normalized-name-within-75m" as const,
    thresholdMeters: 75 as const,
  };
}

function objectType(candidate: NormalizedPlaceCandidate): "node" | "relation" | "unknown" | "way" {
  const value = candidate.source.recordId.split("/", 1)[0];
  return value === "node" || value === "relation" || value === "way" ? value : "unknown";
}

export function createOsmPlaceInventory(
  snapshot: OsmSnapshotReadResult,
  boundaryFixture: BoundaryFixture,
): OsmPlaceInventory {
  assertBoundaryReadyForAudit(boundaryFixture);
  const candidates = snapshot.accepted.map(({ candidate }) => candidate);
  const clipped = clipCandidatesToBoundary(candidates, boundaryFixture.geometry);
  const acceptedKeys = new Set(clipped.accepted.map(({ candidateKey }) => candidateKey));
  const insideRows = snapshot.accepted.filter(({ candidate }) =>
    acceptedKeys.has(candidate.candidateKey),
  );

  const boundary = emptyCounts([
    "inside",
    "invalid-coordinate",
    "missing-coordinate",
    "outside",
  ] as const);
  boundary.inside = insideRows.length;
  for (const rejection of clipped.rejected) {
    const reason = rejection.reason === "outside-boundary" ? "outside" : rejection.reason;
    boundary[reason] += 1;
  }

  const coordinateMethods = emptyCounts([
    "line-midpoint",
    "missing",
    "polygon-representative",
    "source-point",
  ] as const);
  const byCategory = emptyCounts(categoryKeys);
  const usability = emptyCounts(["review-required", "unmapped", "usable"] as const);
  const objectTypes = emptyCounts(["node", "relation", "unknown", "way"] as const);
  const fieldCompleteness = emptyCounts([
    "address-line",
    "barangay",
    "contact",
    "cuisine",
    "locality",
    "opening-hours",
  ] as const);

  for (const row of insideRows) {
    const { candidate } = row;
    coordinateMethods[row.coordinateMethod] += 1;
    objectTypes[objectType(candidate)] += 1;
    const category = assessSourceCategory(candidate);
    usability[category.usability] += 1;
    if (category.category) byCategory[category.category] += 1;

    if (candidate.address?.addressLine) fieldCompleteness["address-line"] += 1;
    if (candidate.address?.barangayLabel) fieldCompleteness.barangay += 1;
    if (candidate.address?.locality) fieldCompleteness.locality += 1;
    if (candidate.openingHoursText) fieldCompleteness["opening-hours"] += 1;
    if (candidate.sourceCuisineLabels.length > 0) fieldCompleteness.cuisine += 1;
    if (
      candidate.contacts.email ||
      candidate.contacts.phone ||
      candidate.contacts.social.length > 0 ||
      candidate.contacts.website
    ) {
      fieldCompleteness.contact += 1;
    }
  }

  return {
    acceptedBeforeBoundary: snapshot.accepted.length,
    boundary,
    categories: { byCategory, usability },
    coordinateMethods,
    duplicates: duplicateCounts(clipped.accepted),
    fieldCompleteness,
    lifecycle: { assessed: 0, unknown: clipped.accepted.length },
    objectTypes,
    priceEvidence: { defensible: 0, unknown: clipped.accepted.length },
    reader: { recordsRead: snapshot.recordsRead, rejected: snapshot.rejected },
  };
}
