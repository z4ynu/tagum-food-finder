import { describe, expect, it } from "vitest";

import { candidateSchemaVersion, type NormalizedPlaceCandidate } from "./candidate";
import { assessSourceCategory } from "./source-category";

function createCandidate(
  sourceSlug: string,
  sourceCategoryLabels: readonly string[],
): NormalizedPlaceCandidate {
  return {
    address: null,
    alternateNames: [],
    candidateKey: `${sourceSlug}:example`,
    contacts: { email: null, phone: null, social: [], website: null },
    coordinates: { latitude: 7.447, longitude: 125.807 },
    name: "Example",
    openingHoursText: null,
    retrievedAt: "2026-10-13T00:00:00.000Z",
    schemaVersion: candidateSchemaVersion,
    source: { recordId: "example", slug: sourceSlug, snapshotVersion: "1" },
    sourceCategoryLabels,
    sourceClosedAt: null,
    sourceCuisineLabels: [],
    sourceUpdatedAt: null,
  };
}

describe("assessSourceCategory", () => {
  it("maps direct OSM food-place tags to reviewed audit categories", () => {
    expect(assessSourceCategory(createCandidate("openstreetmap", ["amenity:restaurant"]))).toEqual({
      category: "restaurant",
      matchedLabel: "amenity:restaurant",
      usability: "usable",
    });
    expect(assessSourceCategory(createCandidate("openstreetmap", ["shop:bakery"]))).toEqual({
      category: "bakery",
      matchedLabel: "shop:bakery",
      usability: "usable",
    });
  });

  it("requires review for retail tags that do not guarantee prepared food", () => {
    expect(assessSourceCategory(createCandidate("openstreetmap", ["shop:coffee"]))).toEqual({
      category: "prepared-food-shop",
      matchedLabel: "shop:coffee",
      usability: "review-required",
    });
  });

  it("maps reviewed Foursquare category paths without substring false positives", () => {
    expect(
      assessSourceCategory(
        createCandidate("foursquare-os-places", [
          "Dining and Drinking > Restaurant > Filipino Restaurant",
        ]),
      ),
    ).toEqual({
      category: "restaurant",
      matchedLabel: "Dining and Drinking > Restaurant > Filipino Restaurant",
      usability: "usable",
    });
    expect(
      assessSourceCategory(
        createCandidate("foursquare-os-places", ["Retail > Restaurant Supply Store"]),
      ),
    ).toEqual({ category: null, matchedLabel: null, usability: "unmapped" });
  });

  it("keeps unknown providers and labels unmapped", () => {
    expect(assessSourceCategory(createCandidate("unknown", ["restaurant"]))).toEqual({
      category: null,
      matchedLabel: null,
      usability: "unmapped",
    });
  });
});
