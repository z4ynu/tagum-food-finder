import { googleMapsDirectionsUrl } from "../discovery/external-navigation";
import type { DiscoveryPlace } from "../discovery/model";
import { findPlaceByProfileSlug, placeProfileSlug } from "../discovery/place-profile-path";

const DEFAULT_PLACE_NAMES = [
  "Sarah's Delicious Mami",
  "The Palm City Food Park",
  "Tagum Pie",
  "Pizza Treat",
  "Pizzakaya",
] as const;

export type WheelEntry = Readonly<{
  id: string;
  label: string;
  placeSlug: string | null;
}>;

export function defaultWheelEntries(places: readonly DiscoveryPlace[]): readonly WheelEntry[] {
  return DEFAULT_PLACE_NAMES.flatMap((name) => {
    const place = places.find((candidate) => candidate.name === name);
    return place ? [{ id: place.id, label: place.name, placeSlug: placeProfileSlug(place) }] : [];
  });
}

export function wheelEntryDestination(
  entry: WheelEntry,
  places: readonly DiscoveryPlace[],
): string {
  const place = entry.placeSlug ? findPlaceByProfileSlug(places, entry.placeSlug) : null;
  return place
    ? googleMapsDirectionsUrl(place.coordinates)
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${entry.label}, Tagum City`)}`;
}
