import { describe, expect, it } from "vitest";

import { readOsmGeoJsonSequence } from "./osm-geojson-sequence";

const options = {
  retrievedAt: "2026-10-13T00:00:00.000Z",
  snapshotVersion: "geofabrik-philippines-2026-10-12T23:01:00Z",
};

function line(value: unknown): string {
  return `\u001e${JSON.stringify(value)}`;
}

describe("readOsmGeoJsonSequence", () => {
  it("reads source points and preserves Osmium identity attributes", () => {
    const result = readOsmGeoJsonSequence(
      line({
        geometry: { coordinates: [125.807, 7.447], type: "Point" },
        properties: {
          "@id": 123,
          "@timestamp": "2026-09-29T12:00:00Z",
          "@type": "node",
          amenity: "restaurant",
          name: "Example Kitchen",
        },
        type: "Feature",
      }),
      options,
    );

    expect(result.recordsRead).toBe(1);
    expect(result.collapsedSourceDuplicates).toBe(0);
    expect(result.rejected).toEqual({
      "invalid-feature": 0,
      "missing-id": 0,
      "missing-name": 0,
      "not-food-place": 0,
    });
    expect(result.accepted[0]).toMatchObject({
      candidate: {
        candidateKey: "openstreetmap:node/123",
        coordinates: { latitude: 7.447, longitude: 125.807 },
        sourceUpdatedAt: "2026-09-29T12:00:00.000Z",
      },
      coordinateMethod: "source-point",
    });
  });

  it("derives a deterministic representative point for an area feature", () => {
    const result = readOsmGeoJsonSequence(
      line({
        geometry: {
          coordinates: [
            [
              [125.8, 7.4],
              [125.82, 7.4],
              [125.82, 7.42],
              [125.8, 7.42],
              [125.8, 7.4],
            ],
          ],
          type: "Polygon",
        },
        properties: { "@id": 456, "@type": "way", name: "Area Cafe", amenity: "cafe" },
        type: "Feature",
      }),
      options,
    );

    expect(result.accepted[0].coordinateMethod).toBe("polygon-representative");
    expect(result.accepted[0].candidate.coordinates?.longitude).toBeCloseTo(125.81);
    expect(result.accepted[0].candidate.coordinates?.latitude).toBeCloseTo(7.41);
  });

  it("counts malformed and adapter-rejected records without hiding them", () => {
    const input = [
      "not-json",
      line({
        geometry: { coordinates: [125.8, 7.4], type: "Point" },
        properties: { "@id": 1, "@type": "node", amenity: "restaurant" },
        type: "Feature",
      }),
      line({
        geometry: { coordinates: [125.8, 7.4], type: "Point" },
        properties: { "@id": 2, "@type": "node", name: "Not Food", tourism: "hotel" },
        type: "Feature",
      }),
    ].join("\n");

    const result = readOsmGeoJsonSequence(input, options);
    expect(result.accepted).toHaveLength(0);
    expect(result.rejected).toEqual({
      "invalid-feature": 1,
      "missing-id": 0,
      "missing-name": 1,
      "not-food-place": 1,
    });
  });

  it("collapses duplicate source identities and keeps the best geometry", () => {
    const sharedProperties = {
      "@id": 456,
      "@type": "way",
      amenity: "cafe",
      name: "Area Cafe",
    };
    const input = [
      line({
        geometry: {
          coordinates: [
            [125.8, 7.4],
            [125.82, 7.42],
          ],
          type: "LineString",
        },
        properties: sharedProperties,
        type: "Feature",
      }),
      line({
        geometry: {
          coordinates: [
            [
              [125.8, 7.4],
              [125.82, 7.4],
              [125.82, 7.42],
              [125.8, 7.42],
              [125.8, 7.4],
            ],
          ],
          type: "Polygon",
        },
        properties: sharedProperties,
        type: "Feature",
      }),
    ].join("\n");

    const result = readOsmGeoJsonSequence(input, options);

    expect(result.recordsRead).toBe(2);
    expect(result.collapsedSourceDuplicates).toBe(1);
    expect(result.accepted).toHaveLength(1);
    expect(result.accepted[0].coordinateMethod).toBe("polygon-representative");
  });

  it("enforces byte and record bounds", () => {
    expect(() => readOsmGeoJsonSequence("12345", { ...options, maxBytes: 4 })).toThrow(
      "byte reader limit",
    );
    expect(() =>
      readOsmGeoJsonSequence(["{}", "{}"].join("\n"), { ...options, maxRecords: 1 }),
    ).toThrow("record reader limit");
  });
});
