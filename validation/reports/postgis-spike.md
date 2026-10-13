# Stage 0A PostGIS Spike

## Status

Passed against the local Supabase PostgreSQL/PostGIS stack on 13 October 2026.

The repository now contains a disposable Stage 0 migration and pgTAP contract for the two geospatial behaviors that must be proven before the product schema is implemented:

- point inclusion within a Tagum-shaped boundary fixture;
- deterministic nearest-to-farthest ordering using geographic distance.

The objects live in the private `stage0_geo` schema. They are compatibility-test objects, not the canonical data model described in `docs/data.md`.

## Files

- `supabase/migrations/20261013030000_stage0_geospatial_spike.sql`
- `supabase/tests/database/stage0_geospatial.test.sql`
- `supabase/config.toml`

## Security and exposure controls

- PostGIS is installed in the dedicated `extensions` schema.
- The spike schema is not included in the Data API schema list.
- New public tables are not automatically exposed to API roles.
- Schema, table, and function privileges are revoked from `public`, `anon`, and `authenticated`.
- Row-level security is enabled on both spike tables even though they are not API-exposed.
- Functions use an empty `search_path` and fully qualified object names.
- The proximity function caps requested result counts between one and one hundred.

## Test contract

The pgTAP suite asserts:

1. the schema, two tables, two GiST indexes, and two functions exist;
2. a point inside the synthetic boundary is accepted;
3. a point outside the synthetic boundary is rejected;
4. two synthetic locations are returned nearest-first.

All fixtures run inside a transaction that is rolled back.

## Execution evidence

Docker Desktop 4.95 started the Supabase local stack with the pinned Supabase PostgreSQL `17.11.0.004` image. A clean `npm run db:reset` recreated the database, applied the migration, and loaded the seed without errors. The pgTAP suite then passed all 10 assertions.

The real pending Tagum boundary was separately parsed by PostGIS. `ST_IsValid` returned true with reason `Valid Geometry`; PostGIS counted 548 points and one polygon and measured approximately 255.997 square kilometres on the geography cast. This validates geometry structure only and does not approve the source or license.

An `EXPLAIN (ANALYZE, BUFFERS)` probe inserted 10,000 synthetic locations inside a rolled-back transaction and requested the nearest 20. PostgreSQL used `locations_position_gist` through an index scan, followed by a small incremental sort for the deterministic ID tie-breaker. The measured local execution time was 8.754 ms. That timing is evidence for this workstation and dataset, not a production latency guarantee.

Commands executed:

```text
npm run db:start
npm run db:reset
npm run db:test
npm run db:lint
npm run db:stop
```

`npm run db:lint` completed with exit code zero. Its findings were confined to functions installed in the Supabase-managed `extensions` schema, including PostGIS compatibility functions; it reported no finding against the project-authored `stage0_geo` schema. Those upstream findings are recorded rather than modified locally.

The Stage 0 PostGIS compatibility gate is passed. The disposable spike remains separate from the canonical product schema.
