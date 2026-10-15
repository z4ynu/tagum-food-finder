import { describe, expect, it } from "vitest";

import type { DiscoveryPlace } from "../discovery/model";

import { defaultWheelEntries, wheelEntryDestination } from "./catalog-wheel-entries";

const PLACE: DiscoveryPlace = {
  address: "Rizal Street",
  category: "Fast Food",
  coordinates: { latitude: 7.4480091, longitude: 125.8068713 },
  cravings: { level: "unknown", values: [] },
  cuisines: [],
  id: "fd32ebad-88cc-403e-a254-d8f4b36b7160",
  name: "Sarah's Delicious Mami",
  occasions: { level: "unknown", values: [] },
  price: { level: "unknown", maximumPerPersonPhp: null, minimumPerPersonPhp: null },
  profileSlug: "sarah-s-delicious-mami-11263235570",
  sourceLabel: "OpenStreetMap",
};

describe("defaultWheelEntries", () => {
  it("creates defaults only for places in the active catalog", () => {
    expect(defaultWheelEntries([PLACE])).toEqual([
      {
        id: PLACE.id,
        label: PLACE.name,
        placeSlug: PLACE.profileSlug,
      },
    ]);
  });
});

describe("wheelEntryDestination", () => {
  it("uses exact coordinates for a catalog-backed entry", () => {
    const [entry] = defaultWheelEntries([PLACE]);
    expect(wheelEntryDestination(entry, [PLACE])).toContain("7.4480091%2C125.8068713");
  });

  it("falls back to a named Tagum search for a typed entry", () => {
    expect(
      wheelEntryDestination({ id: "typed", label: "My Food Place", placeSlug: null }, [PLACE]),
    ).toBe("https://www.google.com/maps/search/?api=1&query=My%20Food%20Place%2C%20Tagum%20City");
  });
});
