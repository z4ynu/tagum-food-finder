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

The active 291-place production release was audited before implementing persistence or an enrichment job. None of the 117 published Overture places has a retained Foursquare identifier. The published Overture import contains 19 other in-boundary records with Foursquare identifiers, but every one remains private in the moderation queue because its Overture confidence is `0.77`, below the approved `0.8` automatic-publication threshold.

Therefore, the current details-only boundary has zero valid public targets. Enrichment must not bypass place matching. The next safe step is to manually review and link or publish an explicitly approved subset of those 19 records, or separately approve a paid Foursquare search-and-match workflow. A service key is still required before either path can make provider calls.

No Foursquare request was made during this audit and no provider quota was consumed.
