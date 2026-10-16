import { describe, expect, it } from "vitest";

import { normalizeFoursquarePlaceDetails, parseFoursquarePlacesConfig } from "./place-details";

describe("parseFoursquarePlacesConfig", () => {
  it("stays disabled until a server service key is configured", () => {
    expect(parseFoursquarePlacesConfig({})).toEqual({
      reason: "missing-service-key",
      status: "disabled",
    });
  });

  it("normalizes a configured service key without exposing it publicly", () => {
    expect(
      parseFoursquarePlacesConfig({ FOURSQUARE_PLACES_SERVICE_KEY: " secret-value " }),
    ).toEqual({
      apiVersion: "2025-06-17",
      serviceKey: "secret-value",
      status: "configured",
    });
  });
});

describe("normalizeFoursquarePlaceDetails", () => {
  it("keeps only approved enrichment fields and bounded photo references", () => {
    const result = normalizeFoursquarePlaceDetails(
      {
        description: " A neighborhood cafe. ",
        fsq_place_id: "fsq-123",
        name: "Tagum Cafe",
        photos: [
          {
            classifications: ["food", "menu"],
            fsq_photo_id: "photo-1",
            height: 800,
            prefix: "https://fastly.4sqi.net/img/general/",
            suffix: "/photo-1.jpg",
            width: 1200,
          },
          ...Array.from({ length: 6 }, (_, index) => ({
            fsq_photo_id: `photo-${index + 2}`,
            prefix: "https://fastly.4sqi.net/img/general/",
            suffix: `/photo-${index + 2}.jpg`,
          })),
        ],
        price: 2,
        rating: 9.5,
        tips: [{ text: "Not retained" }],
      },
      "2026-10-16T00:00:00.000Z",
    );

    expect(result).toMatchObject({
      attribution: "Foursquare",
      description: "A neighborhood cafe.",
      fsqPlaceId: "fsq-123",
      name: "Tagum Cafe",
      priceTier: 2,
    });
    expect(result?.photoReferences).toHaveLength(5);
    expect(result).not.toHaveProperty("rating");
    expect(result).not.toHaveProperty("tips");
  });

  it("rejects responses without a stable place identifier", () => {
    expect(normalizeFoursquarePlaceDetails({ name: "No ID" }, "2026-10-16T00:00:00Z")).toBeNull();
  });

  it("keeps unsupported prices and malformed photos unknown", () => {
    expect(
      normalizeFoursquarePlaceDetails(
        {
          fsq_place_id: "fsq-123",
          photos: [{ fsq_photo_id: "missing-url-parts" }],
          price: 9,
        },
        "2026-10-16T00:00:00Z",
      ),
    ).toMatchObject({ photoReferences: [], priceTier: null });
  });
});
