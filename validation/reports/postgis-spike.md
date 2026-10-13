# Stage 0A PostGIS Spike

## Status

Prepared but not executed against PostgreSQL.

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

## Execution blocker

The Supabase local stack requires a Docker-compatible container runtime. Docker is not currently available on this workstation, so neither the migration nor pgTAP suite has been executed. Static preparation is not recorded as a passing database result.

When Docker is available, run:

```text
npm run db:start
npm run db:reset
npm run db:test
npm run db:lint
npm run db:stop
```

The Stage 0 PostGIS gate remains open until those commands pass and an indexed query plan is captured.
