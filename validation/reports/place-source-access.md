# Stage 0B Place Source Access

## Status

Adapter contracts, a bounded OSM GeoJSON-sequence reader, and reviewed audit-category mapping are implemented against synthetic rows. The pinned OSM source is available locally but its real food-place extract has not yet been measured. No provider snapshot is committed.

## Foursquare Open Source Places

Foursquare documents its Places OS schema as Apache License 2.0 data. The current access path uses the Foursquare Places Portal and an Iceberg catalog: an account and access token are required, replacing the legacy public S3 delivery. The documented core fields include place ID, name, WGS84 latitude and longitude, address fields, refresh and closure dates, public contact fields, and category identifiers and labels.

The adapter accepts only those documented core fields and maps them into the source-neutral candidate contract. It does not place a token in source code, preserve an unrestricted raw response, infer missing coordinates, or treat the existence of a technical access path as final license approval.

- Access: `https://docs.foursquare.com/data-products/docs/access-fsq-os-places`
- Schema and Apache 2.0 notice: `https://docs.foursquare.com/data-products/docs/places-os-data-schema`

Open items:

- create a project-owned portal account and store its token outside Git;
- capture a pinned release identifier and checksum or catalog snapshot identity;
- confirm ongoing access, attribution, correction, and redistribution requirements;
- measure actual Tagum coverage and field quality.

## OpenStreetMap

The OSM adapter recognizes the initial approved food-place families represented by `amenity=restaurant`, `cafe`, `fast_food`, `food_court`, or `ice_cream`, and by food-focused shops such as bakeries, pastry shops, delis, confectioneries, coffee, tea, and ice-cream shops. Bars, pubs, and beer gardens enter the candidate set only when their tags explicitly indicate food or cuisine.

The intended acquisition path is a pinned Geofabrik Philippines extract, clipped locally. The production product and repeatable audit must not systematically query public Nominatim or community Overpass infrastructure for the city catalog.

The reader preserves Osmium object identity and timestamps, accepts exact source points, derives deterministic representative points from area geometries, and records the coordinate method beside each candidate for audit review. It rejects malformed features without silently dropping their count and enforces 5 MB and 10,000-record defaults so an accidental bulk input cannot enter the in-memory audit path.

The reviewed category mapping treats direct restaurant, fast-food, cafe, food-court, ice-cream, bakery, and pastry tags as usable. Retail-oriented coffee, tea, deli, and confectionery tags require manual review because they do not prove a customer-facing prepared-food place. Foursquare category paths are mapped only at explicit hierarchy segments so unrelated labels such as restaurant-supply stores do not become food places.

- Philippines extracts: `https://download.geofabrik.de/asia/philippines.html`
- Geofabrik and ODbL information: `https://www.geofabrik.de/data/download.html`
- OSM copyright and attribution: `https://www.openstreetmap.org/copyright`
- Food amenity guidance: `https://wiki.openstreetmap.org/wiki/Key:amenity`
- Cuisine tagging: `https://wiki.openstreetmap.org/wiki/Key:cuisine`

Open items:

- select and checksum a dated extract;
- document and execute the exact pinned extraction and tag-filter command;
- carry ODbL attribution and database obligations into the source-rights record;
- compare recorded area-representative and node coordinates against the reference sample instead of assuming usability;
- measure real Tagum coverage, duplicates, closure signals, and field completeness.

## Deliberate exclusions

- Foodpanda is not used as a city-wide ingestion source.
- Google Maps consumer listings are not copied into the dataset.
- Missing prices, opening hours, contacts, cuisines, or coordinates remain unknown.
- Unmapped or review-required source category strings remain source evidence and do not become canonical categories automatically.
