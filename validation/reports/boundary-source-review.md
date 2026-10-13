# Stage 0B Boundary Source Review

## Status

Source selection pending. No real Tagum boundary is approved or committed yet.

The boundary fixture contract and synthetic clipping tests are implemented so a real boundary cannot enter the audit without an approved purpose, review status, verified jurisdiction identity, source record, version, retrieval time, license, attribution, and SHA-256 checksum.

## Jurisdiction identity

The Philippine Statistics Authority page for the City of Tagum identifies it with 10-digit PSGC `1102319000` and correspondence code `112319000`. The page lists 23 barangays as of 31 July 2025 and links the PSGC publication as of 30 June 2026. This verifies the audit jurisdiction identity, but it does not provide a municipal boundary geometry.

- Verified: 13 October 2026
- Jurisdiction: City of Tagum, Davao del Norte, Philippines
- Reference system: 10-digit Philippine Standard Geographic Code
- Reference code: `1102319000`
- PSA record: `https://psa.gov.ph/classification/psgc/barangays/1102319000`

## Candidate sources

### Philippine government municipal-boundary service

A GeoRisk Philippines ArcGIS service was indexed with a PSA municipal-boundary layer containing city and 10-digit PSGC fields. The Geoportal Philippines inventory describes the municipal boundary as approximate and references its open-data policy.

Read-only checks on 13 October 2026 found that the ArcGIS host was reachable, but the indexed layer endpoint returned ArcGIS error `404` (`Service not found`). The `PSA` folder and `PSA/Municipal/MapServer` endpoints returned ArcGIS error `499` (`Token Required`). No token was requested or stored. Therefore, this service cannot currently supply a public, reproducible fixture, and no claim is made that its indexed Tagum record is current or accessible.

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

1. verify the Tagum PSGC identity against the current PSA release (completed for PSGC `1102319000` on 13 October 2026);
2. capture the exact source record and publication version;
3. confirm written reuse, storage, modification, redistribution, and attribution terms;
4. visually compare the geometry with an independent reference and inspect invalid or self-intersecting rings;
5. calculate and record the file SHA-256 checksum;
6. mark the fixture approved only after those checks pass.
