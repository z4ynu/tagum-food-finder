import { describe, expect, it } from "vitest";

import type { DiscoveryPlace } from "../discovery/model";
import {
  normalizeWheelEntryMutations,
  wheelEntriesFromPersistence,
  wheelEntryMutations,
} from "./wheel-persistence";

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

describe("wheel persistence", () => {
  it("validates and normalizes a bounded mutation payload", () => {
    expect(normalizeWheelEntryMutations([{ label: "  Mami  ", placeId: null }])).toEqual([
      { label: "Mami", placeId: null },
    ]);
    expect(normalizeWheelEntryMutations([{ label: "", placeId: null }])).toBeNull();
    expect(
      normalizeWheelEntryMutations(
        Array.from({ length: 51 }, () => ({ label: "Mami", placeId: null })),
      ),
    ).toBeNull();
  });

  it("maps catalog-backed and custom entries in both directions", () => {
    const entries = wheelEntriesFromPersistence(
      [
        { id: "entry-1", label: "Tagum Cafe", placeId: PLACE.id },
        { id: "entry-2", label: "Secret carinderia", placeId: null },
      ],
      [PLACE],
    );

    expect(entries).toEqual([
      { id: "entry-1", label: "Tagum Cafe", placeSlug: "tagum-cafe-10" },
      { id: "entry-2", label: "Secret carinderia", placeSlug: null },
    ]);
    expect(wheelEntryMutations(entries, [PLACE])).toEqual([
      { label: "Tagum Cafe", placeId: PLACE.id },
      { label: "Secret carinderia", placeId: null },
    ]);
  });
});
