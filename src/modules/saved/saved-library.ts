import type { DiscoveryPlace } from "../discovery/model";

export type FavoriteRow = Readonly<{ created_at: string; place_id: string }>;
export type WheelEntryRow = Readonly<{
  wheel_list_id: string;
}>;
export type WheelListRow = Readonly<{
  id: string;
  name: string;
  sort_position: number;
}>;

export type SavedWheelList = Readonly<{
  id: string;
  name: string;
  placeCount: number;
}>;

export type SavedLibrary = Readonly<{
  places: readonly DiscoveryPlace[];
  wheelLists: readonly SavedWheelList[];
}>;

export function buildSavedLibrary(
  catalogPlaces: readonly DiscoveryPlace[],
  favorites: readonly FavoriteRow[],
  wheelLists: readonly WheelListRow[],
  wheelEntries: readonly WheelEntryRow[],
): SavedLibrary {
  const placesById = new Map(catalogPlaces.map((place) => [place.id, place]));
  const places = favorites.flatMap(({ place_id: placeId }) => {
    const place = placesById.get(placeId);
    return place ? [place] : [];
  });

  const entriesByList = new Map<string, WheelEntryRow[]>();
  for (const entry of wheelEntries) {
    const entries = entriesByList.get(entry.wheel_list_id) ?? [];
    entries.push(entry);
    entriesByList.set(entry.wheel_list_id, entries);
  }

  return {
    places,
    wheelLists: wheelLists.map((list) => {
      return {
        id: list.id,
        name: list.name,
        placeCount: (entriesByList.get(list.id) ?? []).length,
      };
    }),
  };
}
