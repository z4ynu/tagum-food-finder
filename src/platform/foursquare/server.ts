import "server-only";

import {
  foursquarePlaceDetailFields,
  normalizeFoursquarePlaceDetails,
  parseFoursquarePlacesConfig,
  type FoursquarePlaceEnrichment,
} from "./place-details";

export type FoursquarePlaceDetailsResult =
  | Readonly<{ status: "disabled"; reason: "missing-service-key" }>
  | Readonly<{ status: "not-found" }>
  | Readonly<{ status: "rate-limited" }>
  | Readonly<{ status: "provider-error"; httpStatus: number | null }>
  | Readonly<{ status: "success"; enrichment: FoursquarePlaceEnrichment }>;

export async function fetchFoursquarePlaceDetails(
  fsqPlaceId: string,
): Promise<FoursquarePlaceDetailsResult> {
  const config = parseFoursquarePlacesConfig({
    FOURSQUARE_PLACES_SERVICE_KEY: process.env.FOURSQUARE_PLACES_SERVICE_KEY,
  });
  if (config.status === "disabled") return config;

  const normalizedId = fsqPlaceId.trim();
  if (!/^[a-zA-Z0-9_-]{3,100}$/.test(normalizedId)) {
    return { status: "provider-error", httpStatus: null };
  }

  let response: Response;
  try {
    const url = new URL(
      `https://places-api.foursquare.com/places/${encodeURIComponent(normalizedId)}`,
    );
    url.searchParams.set("fields", foursquarePlaceDetailFields.join(","));
    response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${config.serviceKey}`,
        "X-Places-Api-Version": config.apiVersion,
      },
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    return { status: "provider-error", httpStatus: null };
  }

  if (response.status === 404) return { status: "not-found" };
  if (response.status === 429) return { status: "rate-limited" };
  if (!response.ok) return { status: "provider-error", httpStatus: response.status };

  try {
    const enrichment = normalizeFoursquarePlaceDetails(
      await response.json(),
      new Date().toISOString(),
    );
    return enrichment
      ? { status: "success", enrichment }
      : { status: "provider-error", httpStatus: response.status };
  } catch {
    return { status: "provider-error", httpStatus: response.status };
  }
}
