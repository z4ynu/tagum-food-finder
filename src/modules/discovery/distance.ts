import type { Coordinates } from "./model";

const EARTH_RADIUS_KILOMETERS = 6371.0088;

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceInKilometers(origin: Coordinates, destination: Coordinates) {
  const latitudeDelta = degreesToRadians(destination.latitude - origin.latitude);
  const longitudeDelta = degreesToRadians(destination.longitude - origin.longitude);
  const originLatitude = degreesToRadians(origin.latitude);
  const destinationLatitude = degreesToRadians(destination.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) * Math.cos(destinationLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_KILOMETERS * Math.asin(Math.sqrt(haversine));
}

export function formatDistance(distanceKilometers: number) {
  if (distanceKilometers < 1) {
    return `${Math.max(10, Math.round((distanceKilometers * 1000) / 10) * 10)} m`;
  }

  return `${distanceKilometers.toFixed(distanceKilometers < 10 ? 1 : 0)} km`;
}
