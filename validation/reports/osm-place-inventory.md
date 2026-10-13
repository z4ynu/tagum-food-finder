# OSM Tagum Place Inventory

Generated from the checksummed local Stage 0 snapshot. This report contains aggregate evidence only; the raw provider rows remain ignored.

## Snapshot

- Source version: `geofabrik-philippines-2026-10-12T23:01:00Z`
- Source MD5: `d12ded513809afc929b74573c2c28f57`
- Snapshot SHA-256: `80c8994a5074ed14a2b9e533e6949535873996ff0e8352431b42ecc5b96f46f5`
- Records read: 216
- Adapter-accepted before boundary check: 194
- Inside approved Tagum boundary: 194
- Audit decision: incomplete pending the 100-place reference sample and manual lifecycle review

## Reader disposition

| Outcome | Count |
| --- | ---: |
| Accepted | 194 |
| Invalid feature | 0 |
| Missing source ID | 0 |
| Missing usable name | 8 |
| Failed strict food-place rule | 14 |

The strict food-place rule rejects bars, pubs, and beer gardens unless their source tags also provide food or cuisine evidence.

## Category assessment

| State | Count | Share of in-boundary rows |
| --- | ---: | ---: |
| Usable | 192 | 99.0% |
| Review required | 2 | 1.0% |
| Unmapped | 0 | 0.0% |

| Canonical audit category | Count |
| --- | ---: |
| Bakery | 23 |
| Bar with food | 0 |
| Cafe | 35 |
| Dessert | 3 |
| Fast food | 56 |
| Food court | 2 |
| Prepared-food shop | 0 |
| Restaurant | 75 |

## Geometry evidence

| Coordinate method | Count |
| --- | ---: |
| Source point | 158 |
| Polygon representative | 18 |
| Line midpoint | 18 |
| Missing | 0 |

| OSM object type | Count |
| --- | ---: |
| Node | 158 |
| Way | 36 |
| Relation | 0 |
| Unknown | 0 |

All 194 adapter-accepted records have a usable representative coordinate inside the approved Tagum boundary. For lines and polygons, boundary membership is based on the documented deterministic representative coordinate; this does not prove that every part of the source geometry is inside the city.

## Field completeness

| Field | Present | Share of in-boundary rows |
| --- | ---: | ---: |
| Address line | 57 | 29.4% |
| Barangay | 25 | 12.9% |
| Contact | 9 | 4.6% |
| Cuisine | 96 | 49.5% |
| Locality | 45 | 23.2% |
| Opening hours | 17 | 8.8% |

## Review signals

- Potential duplicate groups: 18
- Potential extra duplicate rows: 18
- Duplicate heuristic: exact normalized name within 75 metres
- Lifecycle assessed: 0; unknown: 194
- Defensible price evidence: 0; unknown: 194

The duplicate heuristic only creates review candidates and does not merge records. The weak address, barangay, contact, and opening-hours completeness means OSM alone cannot support every desired product filter. Coverage, closed-place accuracy, and average-price usability remain unmeasured until the independent reference and price-evidence work is complete.
