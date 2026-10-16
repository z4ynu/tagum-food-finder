# Overture Tagum place inventory

## Result

The pinned Overture Places release `2026-09-23.1` produced 762 named `food_and_drink` candidates in the approved Tagum bounding box. Exact clipping against the approved city polygon retained 711 records.

The normalized review summary is:

| State | Records |
| --- | ---: |
| Inside approved Tagum boundary | 711 |
| Usable category | 627 |
| Review-required category | 45 |
| Unmapped category | 39 |
| Meets pre-deduplication automatic-publication threshold | 140 |

The automatic-publication figure is not a publication count. Production staging still compares these 140 candidates with current catalog identifiers and exact-name matches within 100 metres. Any potential match is held for moderation.

## Snapshot identity

- Generated: `2026-10-16T07:20:59.838169Z`
- JSON Lines records: `762`
- JSON Lines SHA-256: `3bc084c02364e507ed3b35d6e6485f22d8ba1a03d542a0db23ae5c3e5d7eda7e`
- Boundary SHA-256: `6b4633950b60c7402d0e8373354eb2df34ffe7e460464e934800f304543e2af0`
- Extractor: Python `3.12.10`, DuckDB `1.4.1`
- Repository commit used: `39e4558`

The generated JSON Lines file and manifest are intentionally ignored by Git.

## Commands

```powershell
python -m pip install --requirement validation/requirements-overture.txt
python scripts/extract-overture-food-places.py --release 2026-09-23.1
npm run catalog:overture -- prepare
```

## Available enrichment references

Across the 762 bounding-box records, 117 include at least one website, 760 include at least one social link, and 19 carry a Foursquare source reference. These are provider claims, not independently verified owner contact details. They remain private source-record fields and are not automatically published.

## Cost and quota

The Overture extraction reads the public release and incurred no metered application API calls. No Foursquare API call was made.
