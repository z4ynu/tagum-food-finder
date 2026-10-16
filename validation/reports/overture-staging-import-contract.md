# Overture Places staging and publication contract

## Decision

Overture Places supplements the OpenStreetMap baseline through a separate, checksummed import batch. Acquisition never writes directly to the public catalog. Generated snapshots remain outside Git and are reproducible from a pinned public Overture release.

## Implemented flow

1. `scripts/extract-overture-food-places.py` queries named `food_and_drink` records within the approved Tagum boundary's bounding box and writes deterministic JSON Lines plus a SHA-256 manifest.
2. `buildOvertureCatalogImport` verifies the manifest and exact boundary checksum, normalizes provider fields, clips points to the approved polygon, and applies the reviewed category map.
3. `npm run catalog:overture -- stage` sends only the normalized payload through a service-role-only RPC.
4. The staging transaction revalidates identifiers, checksums, coordinates, confidence, status, category usability, and the current approved boundary.
5. A separate service-role-only publication transaction creates a new immutable catalog release. It carries forward the previous release and adds only approved creates.

## Automatic publication boundary

A record is proposed for creation only when all of these are true:

- category usability is `usable`;
- Overture confidence is at least `0.8`;
- operating status is not `permanently_closed`;
- the Overture external identifier is not already linked to a changed place; and
- no active catalog place with the same normalized name is within 100 metres.

All other accepted records remain private with a machine-readable moderation reason. The publication transaction repeats the nearby exact-name duplicate check under a transaction-wide advisory lock to close the staging-to-publication race.

## Data and rights

Source records retain the Overture release, source checksum, retrieval time, normalized content hash, source update time, and `cdla-permissive-2.0` classification. Public release rows carry the source label and attribution. Website and social URLs remain in source records until a separately reviewed public-field policy is implemented. Overture does not provide verified local PHP menu prices, so this import does not infer or publish price ranges.

## Verification

A clean local Supabase reset applied the migration. The complete database suite passed 87 pgTAP assertions, including service-role enforcement, exact-name proximity moderation, the confidence threshold, source licensing, immutable release carry-forward, attribution, and idempotent publication.
