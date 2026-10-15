import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { boundaryFixtureSchemaVersion, type BoundaryFixture } from "../audit/boundary";
import { buildOsmCatalogImport, type OsmExtractionManifest } from "./osm-import-payload";

function feature(id: number, name: string, tags: Record<string, string>) {
  return `\u001e${JSON.stringify({
    geometry: { coordinates: [125.807, 7.447], type: "Point" },
    properties: { "@id": id, "@type": "node", name, ...tags },
    type: "Feature",
  })}`;
}

function fixture(snapshot: Buffer): {
  boundary: BoundaryFixture;
  manifest: OsmExtractionManifest;
} {
  const checksum = "a".repeat(64);
  return {
    boundary: {
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
        name: "Tagum",
        referenceCode: "1102319000",
        referenceSystem: "PSGC-10",
        verificationUrl: "https://example.com/tagum",
        verifiedAt: "2026-10-13T00:00:00.000Z",
      },
      name: "Tagum test boundary",
      provenance: {
        attribution: "OpenStreetMap contributors",
        checksumSha256: checksum,
        licenseName: "ODbL",
        licenseUrl: "https://www.openstreetmap.org/copyright",
        publisher: "OpenStreetMap contributors",
        retrievedAt: "2026-10-13T00:00:00.000Z",
        sourceRecordId: "relation/15986415",
        sourceUrl: "https://www.openstreetmap.org/relation/15986415",
        sourceVersion: "osm-relation-15986415-v8",
      },
      purpose: "stage0-audit",
      reviewStatus: "approved",
      schemaVersion: boundaryFixtureSchemaVersion,
      slug: "tagum-city",
    },
    manifest: {
      boundary: { sha256: checksum },
      generatedAt: "2026-10-13T13:10:45.000Z",
      outputs: {
        geoJsonSequenceFile: "snapshot.geojsonseq",
        geoJsonSequenceRecords: snapshot.toString("utf8").split("\n").length,
        geoJsonSequenceSha256: createHash("sha256").update(snapshot).digest("hex"),
      },
      source: { md5: "b".repeat(32), version: "osm-test-1" },
    },
  };
}

describe("buildOsmCatalogImport", () => {
  it("creates deterministic publishable and review-only records", () => {
    const snapshot = Buffer.from(
      [
        feature(10, "Tagum Café", { amenity: "cafe", cuisine: "coffee;breakfast" }),
        feature(11, "Local Deli", { shop: "deli" }),
      ].join("\n"),
    );
    const input = fixture(snapshot);

    const first = buildOsmCatalogImport({
      ...input,
      snapshot,
      snapshotFileName: "snapshot.geojsonseq",
    });
    const second = buildOsmCatalogImport({
      ...input,
      snapshot,
      snapshotFileName: "snapshot.geojsonseq",
    });

    expect(second).toEqual(first);
    expect(first.summary).toMatchObject({ insideBoundary: 2, reviewRequired: 1, usable: 1 });
    expect(first.records[0]).toMatchObject({
      externalRecordKey: "node/10",
      normalizedPayload: {
        category: { slug: "cafe", usability: "usable" },
        cuisineLabels: ["breakfast", "coffee"],
        placeSlug: "tagum-cafe-10",
      },
    });
    expect(first.records[0].contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.records[1].normalizedPayload.category.usability).toBe("review-required");
  });

  it("rejects a snapshot that does not match its manifest", () => {
    const snapshot = Buffer.from(feature(10, "Tagum Cafe", { amenity: "cafe" }));
    const input = fixture(snapshot);

    expect(() =>
      buildOsmCatalogImport({
        ...input,
        snapshot: Buffer.from(`${snapshot.toString("utf8")} `),
        snapshotFileName: "snapshot.geojsonseq",
      }),
    ).toThrow("Snapshot SHA-256");
  });
});
