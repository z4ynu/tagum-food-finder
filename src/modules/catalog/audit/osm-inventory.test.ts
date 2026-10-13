import { describe, expect, it } from "vitest";
import type { OsmSnapshotReadResult } from "../sources/osm-geojson-sequence";
import type { BoundaryFixture } from "./boundary";
import type { NormalizedPlaceCandidate } from "./candidate";
import { createOsmPlaceInventory } from "./osm-inventory";

const boundary: BoundaryFixture = {
  geometry: {
    coordinates: [
      [
        [
          [125.7, 7.3],
          [125.9, 7.3],
          [125.9, 7.6],
          [125.7, 7.6],
          [125.7, 7.3],
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
    verificationUrl: "https://example.com/psgc",
    verifiedAt: "2026-10-13T00:00:00Z",
  },
  name: "City of Tagum",
  provenance: {
    attribution: "OpenStreetMap contributors",
    checksumSha256: "a".repeat(64),
    licenseName: "ODbL 1.0",
    licenseUrl: "https://opendatacommons.org/licenses/odbl/1-0/",
    publisher: "OpenStreetMap contributors",
    retrievedAt: "2026-10-13T00:00:00Z",
    sourceRecordId: "relation/15986415",
    sourceUrl: "https://www.openstreetmap.org/relation/15986415",
    sourceVersion: "8",
  },
  purpose: "stage0-audit",
  reviewStatus: "approved",
  schemaVersion: 1,
  slug: "tagum-test",
};

function candidate(
  id: string,
  name: string,
  coordinates: NormalizedPlaceCandidate["coordinates"],
  labels: readonly string[],
): NormalizedPlaceCandidate {
  return {
    address: {
      addressLine: id === "1" ? "1 Test Street" : null,
      barangayLabel: null,
      countryCode: "PH",
      locality: "Tagum",
      postalCode: null,
      region: null,
    },
    alternateNames: [],
    candidateKey: `openstreetmap:node/${id}`,
    contacts: { email: null, phone: null, social: [], website: null },
    coordinates,
    name,
    openingHoursText: null,
    retrievedAt: "2026-10-13T00:00:00Z",
    schemaVersion: 1,
    source: { recordId: `node/${id}`, slug: "openstreetmap", snapshotVersion: "test" },
    sourceCategoryLabels: labels,
    sourceClosedAt: null,
    sourceCuisineLabels: [],
    sourceUpdatedAt: null,
  };
}

describe("createOsmPlaceInventory", () => {
  it("aggregates only in-boundary candidates without exposing row data", () => {
    const snapshot: OsmSnapshotReadResult = {
      accepted: [
        {
          candidate: candidate("1", "Cafe Uno", { latitude: 7.4, longitude: 125.8 }, [
            "amenity:cafe",
          ]),
          coordinateMethod: "source-point",
        },
        {
          candidate: candidate("2", "Café Uno", { latitude: 7.4001, longitude: 125.8001 }, [
            "amenity:cafe",
          ]),
          coordinateMethod: "source-point",
        },
        {
          candidate: candidate("3", "Deli", { latitude: 7.7, longitude: 125.8 }, ["shop:deli"]),
          coordinateMethod: "source-point",
        },
        {
          candidate: candidate("4", "No Point", null, ["amenity:restaurant"]),
          coordinateMethod: "missing",
        },
      ],
      recordsRead: 6,
      rejected: { "invalid-feature": 1, "missing-id": 0, "missing-name": 1, "not-food-place": 0 },
    };

    const result = createOsmPlaceInventory(snapshot, boundary);

    expect(result.boundary).toEqual({
      inside: 2,
      "invalid-coordinate": 0,
      "missing-coordinate": 1,
      outside: 1,
    });
    expect(result.categories.usability).toEqual({ usable: 2, "review-required": 0, unmapped: 0 });
    expect(result.duplicates).toMatchObject({ extraRows: 1, groups: 1 });
    expect(result.fieldCompleteness).toMatchObject({ "address-line": 1, locality: 2 });
    expect(JSON.stringify(result)).not.toContain("Cafe Uno");
    expect(JSON.stringify(result)).not.toContain("openstreetmap:node/1");
  });

  it("rejects a boundary that is not approved", () => {
    expect(() =>
      createOsmPlaceInventory(
        {
          accepted: [],
          recordsRead: 0,
          rejected: {
            "invalid-feature": 0,
            "missing-id": 0,
            "missing-name": 0,
            "not-food-place": 0,
          },
        },
        { ...boundary, reviewStatus: "pending" },
      ),
    ).toThrow("not approved");
  });
});
