export const foursquarePlacesApiVersion = "2025-06-17" as const;
export const foursquarePlaceDetailFields = [
  "fsq_place_id",
  "name",
  "description",
  "price",
  "photos",
  "date_refreshed",
] as const;

export type FoursquarePhotoReference = Readonly<{
  classifications: readonly string[];
  height: number | null;
  id: string;
  prefix: string;
  suffix: string;
  width: number | null;
}>;

export type FoursquarePlaceEnrichment = Readonly<{
  attribution: "Foursquare";
  description: string | null;
  fetchedAt: string;
  fsqPlaceId: string;
  name: string | null;
  photoReferences: readonly FoursquarePhotoReference[];
  priceTier: 1 | 2 | 3 | 4 | null;
  refreshedAt: string | null;
}>;

type FoursquareConfigInput = Readonly<{ FOURSQUARE_PLACES_SERVICE_KEY?: string }>;

export type FoursquarePlacesConfig =
  | Readonly<{ status: "disabled"; reason: "missing-service-key" }>
  | Readonly<{
      apiVersion: typeof foursquarePlacesApiVersion;
      serviceKey: string;
      status: "configured";
    }>;

function optionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}

function optionalPositiveInteger(value: unknown): number | null {
  return Number.isInteger(value) && (value as number) > 0 ? (value as number) : null;
}

function normalizeDate(value: unknown): string | null {
  const normalized = optionalText(value);
  if (!normalized) return null;
  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function normalizePhoto(value: unknown): FoursquarePhotoReference | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const photo = value as Readonly<Record<string, unknown>>;
  const id = optionalText(photo.fsq_photo_id) ?? optionalText(photo.id);
  const prefix = optionalText(photo.prefix);
  const suffix = optionalText(photo.suffix);
  if (!id || !prefix || !suffix) return null;

  return {
    classifications: Array.isArray(photo.classifications)
      ? photo.classifications.flatMap((entry) => {
          const normalized = optionalText(entry);
          return normalized ? [normalized] : [];
        })
      : [],
    height: optionalPositiveInteger(photo.height),
    id,
    prefix,
    suffix,
    width: optionalPositiveInteger(photo.width),
  };
}

export function parseFoursquarePlacesConfig(
  environment: FoursquareConfigInput,
): FoursquarePlacesConfig {
  const serviceKey = environment.FOURSQUARE_PLACES_SERVICE_KEY?.trim();
  if (!serviceKey) return { status: "disabled", reason: "missing-service-key" };
  return { apiVersion: foursquarePlacesApiVersion, serviceKey, status: "configured" };
}

export function normalizeFoursquarePlaceDetails(
  value: unknown,
  fetchedAt: string,
): FoursquarePlaceEnrichment | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const place = value as Readonly<Record<string, unknown>>;
  const fsqPlaceId = optionalText(place.fsq_place_id);
  if (!fsqPlaceId) return null;
  const priceTier =
    typeof place.price === "number" && [1, 2, 3, 4].includes(place.price)
      ? (place.price as 1 | 2 | 3 | 4)
      : null;
  const photoReferences = Array.isArray(place.photos)
    ? place.photos.flatMap((photo) => {
        const normalized = normalizePhoto(photo);
        return normalized ? [normalized] : [];
      })
    : [];

  return {
    attribution: "Foursquare",
    description: optionalText(place.description),
    fetchedAt: new Date(fetchedAt).toISOString(),
    fsqPlaceId,
    name: optionalText(place.name),
    photoReferences: photoReferences.slice(0, 5),
    priceTier,
    refreshedAt: normalizeDate(place.date_refreshed),
  };
}
