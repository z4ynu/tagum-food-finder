import { describe, expect, it } from "vitest";

import { getPlaceMatchState, rankPlaces } from "./filter-places";
import type { DiscoveryFilters, DiscoveryPlace } from "./model";

const PLACE: DiscoveryPlace = {
  address: "Quezon Street",
  category: "Fast food",
  coordinates: { latitude: 7.4488855, longitude: 125.8037407 },
  cravings: { level: "source", values: ["Pizza"] },
  cuisines: ["Pizza"],
  id: "openstreetmap:node/11225970385",
  name: "Pizzakaya",
  occasions: { level: "unknown", values: [] },
  price: { level: "unknown", maximumPerPersonPhp: null, minimumPerPersonPhp: null },
  sourceLabel: "OpenStreetMap",
};

const EMPTY_FILTERS: DiscoveryFilters = {
  budgetMaximumPhp: null,
  craving: null,
  occasion: null,
  query: "",
};

describe("getPlaceMatchState", () => {
  it("keeps an unfiltered sourced place in the confirmed browsing group", () => {
    expect(getPlaceMatchState(PLACE, EMPTY_FILTERS)).toBe("confirmed");
  });

  it("labels a source-supported craving as probable", () => {
    expect(getPlaceMatchState(PLACE, { ...EMPTY_FILTERS, craving: "Pizza" })).toBe("probable");
  });

  it("keeps missing occasion evidence as unknown", () => {
    expect(getPlaceMatchState(PLACE, { ...EMPTY_FILTERS, occasion: "Date night" })).toBe("unknown");
  });

  it("does not interpret missing prices as a failed budget match", () => {
    expect(getPlaceMatchState(PLACE, { ...EMPTY_FILTERS, budgetMaximumPhp: 250 })).toBe("unknown");
  });

  it("excludes a known nonmatching craving", () => {
    expect(getPlaceMatchState(PLACE, { ...EMPTY_FILTERS, craving: "Coffee" })).toBe("excluded");
  });
});

describe("rankPlaces", () => {
  it("sorts known matches before unknown fallbacks and then by distance", () => {
    const unknownPlace: DiscoveryPlace = {
      ...PLACE,
      cravings: { level: "unknown", values: [] },
      id: "unknown",
      name: "Unknown place",
    };
    const results = rankPlaces(
      [unknownPlace, PLACE],
      { latitude: 7.4478, longitude: 125.807 },
      { ...EMPTY_FILTERS, craving: "Pizza" },
    );

    expect(results.map((result) => result.place.id)).toEqual([PLACE.id, "unknown"]);
  });
});
