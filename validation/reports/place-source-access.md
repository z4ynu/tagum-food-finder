# Stage 0B Place Source Access

## Status

Adapter contracts, a bounded OSM GeoJSON-sequence reader, and reviewed audit-category mapping are implemented. The pinned OSM source has been clipped to the approved Tagum boundary and filtered into a local, ignored 216-record candidate snapshot. No provider snapshot is committed.

## Foursquare Open Source Places

Foursquare documents its Places OS schema as Apache License 2.0 data. The current access path uses the Foursquare Places Portal and an Iceberg catalog: an account and access token are required, replacing the legacy public S3 delivery. The documented core fields include place ID, name, WGS84 latitude and longitude, address fields, refresh and closure dates, public contact fields, and category identifiers and labels.

The adapter accepts only those documented core fields and maps them into the source-neutral candidate contract. It does not place a token in source code, preserve an unrestricted raw response, infer missing coordinates, or treat the existence of a technical access path as final license approval.

- Access: `https://docs.foursquare.com/data-products/docs/access-fsq-os-places`
- Schema and Apache 2.0 notice: `https://docs.foursquare.com/data-products/docs/places-os-data-schema`

Open items:

- create a project-owned portal account and store its token outside Git;
- capture a pinned release identifier and checksum or catalog snapshot identity;
- confirm ongoing access, attribution, correction, and redistribution requirements;
- measure returned-record quality and report observed catalog size without claiming completeness.

## OpenStreetMap

The OSM adapter recognizes the initial approved food-place families represented by `amenity=restaurant`, `cafe`, `fast_food`, `food_court`, or `ice_cream`, and by food-focused shops such as bakeries, pastry shops, delis, confectioneries, coffee, tea, and ice-cream shops. The extraction filter includes bars, pubs, and beer gardens as a review superset; the category mapping requires additional food or cuisine evidence before treating them as usable food places.

The intended acquisition path is a pinned Geofabrik Philippines extract, clipped locally. The production product and repeatable audit must not systematically query public Nominatim or community Overpass infrastructure for the city catalog.

The reader preserves Osmium object identity and timestamps, accepts exact source points, derives deterministic representative points from area geometries, and records the coordinate method beside each candidate for audit review. It rejects malformed features without silently dropping their count and enforces 5 MB and 10,000-record defaults so an accidental bulk input cannot enter the in-memory audit path.

The reviewed category mapping treats direct restaurant, fast-food, cafe, food-court, ice-cream, bakery, and pastry tags as usable. Retail-oriented coffee, tea, deli, and confectionery tags require manual review because they do not prove a customer-facing prepared-food place. Foursquare category paths are mapped only at explicit hierarchy segments so unrelated labels such as restaurant-supply stores do not become food places.

### Reproducible Tagum extraction

The local extraction uses the pinned Osmium 1.19.0 image and refuses either the source or boundary when its checksum differs from the approved value. It first clips the dated Philippines PBF with `complete_ways`, then applies the documented amenity and shop filters, and finally exports an attributed GeoJSON sequence for the bounded reader.

- source version: `geofabrik-philippines-2026-10-12T23:01:00Z`;
- source MD5: `d12ded513809afc929b74573c2c28f57`;
- boundary: OSM relation `15986415`, version 8;
- boundary SHA-256: `6b4633950b60c7402d0e8373354eb2df34ffe7e460464e934800f304543e2af0`;
- extracted records: 216;
- GeoJSON-sequence SHA-256: `80c8994a5074ed14a2b9e533e6949535873996ff0e8352431b42ecc5b96f46f5`;
- filtered PBF SHA-256: `6ccd70fb5d691cb657867f3ff11b4c6591998f04c88f19109371301e9bbf5cea`.

The extraction command lives in `scripts/extract-osm-food-places.ps1`. Its generated snapshot, intermediate PBF files, and manifest remain ignored local audit inputs.

- Philippines extracts: `https://download.geofabrik.de/asia/philippines.html`
- Geofabrik and ODbL information: `https://www.geofabrik.de/data/download.html`
- OSM copyright and attribution: `https://www.openstreetmap.org/copyright`
- Food amenity guidance: `https://wiki.openstreetmap.org/wiki/Key:amenity`
- Cuisine tagging: `https://wiki.openstreetmap.org/wiki/Key:cuisine`

Open items:

- carry ODbL attribution and database obligations into the source-rights record;
- manually verify area-representative and node coordinates in the 25-record quality check instead of assuming usability;
- measure duplicate signals, closure signals, and field completeness while keeping total Tagum coverage explicitly unknown.

## Deliberate exclusions

- Foodpanda is not used as a city-wide ingestion source.
- Google Maps consumer listings are not copied into the dataset.
- Missing prices, opening hours, contacts, cuisines, or coordinates remain unknown.
- Unmapped or review-required source category strings remain source evidence and do not become canonical categories automatically.
