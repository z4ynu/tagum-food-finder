import { describe, expect, it } from "vitest";

import type { DiscoveryPlace } from "../discovery/model";
import { buildSavedLibrary } from "./saved-library";

const PLACE: DiscoveryPlace = {
  address: null,
  category: "Cafe",
  coordinates: { latitude: 7.448, longitude: 125.807 },
  cravings: { level: "unknown", values: [] },
  cuisines: [],
  id: "fd32ebad-88cc-403e-a254-d8f4b36b7160",
  name: "Tagum Cafe",
  occasions: { level: "unknown", values: [] },
  price: { level: "unknown", maximumPerPersonPhp: null, minimumPerPersonPhp: null },
  profileSlug: "tagum-cafe-10",
  sourceLabel: "OpenStreetMap",
};

describe("buildSavedLibrary", () => {
  it("keeps only active catalog favorites and derives wheel counts and destinations", () => {
    const library = buildSavedLibrary(
      [PLACE],
      [
        { created_at: "2026-10-15T02:00:00Z", place_id: PLACE.id },
        { created_at: "2026-10-15T01:00:00Z", place_id: "a80a01b8-0c8a-4453-9486-f75f50ee1550" },
      ],
      [{ id: "81b32b3b-7e4b-4444-ac1f-13fc00de9ddd", name: "Friday", sort_position: 0 }],
      [
        { wheel_list_id: "81b32b3b-7e4b-4444-ac1f-13fc00de9ddd" },
        { wheel_list_id: "81b32b3b-7e4b-4444-ac1f-13fc00de9ddd" },
      ],
    );

    expect(library.places).toEqual([PLACE]);
    expect(library.wheelLists).toEqual([
      {
        id: "81b32b3b-7e4b-4444-ac1f-13fc00de9ddd",
        name: "Friday",
        placeCount: 2,
      },
    ]);
  });
});
