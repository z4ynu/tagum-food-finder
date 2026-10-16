# Place image source audit

## Decision

The private beta must not bulk-copy images from Google Maps, Facebook, Foodpanda, delivery listings, or general directories. The first public place images will come from business-provided media, project-owned photography, rights-confirmed community submissions, or manually matched openly licensed files.

Missing images remain explicit. Category artwork may decorate an empty state, but it must not be presented as a photograph of a real establishment.

## Coverage audit

| Source | Result | Beta decision |
| --- | --- | --- |
| OpenStreetMap Tagum food snapshot | The 174 imported food-place features contain no `image`, `wikimedia_commons`, or `mapillary` tags. Two records contain a website or Facebook URL, which does not grant photo reuse rights. | No image seed available. |
| Wikimedia Commons geosearch | The public API returned 78 geotagged files within 10 kilometres of central Tagum. Title review found no image depicting a catalog food establishment; results were primarily sports-event, landscape, insect, and seal images. | Keep as a manually reviewed open-license source; do not proximity-match automatically. |
| Overture Places | The current source records contain place data and provider references, not reusable image binaries or image licenses. | Do not infer media rights from a website, social URL, or provider reference. |
| Foursquare Places | The server boundary remains inactive because the Sandbox project returns `429` while console usage is zero. Account-specific display, caching, and photo terms are not approved. | Do not fetch or publish Foursquare photos. |
| Google Places Photos | The API can return place photos but requires current API retrieval, Google Maps and author attribution, source links, and compliance with caching restrictions. | Not selected for the small private beta; do not scrape or persist Google-hosted photos. |
| Delivery and social listings | Listings can corroborate that a branch exists, but public visibility does not establish storage, modification, or redistribution rights. | Use only after direct business permission or another explicit license. |

## Approved source priority

1. Business-provided image with written or recorded permission for public app display.
2. Project-owned photograph taken specifically for the catalog.
3. Rights-confirmed community submission that passes moderation and image processing.
4. Exact-place Wikimedia Commons file with compatible license, creator credit, license link, source link, and manual identity review.

Every published file must retain a rights basis, rights reference, source URL when applicable, content hash, dimensions, MIME type, alt text, publication time, and takedown state.

## Processing boundary

- Accept JPEG, PNG, or WebP only into private quarantine, with a 5 MiB input limit.
- Decode and re-encode before publication; remove EXIF and other unnecessary metadata.
- Produce bounded JPEG or WebP public variants no larger than 2 MiB or 2,560 pixels on either axis.
- Reject corrupt files, animated content, SVG, deceptive composites, and files whose identity or rights are unclear.
- Store public media separately from private correction evidence.
- Browser roles may read only published metadata and public variants. Only a trusted service workflow may publish or withdraw media.
- Withdrawal removes the public object before marking its immutable rights and moderation record withdrawn.

## References

- [Wikimedia Commons reuse guidance](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/licenses)
- [Google Places API policies and attribution](https://developers.google.com/maps/documentation/places/web-service/policies)
- [Google Place Photos caching and attribution requirements](https://developers.google.com/maps/documentation/places/web-service/place-photos)

## Next implementation step

Add the restricted media catalog and service-role publication boundary first. After that database contract passes locally, prepare mobile and desktop mockups showing real-image, missing-image, attribution, loading, and error states. Do not change the public page UI until the owner approves those mockups.
