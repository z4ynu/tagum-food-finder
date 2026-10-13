import { describe, expect, it } from "vitest";

import { normalizeOpenStreetMapPlace } from "./openstreetmap";

const snapshotVersion = "2026-09-16T20:21:21.000Z";
const retrievedAt = "2026-10-13T00:00:00.000Z";

describe("normalizeOpenStreetMapPlace", () => {
  it("normalizes a named restaurant node and its useful source fields", () => {
    const result = normalizeOpenStreetMapPlace(
      {
        id: 123,
        lat: 7.447,
        lon: 125.807,
        tags: {
          "addr:city": "Tagum",
          "addr:housenumber": "123",
          "addr:street": "Example Street",
          amenity: "restaurant",
          cuisine: "filipino;chicken",
          name: "Example Kitchen",
          opening_hours: "Mo-Su 10:00-21:00",
          phone: "+63 900 000 0000",
        },
        type: "node",
      },
      snapshotVersion,
      retrievedAt,
    );

    expect(result.outcome).toBe("accepted");
    if (result.outcome === "rejected") return;
    expect(result.candidate).toMatchObject({
      address: { addressLine: "123 Example Street", locality: "Tagum" },
      candidateKey: "openstreetmap:node/123",
      coordinates: { latitude: 7.447, longitude: 125.807 },
      openingHoursText: "Mo-Su 10:00-21:00",
    });
    expect(result.candidate.sourceCategoryLabels).toEqual(["amenity:restaurant"]);
    expect(result.candidate.sourceCuisineLabels).toEqual(["filipino", "chicken"]);
  });

  it("uses an area center while leaving coordinate usability for audit review", () => {
    const result = normalizeOpenStreetMapPlace(
      {
        center: { lat: 7.45, lon: 125.81 },
        id: 456,
        tags: { name: "Example Bakery", shop: "bakery" },
        type: "way",
      },
      snapshotVersion,
      retrievedAt,
    );

    expect(result.outcome).toBe("accepted");
    if (result.outcome === "rejected") return;
    expect(result.candidate.coordinates).toEqual({ latitude: 7.45, longitude: 125.81 });
    expect(result.candidate.sourceCategoryLabels).toEqual(["shop:bakery"]);
  });

  it("includes bars and pubs only when their tags state that food is served", () => {
    expect(
      normalizeOpenStreetMapPlace(
        { id: 1, tags: { amenity: "bar", name: "Drinks Only" }, type: "node" },
        snapshotVersion,
        retrievedAt,
      ),
    ).toEqual({ outcome: "rejected", reason: "not-food-place" });

    expect(
      normalizeOpenStreetMapPlace(
        { id: 2, tags: { amenity: "pub", food: "yes", name: "Food Pub" }, type: "node" },
        snapshotVersion,
        retrievedAt,
      ).outcome,
    ).toBe("accepted");
  });

  it("rejects irrelevant, unnamed, or unidentified elements", () => {
    expect(
      normalizeOpenStreetMapPlace(
        { id: 1, tags: { amenity: "bank", name: "Example Bank" }, type: "node" },
        snapshotVersion,
        retrievedAt,
      ),
    ).toEqual({ outcome: "rejected", reason: "not-food-place" });
    expect(
      normalizeOpenStreetMapPlace(
        { id: 2, tags: { amenity: "cafe" }, type: "node" },
        snapshotVersion,
        retrievedAt,
      ),
    ).toEqual({ outcome: "rejected", reason: "missing-name" });
    expect(
      normalizeOpenStreetMapPlace(
        { tags: { amenity: "cafe", name: "No ID" }, type: "node" },
        snapshotVersion,
        retrievedAt,
      ),
    ).toEqual({ outcome: "rejected", reason: "missing-id" });
    expect(
      normalizeOpenStreetMapPlace(
        { id: 3, tags: { amenity: "cafe", name: "Invalid Type" }, type: "feature" },
        snapshotVersion,
        retrievedAt,
      ),
    ).toEqual({ outcome: "rejected", reason: "missing-id" });
  });
});
