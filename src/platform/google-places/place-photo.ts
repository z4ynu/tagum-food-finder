import "server-only";

import { distanceInKilometers } from "../../modules/discovery/distance";
import type { Coordinates } from "../../modules/discovery/model";

const GOOGLE_PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const GOOGLE_PLACES_FIELD_MASK = "places.id,places.displayName,places.location,places.photos";
const MAX_MATCH_DISTANCE_KILOMETERS = 0.6;
const MAX_RESULTS = 5;

export type GooglePhotoAttribution = Readonly<{
  displayName: string;
  uri: string | null;
}>;

export type GooglePlacePhoto = Readonly<{
  attributions: readonly GooglePhotoAttribution[];
  height: number | null;
  name: string;
  width: number | null;
}>;

export type GooglePlacePhotoMatch = Readonly<{
  googlePlaceId: string;
  photo: GooglePlacePhoto;
}>;

export type GooglePlacesPhotoResult =
  | Readonly<{ status: "disabled"; reason: "missing-api-key" }>
  | Readonly<{ status: "not-found" }>
  | Readonly<{ status: "rate-limited" }>
  | Readonly<{ status: "provider-error"; httpStatus: number | null }>
  | Readonly<{ status: "success"; match: GooglePlacePhotoMatch }>;

type PlacePhotoQuery = Readonly<{
  address: string | null;
  coordinates: Coordinates;
  name: string;
}>;

type GooglePlacesConfigInput = Readonly<{ GOOGLE_PLACES_API_KEY?: string }>;

export type GooglePlacesConfig =
  | Readonly<{ status: "disabled"; reason: "missing-api-key" }>
  | Readonly<{ status: "configured"; apiKey: string }>;

type NormalizedCandidate = Readonly<{
  coordinates: Coordinates;
  googlePlaceId: string;
  name: string;
  photos: readonly GooglePlacePhoto[];
}>;

function optionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}

function optionalPositiveInteger(value: unknown): number | null {
  return Number.isInteger(value) && (value as number) > 0 ? (value as number) : null;
}

function httpsUrl(value: unknown): string | null {
  const normalized = optionalText(value);
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function normalizeName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function nameMatchScore(expected: string, candidate: string) {
  const normalizedExpected = normalizeName(expected);
  const normalizedCandidate = normalizeName(candidate);
  if (!normalizedExpected || !normalizedCandidate) return 0;
  if (normalizedExpected === normalizedCandidate) return 1;
  if (
    normalizedExpected.length >= 5 &&
    (normalizedExpected.includes(normalizedCandidate) ||
      normalizedCandidate.includes(normalizedExpected))
  ) {
    return 0.88;
  }

  const expectedTokens = new Set(normalizedExpected.split(" "));
  const candidateTokens = new Set(normalizedCandidate.split(" "));
  const intersection = [...expectedTokens].filter((token) => candidateTokens.has(token)).length;
  const union = new Set([...expectedTokens, ...candidateTokens]).size;
  return union === 0 ? 0 : intersection / union;
}

function normalizeAttributions(value: unknown): readonly GooglePhotoAttribution[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const attribution = entry as Readonly<Record<string, unknown>>;
    const displayName = optionalText(attribution.displayName);
    if (!displayName) return [];
    return [{ displayName, uri: httpsUrl(attribution.uri) }];
  });
}

function normalizePhoto(value: unknown): GooglePlacePhoto | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const photo = value as Readonly<Record<string, unknown>>;
  const name = optionalText(photo.name);
  if (!name || !/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(name)) return null;
  return {
    attributions: normalizeAttributions(photo.authorAttributions),
    height: optionalPositiveInteger(photo.heightPx),
    name,
    width: optionalPositiveInteger(photo.widthPx),
  };
}

function normalizeCandidate(value: unknown): NormalizedCandidate | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const place = value as Readonly<Record<string, unknown>>;
  const displayName =
    place.displayName && typeof place.displayName === "object" && !Array.isArray(place.displayName)
      ? optionalText((place.displayName as Readonly<Record<string, unknown>>).text)
      : null;
  const location =
    place.location && typeof place.location === "object" && !Array.isArray(place.location)
      ? (place.location as Readonly<Record<string, unknown>>)
      : null;
  const latitude = location?.latitude;
  const longitude = location?.longitude;
  const googlePlaceId = optionalText(place.id);
  const photos = Array.isArray(place.photos)
    ? place.photos.flatMap((photo) => {
        const normalized = normalizePhoto(photo);
        return normalized ? [normalized] : [];
      })
    : [];

  if (
    !displayName ||
    !googlePlaceId ||
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    typeof longitude !== "number" ||
    !Number.isFinite(longitude) ||
    photos.length === 0
  ) {
    return null;
  }

  return {
    coordinates: { latitude, longitude },
    googlePlaceId,
    name: displayName,
    photos,
  };
}

export function parseGooglePlacesConfig(environment: GooglePlacesConfigInput): GooglePlacesConfig {
  const apiKey = environment.GOOGLE_PLACES_API_KEY?.trim();
  return apiKey
    ? { status: "configured", apiKey }
    : { status: "disabled", reason: "missing-api-key" };
}

export function selectGooglePlacePhoto(
  value: unknown,
  query: PlacePhotoQuery,
): GooglePlacePhotoMatch | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const response = value as Readonly<Record<string, unknown>>;
  if (!Array.isArray(response.places)) return null;

  const candidates = response.places.flatMap((place) => {
    const normalized = normalizeCandidate(place);
    if (!normalized) return [];
    const distance = distanceInKilometers(query.coordinates, normalized.coordinates);
    const nameScore = nameMatchScore(query.name, normalized.name);
    if (distance > MAX_MATCH_DISTANCE_KILOMETERS || nameScore < 0.6) return [];
    return [{ distance, nameScore, place: normalized }];
  });

  candidates.sort((left, right) => {
    if (right.nameScore !== left.nameScore) return right.nameScore - left.nameScore;
    return left.distance - right.distance;
  });

  const selected = candidates[0]?.place;
  if (!selected) return null;
  return { googlePlaceId: selected.googlePlaceId, photo: selected.photos[0] };
}

export async function fetchGooglePlacePhoto(
  query: PlacePhotoQuery,
): Promise<GooglePlacesPhotoResult> {
  const config = parseGooglePlacesConfig({
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
  });
  if (config.status === "disabled") return config;

  const textQuery = [query.name, query.address, "Tagum City, Davao del Norte, Philippines"]
    .filter(Boolean)
    .join(", ");

  let response: Response;
  try {
    response = await fetch(GOOGLE_PLACES_SEARCH_URL, {
      body: JSON.stringify({
        languageCode: "en",
        locationBias: {
          circle: {
            center: query.coordinates,
            radius: 250,
          },
        },
        maxResultCount: MAX_RESULTS,
        regionCode: "PH",
        textQuery,
      }),
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Goog-Api-Key": config.apiKey,
        "X-Goog-FieldMask": GOOGLE_PLACES_FIELD_MASK,
      },
      method: "POST",
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    return { status: "provider-error", httpStatus: null };
  }

  if (response.status === 429) return { status: "rate-limited" };
  if (!response.ok) return { status: "provider-error", httpStatus: response.status };

  try {
    const match = selectGooglePlacePhoto(await response.json(), query);
    return match ? { status: "success", match } : { status: "not-found" };
  } catch {
    return { status: "provider-error", httpStatus: response.status };
  }
}
