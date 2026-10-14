import { describe, expect, it } from "vitest";

import type { OsmSnapshotReadResult } from "../sources/osm-geojson-sequence";
import type { BoundaryFixture } from "./boundary";
import type { NormalizedPlaceCandidate } from "./candidate";
import { qualitySpotCheckSize, selectQualitySpotCheckCandidates } from "./quality-spot-check";

const boundary: BoundaryFixture = {
  geometry: {
    coordinates: [
      [
        [
          [124, 6],
          [127, 6],
          [127, 9],
          [124, 9],
          [124, 6],
        ],
      ],
    ],
    type: "MultiPolygon",
  },
  jurisdiction: {
    countryCode: "PH",
    name: "City of Tagum",
    referenceCode: "1102319000",
    referenceSystem: "PSGC-10",
    verificationUrl: "https://example.com/tagum",
    verifiedAt: "2026-10-13T00:00:00Z",
  },
  name: "Tagum",
  provenance: {
    attribution: "Synthetic test fixture",
    checksumSha256: "a".repeat(64),
    licenseName: "Test",
    licenseUrl: "https://example.com/license",
    publisher: "Test",
    retrievedAt: "2026-10-13T00:00:00Z",
    sourceRecordId: "test",
    sourceUrl: "https://example.com/source",
    sourceVersion: "1",
  },
  purpose: "stage0-audit",
  reviewStatus: "approved",
  schemaVersion: 1,
  slug: "tagum",
};

const categoryLabels = [
  "amenity:restaurant",
  "amenity:fast_food",
  "amenity:cafe",
  "amenity:food_court",
  "amenity:ice_cream",
  "shop:bakery",
] as const;

function candidate(index: number): NormalizedPlaceCandidate {
  const latitude = index === 1 ? 6.5001 : 6.5 + index * 0.05;
  const longitude = index === 1 ? 124.5001 : 124.5 + index * 0.05;

  return {
    address: null,
    alternateNames: [],
    candidateKey: `osm:${String(index).padStart(2, "0")}`,
    contacts: { email: null, phone: null, social: [], website: null },
    coordinates: { latitude, longitude },
    name: index < 2 ? "Duplicate Cafe" : `Place ${index}`,
    openingHoursText: null,
    retrievedAt: "2026-10-13T00:00:00Z",
    schemaVersion: 1,
    source: { recordId: `node/${index}`, slug: "openstreetmap", snapshotVersion: "test" },
    sourceCategoryLabels: [categoryLabels[index % categoryLabels.length]],
    sourceClosedAt: null,
    sourceCuisineLabels: [],
    sourceUpdatedAt: null,
  };
}

function snapshot(count = 30): OsmSnapshotReadResult {
  return {
    accepted: Array.from({ length: count }, (_, index) => ({
      candidate: candidate(index),
      coordinateMethod:
        index === 2 ? ("polygon-representative" as const) : ("source-point" as const),
    })),
    collapsedSourceDuplicates: 0,
    recordsRead: count,
    rejected: { "invalid-feature": 0, "missing-id": 0, "missing-name": 0, "not-food-place": 0 },
  };
}

describe("selectQualitySpotCheckCandidates", () => {
  it("selects a stable, diverse set with one complete duplicate-risk pair", () => {
    const first = selectQualitySpotCheckCandidates(snapshot(), boundary);
    const second = selectQualitySpotCheckCandidates(snapshot(), boundary);

    expect(first).toEqual(second);
    expect(first).toHaveLength(qualitySpotCheckSize);
    expect(new Set(first.map((row) => row.category))).toHaveLength(categoryLabels.length);
    expect(first.some((row) => row.coordinateMethod === "polygon-representative")).toBe(true);
    expect(first.filter((row) => row.potentialDuplicateGroupId)).toHaveLength(2);
    expect(first.some((row) => row.reasons.includes("geographic-extreme"))).toBe(true);
  });

  it("rejects inventories too small for the approved check", () => {
    expect(() => selectQualitySpotCheckCandidates(snapshot(24), boundary)).toThrow(
      "Quality spot check requires at least 25 candidates.",
    );
  });

  it("prioritizes categories that require manual review", () => {
    const value = snapshot();
    const reviewedCandidate = {
      ...value.accepted[29].candidate,
      sourceCategoryLabels: ["shop:confectionery"],
    };
    const selected = selectQualitySpotCheckCandidates(
      {
        ...value,
        accepted: value.accepted.map((row, index) =>
          index === 29 ? { ...row, candidate: reviewedCandidate } : row,
        ),
      },
      boundary,
    );

    expect(selected).toContainEqual(
      expect.objectContaining({
        candidateKey: reviewedCandidate.candidateKey,
        reasons: expect.arrayContaining(["category-review"]),
      }),
    );
  });
});
