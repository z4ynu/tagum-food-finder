import type { DiscoveryPlace } from "./model";

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function placeProfileSlug(place: DiscoveryPlace) {
  const sourceId = place.id.split("/").at(-1);
  return `${slugify(place.name)}-${sourceId ?? slugify(place.id)}`;
}

export function placeProfilePath(place: DiscoveryPlace) {
  return `/places/${placeProfileSlug(place)}` as const;
}

export function findPlaceByProfileSlug(places: readonly DiscoveryPlace[], profileSlug: string) {
  return places.find((place) => placeProfileSlug(place) === profileSlug) ?? null;
}
