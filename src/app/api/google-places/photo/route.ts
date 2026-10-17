import { verifyGooglePhotoToken } from "@/platform/google-places/photo-token";
import { parseGooglePlacesConfig } from "@/platform/google-places/place-photo";
import { applyInMemoryRateLimit, requestClientKey } from "@/platform/security/request-rate-limit";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Content-Type-Options": "nosniff",
} as const;

export async function GET(request: Request) {
  const rateLimit = applyInMemoryRateLimit(`google-photo:${requestClientKey(request)}`, 80, 60_000);
  if (!rateLimit.allowed) {
    return new Response(null, {
      headers: { ...NO_STORE_HEADERS, "Retry-After": String(rateLimit.retryAfterSeconds) },
      status: 429,
    });
  }

  const config = parseGooglePlacesConfig({
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
  });
  if (config.status === "disabled") {
    return new Response(null, { headers: NO_STORE_HEADERS, status: 503 });
  }

  const token = new URL(request.url).searchParams.get("token");
  const payload = token ? verifyGooglePhotoToken(token, config.apiKey) : null;
  if (!payload) return new Response(null, { headers: NO_STORE_HEADERS, status: 400 });

  const mediaUrl = new URL(`https://places.googleapis.com/v1/${payload.photoName}/media`);
  mediaUrl.searchParams.set("maxWidthPx", String(payload.maxWidth));

  let response: Response;
  try {
    response = await fetch(mediaUrl, {
      cache: "no-store",
      headers: { "X-Goog-Api-Key": config.apiKey },
      redirect: "follow",
      signal: AbortSignal.timeout(7_000),
    });
  } catch {
    return new Response(null, { headers: NO_STORE_HEADERS, status: 502 });
  }

  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim();
  const contentLength = Number(response.headers.get("content-length") ?? "0");
  if (
    !response.ok ||
    !contentType?.startsWith("image/") ||
    (contentLength > 0 && contentLength > MAX_IMAGE_BYTES)
  ) {
    return new Response(null, { headers: NO_STORE_HEADERS, status: 502 });
  }

  const image = await response.arrayBuffer();
  if (image.byteLength > MAX_IMAGE_BYTES) {
    return new Response(null, { headers: NO_STORE_HEADERS, status: 502 });
  }

  return new Response(image, {
    headers: { ...NO_STORE_HEADERS, "Content-Type": contentType },
    status: 200,
  });
}
