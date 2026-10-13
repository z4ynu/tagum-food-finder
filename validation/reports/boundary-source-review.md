# Stage 0B Boundary Source Review

## Status

Source selection pending. No real Tagum boundary is approved or committed yet.

The boundary fixture contract and synthetic clipping tests are implemented so a real boundary cannot enter the audit without an approved purpose, review status, source record, version, retrieval time, license, attribution, and SHA-256 checksum.

## Candidate sources

### Philippine government municipal-boundary service

A GeoRisk Philippines ArcGIS service has been indexed with a PSA municipal-boundary layer containing city and 10-digit PSGC fields. The Geoportal Philippines inventory describes the municipal boundary as approximate and references its open-data policy. It is the preferred source candidate because it is tied to Philippine government geography, but current service availability, the exact Tagum record, publication version, reuse terms, and fitness for point inclusion must all be confirmed before approval.

- Service metadata: `https://ulap-nga.georisk.gov.ph/arcgis/rest/services/PSA/Municipal/MapServer/0`
- Geoportal inventory: `https://www.geoportal.gov.ph/resources/GP_DataInventory.pdf`
- PSGC reference API: `https://psa.gov.ph/classifications-api/psgc`

### OpenStreetMap through a pinned Geofabrik extract

Geofabrik publishes dated Philippines OpenStreetMap extracts and identifies them as Open Database License 1.0 data. A pinned extract is reproducible and can support both the boundary and food-place audit, but its Tagum relation must be compared with an authoritative Philippine reference and its ODbL attribution and database obligations must be carried into the product plan.

- Philippines extracts: `https://download.geofabrik.de/asia/philippines.html`
- Download and license information: `https://www.geofabrik.de/data/download.html`
- OSM attribution and license: `https://www.openstreetmap.org/copyright`

### Public Nominatim service

The public Nominatim API is not selected as an ingestion source. Its policy allows limited end-user-triggered search but prohibits systematic POI downloading and directs complete-data use to OSM extracts. It may be used for a deliberate one-off lookup only if the policy requirements are followed; it must not power the audit or production place acquisition.

- Usage policy: `https://operations.osmfoundation.org/policies/nominatim/`

## Approval gate

Before a real fixture is added:

1. verify the Tagum PSGC identity against the current PSA release;
2. capture the exact source record and publication version;
3. confirm written reuse, storage, modification, redistribution, and attribution terms;
4. visually compare the geometry with an independent reference and inspect invalid or self-intersecting rings;
5. calculate and record the file SHA-256 checksum;
6. mark the fixture approved only after those checks pass.
