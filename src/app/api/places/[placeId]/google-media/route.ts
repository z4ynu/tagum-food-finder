import { createGooglePhotoToken } from "@/platform/google-places/photo-token";
import {
  fetchGooglePlacePhoto,
  parseGooglePlacesConfig,
} from "@/platform/google-places/place-photo";
import { applyInMemoryRateLimit, requestClientKey } from "@/platform/security/request-rate-limit";
import { createServerSupabaseClient } from "@/platform/supabase/server";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
} as const;

type RouteContext = Readonly<{ params: Promise<{ placeId: string }> }>;

function json(body: unknown, status: number) {
  return Response.json(body, { headers: NO_STORE_HEADERS, status });
}

export async function GET(request: Request, context: RouteContext) {
  const rateLimit = applyInMemoryRateLimit(`google-media:${requestClientKey(request)}`, 40, 60_000);
  if (!rateLimit.allowed) {
    return new Response(null, {
      headers: {
        ...NO_STORE_HEADERS,
        "Retry-After": String(rateLimit.retryAfterSeconds),
      },
      status: 429,
    });
  }

  const config = parseGooglePlacesConfig({
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
  });
  if (config.status === "disabled") return json({ available: false }, 503);

  const { placeId } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(placeId)) {
    return json({ available: false }, 400);
  }

  const supabase = await createServerSupabaseClient();
  const { data: place, error } = await supabase
    .from("place_discovery")
    .select("canonical_name, display_address, latitude, longitude, place_id")
    .eq("place_id", placeId)
    .maybeSingle();

  if (error || !place?.canonical_name || place.latitude === null || place.longitude === null) {
    return json({ available: false }, error ? 503 : 404);
  }

  const result = await fetchGooglePlacePhoto({
    address: place.display_address,
    coordinates: { latitude: place.latitude, longitude: place.longitude },
    name: place.canonical_name,
  });

  if (result.status === "rate-limited") return json({ available: false }, 429);
  if (result.status === "provider-error") return json({ available: false }, 502);
  if (result.status !== "success") return json({ available: false }, 404);

  const token = createGooglePhotoToken(result.match.photo.name, 960, config.apiKey);

  return json(
    {
      available: true,
      media: {
        altText: `Photo of ${place.canonical_name}`,
        attributions: result.match.photo.attributions,
        googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(result.match.googlePlaceId)}`,
        height: result.match.photo.height,
        url: `/api/google-places/photo?token=${encodeURIComponent(token)}`,
        width: result.match.photo.width,
      },
    },
    200,
  );
}
