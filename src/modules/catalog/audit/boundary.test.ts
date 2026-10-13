import { describe, expect, it } from "vitest";

import {
  assertBoundaryReadyForAudit,
  type BoundaryFixture,
  boundaryFixtureSchemaVersion,
  clipCandidatesToBoundary,
  geometryCoversPoint,
  type MultiPolygonGeometry,
} from "./boundary";
import { candidateSchemaVersion, type NormalizedPlaceCandidate } from "./candidate";

const syntheticGeometry: MultiPolygonGeometry = {
  type: "MultiPolygon",
  coordinates: [
    [
      [
        [125.7, 7.3],
        [125.9, 7.3],
        [125.9, 7.5],
        [125.7, 7.5],
        [125.7, 7.3],
      ],
      [
        [125.79, 7.39],
        [125.81, 7.39],
        [125.81, 7.41],
        [125.79, 7.41],
        [125.79, 7.39],
      ],
    ],
    [
      [
        [126, 7.3],
        [126.1, 7.3],
        [126.1, 7.4],
        [126, 7.4],
        [126, 7.3],
      ],
    ],
  ],
};

function createCandidate(
  candidateKey: string,
  coordinates: NormalizedPlaceCandidate["coordinates"],
): NormalizedPlaceCandidate {
  return {
    address: null,
    alternateNames: [],
    candidateKey,
    coordinates,
    name: candidateKey,
    retrievedAt: "2026-10-13T00:00:00.000Z",
    schemaVersion: candidateSchemaVersion,
    source: { recordId: candidateKey, slug: "synthetic" },
    sourceCategoryLabels: [],
    sourceUpdatedAt: null,
  };
}

describe("geometryCoversPoint", () => {
  it("covers points inside either polygon", () => {
    expect(geometryCoversPoint(syntheticGeometry, [125.75, 7.35])).toBe(true);
    expect(geometryCoversPoint(syntheticGeometry, [126.05, 7.35])).toBe(true);
  });

  it("covers an outer boundary edge", () => {
    expect(geometryCoversPoint(syntheticGeometry, [125.7, 7.4])).toBe(true);
  });

  it("excludes points outside every polygon", () => {
    expect(geometryCoversPoint(syntheticGeometry, [125.95, 7.4])).toBe(false);
  });

  it("excludes a hole interior but covers the hole boundary", () => {
    expect(geometryCoversPoint(syntheticGeometry, [125.8, 7.4])).toBe(false);
    expect(geometryCoversPoint(syntheticGeometry, [125.79, 7.4])).toBe(true);
  });

  it("rejects malformed boundary rings", () => {
    expect(() =>
      geometryCoversPoint(
        {
          type: "MultiPolygon",
          coordinates: [
            [
              [
                [125.7, 7.3],
                [125.9, 7.3],
                [125.9, 7.5],
                [125.7, 7.5],
              ],
            ],
          ],
        },
        [125.8, 7.4],
      ),
    ).toThrow("Boundary rings must be closed.");
  });
});

describe("clipCandidatesToBoundary", () => {
  it("separates accepted, missing, invalid, and outside coordinates", () => {
    const result = clipCandidatesToBoundary(
      [
        createCandidate("inside", { longitude: 125.75, latitude: 7.35 }),
        createCandidate("missing", null),
        createCandidate("invalid", { longitude: 200, latitude: 7.35 }),
        createCandidate("outside", { longitude: 125.95, latitude: 7.4 }),
      ],
      syntheticGeometry,
    );

    expect(result.accepted.map((candidate) => candidate.candidateKey)).toEqual(["inside"]);
    expect(
      result.rejected.map(({ candidate, reason }) => [candidate.candidateKey, reason]),
    ).toEqual([
      ["missing", "missing-coordinate"],
      ["invalid", "invalid-coordinate"],
      ["outside", "outside-boundary"],
    ]);
  });
});

describe("assertBoundaryReadyForAudit", () => {
  const approvedFixture: BoundaryFixture = {
    geometry: syntheticGeometry,
    name: "Synthetic boundary",
    provenance: {
      attribution: "Synthetic test data",
      checksumSha256: "a".repeat(64),
      licenseName: "Synthetic",
      licenseUrl: "https://example.test/license",
      publisher: "Test suite",
      retrievedAt: "2026-10-13T00:00:00.000Z",
      sourceRecordId: "synthetic-boundary",
      sourceUrl: "https://example.test/boundary",
      sourceVersion: "1",
    },
    purpose: "stage0-audit",
    reviewStatus: "approved",
    schemaVersion: boundaryFixtureSchemaVersion,
    slug: "synthetic-boundary",
  };

  it("accepts a fully identified approved fixture", () => {
    expect(() => assertBoundaryReadyForAudit(approvedFixture)).not.toThrow();
  });

  it("rejects a synthetic-only or pending fixture", () => {
    expect(() =>
      assertBoundaryReadyForAudit({ ...approvedFixture, purpose: "synthetic-test" }),
    ).toThrow("not approved");
    expect(() =>
      assertBoundaryReadyForAudit({ ...approvedFixture, reviewStatus: "pending" }),
    ).toThrow("not approved");
  });

  it("rejects an approved fixture without a valid checksum", () => {
    expect(() =>
      assertBoundaryReadyForAudit({
        ...approvedFixture,
        provenance: { ...approvedFixture.provenance, checksumSha256: "missing" },
      }),
    ).toThrow("SHA-256");
  });
});
