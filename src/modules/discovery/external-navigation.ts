import type { Coordinates } from "./model";

function coordinatePair(destination: Coordinates) {
  return `${destination.latitude},${destination.longitude}`;
}

export function googleMapsDirectionsUrl(destination: Coordinates) {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", coordinatePair(destination));
  return url.toString();
}

export function wazeDirectionsUrl(destination: Coordinates) {
  const url = new URL("https://www.waze.com/ul");
  url.searchParams.set("ll", coordinatePair(destination));
  url.searchParams.set("navigate", "yes");
  return url.toString();
}
