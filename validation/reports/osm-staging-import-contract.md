# OSM Staging Import Contract

## Purpose

This contract defines the boundary between an approved OpenStreetMap snapshot and the public Tagum Food Finder catalog. Imports must pass through staging. An acquisition job must never write directly to the public catalog.

The contract implements the approved source, provenance, import-batch, matching, and atomic-publication model in `docs/data.md` and `docs/architecture.md`. It does not add a second catalog model.

## Input contract

An import run is valid only when all of the following inputs are present:

| Input | Required evidence |
| --- | --- |
| Source rights | Approved `osm-source-rights-and-attribution.md` record |
| Source snapshot | Pinned filename, publisher timestamp, size, and checksum |
| Local integrity | SHA-256 digest calculated after download |
| Geographic boundary | Approved Tagum City boundary file and checksum |
| Adapter | Versioned adapter identifier or source revision |
| Run context | Import batch identity, start time, and actor or scheduled job identity |

Any missing or mismatched input fails the run before staging writes occur.

## Normalized candidate shape

The adapter may emit only normalized candidate records with the following semantics. Names are descriptive contract names; the implementation may map them to the approved database columns without changing their meaning.

| Field | Requirement | Meaning |
| --- | --- | --- |
| `sourceKey` | Required | Stable `osm:{element-type}:{element-id}` identity |
| `sourceRecordId` | Required | Original OSM element type and ID |
| `sourceSnapshot` | Required | Snapshot filename or immutable version |
| `sourceUpdatedAt` | Optional | Upstream record timestamp when present in the approved extract |
| `retrievedAt` | Required | Import acquisition time |
| `contentHash` | Required | Hash of the normalized source record |
| `name` | Required | Trimmed display-name candidate |
| `latitude` | Required | WGS84 latitude within the approved boundary |
| `longitude` | Required | WGS84 longitude within the approved boundary |
| `coordinateMethod` | Required | Direct node coordinate, polygon representative point, or another approved method |
| `sourceCategories` | Required | Original food-related OSM tag values used for classification |
| `categoryCandidate` | Required | Proposed canonical category mapping |
| `cuisineLabels` | Optional | Normalized labels explicitly present in the source |
| `address` | Optional | Normalized source-supplied address components |
| `openingHoursText` | Optional | Source text only; not an app-verified open status |
| `contacts` | Optional | Source-supplied public business contact candidates |
| `sourceClosedAt` | Optional | Explicit source closure evidence, never inferred from disappearance |

The adapter must not emit inferred price bands, ratings, occasion suitability, dietary guarantees, accessibility claims, owner verification, live open status, or photo rights.

## Import pipeline

1. **Authorize the source.** Confirm the rights record is current for the selected snapshot and acquisition channel.
2. **Open an import batch.** Record the run context before processing candidates.
3. **Validate integrity.** Verify the snapshot, boundary, and manifest checksums.
4. **Normalize deterministically.** Parse approved food-place tags, normalize values, and create content hashes using the versioned adapter.
5. **Collapse source duplicates.** Keep one normalized representation per OSM element identity and prefer an area geometry representative over a duplicate line representation when both encode the same element.
6. **Enforce the boundary.** Reject candidates outside the approved Tagum City boundary or without valid coordinates and a usable name.
7. **Write staging only.** Store source records and per-record batch results without changing public canonical records.
8. **Match and classify.** Apply exact external-identity matching first, then conservative candidate matching. Route ambiguous matches or category mappings to moderation.
9. **Produce a review summary.** Report accepted, rejected, unchanged, proposed-create, proposed-update, ambiguous, and revalidation counts with reasons.
10. **Publish atomically.** After validation and operator approval, commit the approved canonical changes, field provenance, and catalog release as one transaction.
11. **Preserve the last valid release.** A failed or partial batch must not replace the active public catalog.

## Candidate action rules

| Staged condition | Permitted action |
| --- | --- |
| New unique OSM identity with valid required fields | Propose an unverified canonical place. |
| Existing exact external identity with changed content | Propose updates only for fields supported by the new source record. |
| Existing exact external identity with unchanged content hash | Record unchanged; do not mutate canonical data. |
| Source identity missing from a later snapshot | Queue revalidation; do not close, hide, or delete the place automatically. |
| Multiple plausible canonical matches | Create a moderation item; do not merge automatically. |
| Duplicate normalized records for one source identity | Collapse before staging and record the duplicate condition. |
| Invalid coordinates, missing name, or outside boundary | Reject with a machine-readable reason. |
| Explicit upstream lifecycle indication | Propose lifecycle review; do not automatically publish closure. |
| Conflicting source and owner-verified value | Preserve the owner-verified public value and queue review. |

## Initial publishable fields

The first OSM import may propose only these canonical values:

- place name;
- geographic coordinates;
- primary category;
- explicitly supplied cuisine labels; and
- explicitly supplied address components.

The following values may be retained in staging as evidence but must not be treated as verified public claims solely because OSM supplied them:

- opening-hours text;
- public business contact candidates; and
- lifecycle indicators.

The import must not create prices, price bands, photos, ratings, review scores, dietary guarantees, occasion suitability, or owner-verification status. Unknown remains a first-class value.

## Provenance and precedence

- Every published field must point to the source record and import batch that supplied it.
- Owner-verified and approved community corrections remain separate provenance classes.
- A lower-authority refresh must not silently overwrite a higher-authority approved value.
- Conflicts must be reviewable at field level rather than resolved by replacing the entire place record.
- OSM source identity must remain attached even when the public field value later comes from a different approved source.

## Security and privacy boundary

- Run ingestion with a server-side least-privilege role that can write staging but cannot bypass publication review.
- Do not expose raw import tables, internal match scores, moderation notes, or source payloads through public APIs.
- Do not log credentials, contributor personal metadata, customer personal data, or attachment contents.
- Validate and length-limit all source strings before storage and display.
- Treat URLs and phone numbers as untrusted data and normalize them before any public use.
- Keep public catalog reads on explicit safe views or response schemas.

## Required batch report

Each run must produce an auditable summary containing:

- source snapshot and checksums;
- boundary and adapter versions;
- start and completion times;
- total input and unique normalized candidates;
- counts for every action and rejection reason;
- category distribution;
- duplicate and ambiguous-match counts;
- geographic bounds and out-of-bound rejections;
- proposed public changes by field;
- unresolved moderation items; and
- publication result or failure reason.

The report must not contain secrets or private personal data.

## Acceptance checks

Before the first production import implementation is accepted, automated tests must prove that:

- a checksum mismatch prevents processing;
- the adapter produces deterministic output for the same inputs;
- duplicate geometry representations of one OSM element collapse to one candidate;
- invalid and out-of-bound coordinates are rejected;
- missing names are rejected;
- a missing source record cannot close or delete a canonical place;
- ambiguous matches cannot publish automatically;
- unknown prices and verification states remain unknown;
- higher-authority approved fields are not overwritten;
- a failed batch leaves the active catalog unchanged; and
- a successful publication writes canonical changes and field provenance atomically.

## Stage decision

**Ready for implementation after the Stage 0 product and design gate.**

The source quality check, rights record, and staging boundary are sufficient for OSM to serve as the baseline discovery source. Foursquare enrichment remains optional and outside this contract until separately approved.

- Recorded: 2026-10-14
- Quality evidence: `validation/reports/osm-quality-spot-check.md`
- Rights record: `validation/reports/osm-source-rights-and-attribution.md`
- Approved data model: `docs/data.md`
- Approved architecture: `docs/architecture.md`
