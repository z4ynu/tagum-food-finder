import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { boundaryFixtureSchemaVersion, type BoundaryFixture } from "../audit/boundary";
import {
  buildOvertureCatalogImport,
  type OvertureExtractionManifest,
} from "./overture-import-payload";

function record(
  id: string,
  name: string,
  primary: string,
  confidence: number,
  coordinates: readonly [number, number] = [125.807, 7.447],
  sources: readonly Readonly<Record<string, unknown>>[] = [
    { dataset: "meta", update_time: "2026-09-01" },
  ],
) {
  return JSON.stringify({
    addresses: [{ country: "PH", freeform: "Tagum City", locality: "Tagum" }],
    confidence,
    geometry: { coordinates, type: "Point" },
    id,
    names: { primary: name },
    socials: [`https://www.facebook.com/${id}`],
    sources,
    taxonomy: { hierarchy: ["food_and_drink", primary], primary },
    websites: [`https://${id}.example.test`],
  });
}

function fixture(snapshot: Buffer): {
  boundary: BoundaryFixture;
  manifest: OvertureExtractionManifest;
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
      generatedAt: "2026-10-16T00:00:00.000Z",
      outputs: {
        jsonLinesFile: "snapshot.jsonl",
        jsonLinesRecords: snapshot.toString("utf8").split("\n").length,
        jsonLinesSha256: createHash("sha256").update(snapshot).digest("hex"),
      },
      source: {
        release: "2026-09-23.1",
        url: "s3://overturemaps-us-west-2/release/2026-09-23.1/theme=places/type=place/*",
      },
    },
  };
}

describe("buildOvertureCatalogImport", () => {
  it("builds deterministic publishable and review-only records", () => {
    const snapshot = Buffer.from(
      [
        record("gers-1", "Tagum Kitchen", "filipino_restaurant", 0.91, undefined, [
          { dataset: "meta", update_time: "2026-09-01" },
          { dataset: "foursquare", record_id: "fsq-123", update_time: "2026-09-02" },
        ]),
        record("gers-2", "Night Bar", "bar", 0.95),
        record("gers-3", "Low Confidence Cafe", "cafe", 0.4),
      ].join("\n"),
    );
    const input = fixture(snapshot);
    const first = buildOvertureCatalogImport({
      ...input,
      snapshot,
      snapshotFileName: "snapshot.jsonl",
    });
    const second = buildOvertureCatalogImport({
      ...input,
      snapshot,
      snapshotFileName: "snapshot.jsonl",
    });

    expect(second).toEqual(first);
    expect(first.summary).toMatchObject({
      autoPublishEligible: 1,
      insideBoundary: 3,
      reviewRequired: 1,
      usable: 2,
    });
    expect(first.records[0]).toMatchObject({
      externalRecordKey: "gers-1",
      normalizedPayload: {
        category: { slug: "restaurant", usability: "usable" },
        confidence: 0.91,
        cuisineLabels: ["Filipino"],
        placeSlug: "tagum-kitchen-gers-1",
        providerReferences: [{ externalKey: "fsq-123", provider: "foursquare" }],
      },
    });
    expect(first.records[0].contentHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects snapshots that do not match the manifest", () => {
    const snapshot = Buffer.from(record("gers-1", "Tagum Kitchen", "restaurant", 0.9));
    const input = fixture(snapshot);
    expect(() =>
      buildOvertureCatalogImport({
        ...input,
        snapshot: Buffer.from(`${snapshot.toString("utf8")} `),
        snapshotFileName: "snapshot.jsonl",
      }),
    ).toThrow("Snapshot SHA-256");
  });
});
