# OSM Source Rights and Attribution Record

## Decision

**Approved for the Tagum Food Finder baseline, subject to the controls in this record.**

OpenStreetMap data may be imported, normalized, stored, refreshed, and displayed for the MVP. The product must preserve source provenance, provide visible attribution, and handle any publicly distributed adapted database under the Open Database License (ODbL) requirements.

This is an engineering compliance record, not legal advice. A legal and privacy review remains required before broad public launch.

## Approved source

| Item | Approved value |
| --- | --- |
| Upstream database | OpenStreetMap contributors |
| Distribution channel | Geofabrik Philippines extract |
| Snapshot | `philippines-261012.osm.pbf` |
| Snapshot timestamp | 2026-10-12 23:01 UTC, as published by Geofabrik |
| Snapshot size | 609,864,006 bytes |
| Snapshot MD5 | `28229e8e1088f061a4f8332731120871` |
| Local SHA-256 | `cc6a89b6da5f2cedadf77603b759b350233a55a0a16c92293a43e4c48de49b25` |
| Extraction manifest | `validation/snapshots/tagum-osm-quality-check.manifest.json` |
| Database license | Open Database License 1.0 |
| Rights holder attribution | OpenStreetMap contributors |

The raw snapshot and generated extracts are validation inputs. They remain ignored by Git and must not be bundled into the client application or production deployment.

## Required attribution

### Public map and discovery surfaces

Every public surface that displays OSM-derived place data must show a visible and legible attribution near the map or produced work:

> © OpenStreetMap contributors

`OpenStreetMap contributors` must link to `https://www.openstreetmap.org/copyright` so the ODbL license and source are clear. A basemap provider's required attribution is separate and must also be displayed when applicable.

Attribution must not be hidden behind account creation, buried only in terms, or removed in narrow mobile layouts.

### Durable attribution page

The production app must provide a durable data-attribution page, such as `/attribution`, that records:

- OpenStreetMap contributors as the database source;
- the ODbL 1.0 license and license link;
- the distribution channel used for the current import;
- the active source snapshot or refresh date;
- a plain-language explanation that place details may also contain owner- or community-submitted corrections; and
- the product's correction and takedown channel.

### Exports and database releases

Any public export or database release containing OSM-derived data must include the attribution notice, the ODbL license notice or link, and enough metadata to identify the source and refresh date. Before publishing a database download or API intended for bulk reuse, the owner must review whether it is an adapted database and apply the ODbL share-alike requirements where applicable.

The ODbL does not automatically relicense application source code, original interface design, or independently collected user submissions. Source boundaries and field-level provenance must remain explicit so those materials are not presented as part of the OSM-derived database by accident.

## Data-handling controls

- Retain the OSM element type and element ID as the external source identity.
- Record the source snapshot, import batch, adapter version, retrieval time, normalized content hash, and field-level provenance.
- Collapse duplicate representations of the same OSM element before staging.
- Store only the normalized fields required by the approved data model; do not copy the raw country extract into production storage.
- Keep OSM-derived values distinguishable from owner-verified, community-submitted, and editorial values.
- Treat imported places as unverified until a separate verification event occurs.
- Preserve unknown values as unknown. Do not infer price, operating status, suitability, or verification from absence of data.
- A record disappearing from a later snapshot must trigger revalidation, not automatic closure or deletion.
- Do not import OSM contributor usernames, user IDs, changeset IDs, or other contributor metadata. The approved Geofabrik public extract states that this personal metadata is removed.
- Do not store credentials, private source payloads, or customer personal data in import artifacts or logs.

## Acquisition and refresh controls

Each production acquisition must be reproducible and auditable:

1. Pin the source filename and publication timestamp.
2. Verify the publisher-provided checksum and record a local SHA-256 digest.
3. Record the approved Tagum City boundary input and its checksum.
4. Record the adapter version and extraction command or equivalent job version.
5. Create an import batch before normalizing records.
6. Reject the batch if a required checksum, manifest field, or rights record is missing.
7. Publish only after the staging checks in `osm-staging-import-contract.md` pass.
8. Retain the last valid catalog release when acquisition, validation, or publication fails.

The intended production refresh cadence is weekly. A new snapshot does not bypass review controls or change the treatment of uncertain records.

## Service restrictions

- Do not build systematic ingestion on the public OpenStreetMap editing API, community tile servers, public Nominatim, or public Overpass instances.
- Use downloadable extracts or an approved commercial/self-hosted service for bulk data workflows.
- Select the map-tile provider independently and comply with that provider's attribution, rate, caching, and usage terms.
- Foursquare remains an optional enrichment source. It is not approved until access, licensing, retention, redistribution, and cost terms are documented separately.

## Operational approval matrix

| Use | Decision | Conditions |
| --- | --- | --- |
| Download Geofabrik OSM extract | Approved | Pin and verify the snapshot and checksums. |
| Extract Tagum food-place candidates | Approved | Use the approved boundary and reproducible adapter. |
| Store normalized OSM records | Approved | Preserve source identity, batch lineage, and field provenance. |
| Display OSM-derived place data | Approved | Show the required attribution and retain uncertainty labels. |
| Refresh the source | Approved | Stage and validate before atomic publication. |
| Accept owner/community corrections | Approved | Store them as a separate provenance class with moderation. |
| Publish a bulk database or API | Conditional | Perform an ODbL adapted-database review first. |
| Use public OSM services for bulk ingestion | Not approved | Use extracts or an approved hosted/self-hosted alternative. |
| Use Foursquare enrichment | Not yet approved | Complete a separate commercial rights and cost review. |

## Official references

- OpenStreetMap copyright and license: https://www.openstreetmap.org/copyright
- OSM Foundation attribution guidelines: https://osmfoundation.org/wiki/Licence/Attribution_Guidelines
- OSM Foundation legal FAQ: https://osmfoundation.org/wiki/Licence_and_Legal_FAQ
- OSM Foundation Produced Work guideline: https://osmfoundation.org/wiki/Licence/Community_Guidelines/Produced_Work_-_Guideline
- Geofabrik download terms: https://www.geofabrik.de/data/download.html
- Geofabrik Philippines extract: https://download.geofabrik.de/asia/philippines.html

## Record status

- Owner: Tagum Food Finder project owner
- Recorded: 2026-10-14
- Review trigger: source, license, acquisition channel, public export behavior, or attribution presentation changes
- Related evidence: `validation/reports/osm-quality-spot-check.md`
- Import boundary: `validation/reports/osm-staging-import-contract.md`
