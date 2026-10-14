# OSM Tagum Place Inventory

Generated from the checksummed local Stage 0 snapshot. This report contains aggregate evidence only; the raw provider rows remain ignored.

## Snapshot

- Source version: `geofabrik-philippines-2026-10-12T23:01:00Z`
- Source MD5: `d12ded513809afc929b74573c2c28f57`
- Snapshot SHA-256: `80c8994a5074ed14a2b9e533e6949535873996ff0e8352431b42ecc5b96f46f5`
- Records read: 216
- Adapter-accepted before boundary check: 176
- Inside approved Tagum boundary: 176
- Audit decision: proceed to the 25-record candidate-quality check; catalog completeness remains unknown

## Reader disposition

| Outcome | Count |
| --- | ---: |
| Accepted | 176 |
| Collapsed duplicate source feature | 18 |
| Invalid feature | 0 |
| Missing source ID | 0 |
| Missing usable name | 8 |
| Failed strict food-place rule | 14 |

The strict food-place rule rejects bars, pubs, and beer gardens unless their source tags also provide food or cuisine evidence.

## Category assessment

| State | Count | Share of in-boundary rows |
| --- | ---: | ---: |
| Usable | 174 | 98.9% |
| Review required | 2 | 1.1% |
| Unmapped | 0 | 0.0% |

| Canonical audit category | Count |
| --- | ---: |
| Bakery | 23 |
| Bar with food | 0 |
| Cafe | 32 |
| Dessert | 3 |
| Fast food | 50 |
| Food court | 2 |
| Food stall | 0 |
| Prepared-food shop | 0 |
| Restaurant | 66 |

## Geometry evidence

| Coordinate method | Count |
| --- | ---: |
| Source point | 158 |
| Polygon representative | 18 |
| Line midpoint | 0 |
| Missing | 0 |

| OSM object type | Count |
| --- | ---: |
| Node | 158 |
| Way | 18 |
| Relation | 0 |
| Unknown | 0 |

All 176 unique adapter-accepted records have a usable representative coordinate inside the approved Tagum boundary. Osmium emitted 18 tagged building ways once as a line and once as an area. The reader collapses matching source identities and deterministically retains the polygon representative, so these export artifacts do not inflate the catalog or duplicate metric. Boundary membership for polygons is based on the documented representative coordinate; this does not prove that every part of the source geometry is inside the city.

## Field completeness

| Field | Present | Share of in-boundary rows |
| --- | ---: | ---: |
| Address line | 54 | 30.7% |
| Barangay | 24 | 13.6% |
| Contact | 8 | 4.5% |
| Cuisine | 87 | 49.4% |
| Locality | 42 | 23.9% |
| Opening hours | 14 | 8.0% |

## Review signals

- Potential duplicate groups: 0
- Potential extra duplicate rows: 0
- Duplicate heuristic: exact normalized name within 75 metres
- Lifecycle assessed: 0; unknown: 176
- Defensible price evidence: 0; unknown: 176

The duplicate heuristic only creates review candidates and does not merge records. The weak address, barangay, contact, and opening-hours completeness means OSM alone cannot support every desired product filter. The 25-record check will assess returned-record quality, closed-place accuracy, and average-price usability; it cannot estimate missing places or catalog completeness.
