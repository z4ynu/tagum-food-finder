import { describe, expect, it } from "vitest";

import { PROTOTYPE_PLACES } from "./prototype-places";
import { findPlaceByProfileSlug, placeProfilePath, placeProfileSlug } from "./place-profile-path";

describe("place profile paths", () => {
  it("creates a readable URL-safe slug with a stable source suffix", () => {
    const sarahsMami = PROTOTYPE_PLACES.find((place) => place.name === "Sarah's Delicious Mami");

    if (!sarahsMami) {
      throw new Error("Expected Sarah's Delicious Mami in prototype fixtures");
    }
    expect(placeProfileSlug(sarahsMami)).toBe("sarah-s-delicious-mami-11263235570");
    expect(placeProfilePath(sarahsMami)).toBe("/places/sarah-s-delicious-mami-11263235570");
  });

  it("keeps every prototype profile path unique", () => {
    const slugs = PROTOTYPE_PLACES.map(placeProfileSlug);

    expect(new Set(slugs).size).toBe(PROTOTYPE_PLACES.length);
  });

  it("resolves known slugs and rejects unknown slugs", () => {
    const place = PROTOTYPE_PLACES[0];

    expect(findPlaceByProfileSlug(PROTOTYPE_PLACES, placeProfileSlug(place))).toBe(place);
    expect(findPlaceByProfileSlug(PROTOTYPE_PLACES, "missing-place-123")).toBeNull();
  });
});
