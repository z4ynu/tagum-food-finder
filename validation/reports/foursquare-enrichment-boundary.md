# Foursquare enrichment boundary

## Status

The server-only integration boundary is implemented but inactive. Without `FOURSQUARE_PLACES_SERVICE_KEY`, it returns a typed disabled result and makes no network request. No credential is stored in Git.

## Approved use

The initial integration may retrieve details only for an already-known `fsq_place_id`. Overture provider references are retained in normalized private source records so a known Foursquare identifier can be used without a paid search call. Automated search, matching, bulk enrichment, persistence, and public display are not yet enabled.

The request uses the current Places API endpoint and version documented by Foursquare:

- `GET https://places-api.foursquare.com/places/{fsq_place_id}`;
- `Authorization: Bearer <service key>`;
- `X-Places-Api-Version: 2025-06-17`; and
- an explicit field list limited to identifier, name, description, price, photos, and refresh date.

References:

- [Foursquare Places API authentication](https://docs.foursquare.com/fsq-developers-places/reference/authentication)
- [Get Place Details](https://docs.foursquare.com/fsq-developers-places/reference/place-details)
- [Get Place Photos](https://docs.foursquare.com/fsq-developers-places/reference/place-photos)
- [Pricing changes](https://docs.foursquare.com/developer/reference/upcoming-changes)

## Runtime controls

- The service key exists only in an unprefixed server environment variable.
- Requests use `no-store`, a five-second timeout, and no automatic retry.
- `404`, `429`, provider failures, and malformed payloads are distinct typed outcomes.
- Parsing discards ratings, tips, popularity, and every field outside the approved enrichment contract.
- At most five photo references are retained in memory; image binaries are not downloaded or copied.
- Price is accepted only as Foursquare's integer tier `1` through `4`; it is not represented as an exact PHP amount.
- Returned values carry Foursquare attribution and fetch/refresh timestamps.

## Before activation

1. Review the account-specific Foursquare agreement for display, caching, attribution, photo, and deletion requirements.
2. Confirm the monthly budget. Foursquare's published schedule currently grants the first 500 Places API calls per month free, then charges by call volume.
3. Add persistence fields with expiration and provenance rules only after the terms review.
4. Add a bounded administrative enrichment job with an explicit per-run call cap and audit log.
5. Design and approve public description, price-tier, photo, attribution, missing-data, and stale-data states before changing a page.

## Production identifier audit

The initial 291-place production release was audited before implementing persistence or an enrichment job. None of the 117 automatically published Overture places had a retained Foursquare identifier. The published Overture import contained 19 other in-boundary records with private Foursquare references, all initially held because their Overture confidence was `0.77`, below the approved `0.8` automatic-publication threshold.

On 2026-10-17, operator moderation approved seven of those places, rejected five, and left seven unresolved. The source payloads retain their provider references privately, but the approved places do not receive a canonical Foursquare external identifier from that reference alone. Enrichment must still not bypass explicit provider-place relationship review. The details-only boundary therefore remains inactive.

No Foursquare request was made during this audit and no provider quota was consumed.

## Sandbox activation check

On 2026-10-16, the owner created a dedicated `Tagum Food Finder` Foursquare Developer Console project in Sandbox mode with no credit card attached and stored a Service API Key only in the ignored local environment file. The first corrected details request returned `429 rate-limited`; the console Usage page simultaneously reported zero calls for the project. No response fields were accepted or persisted, and the client did not retry.

This result does not indicate exhausted monthly usage. It indicates that the new Sandbox project currently has no usable Places request allocation or is still awaiting provider-side activation. Enrichment remains disabled until the console exposes an active allocation or Foursquare support clarifies the project state. Adding a payment method is not authorized by this validation.
