# Validation fixtures

This directory is for small synthetic or lawfully redistributable inputs used by Stage 0 validation.

Fixture rules:

- identify the schema version, source, source version, retrieval date, license, and checksum when a fixture comes from an external publication;
- use synthetic identifiers and content for unit tests whenever real records are unnecessary;
- do not add credentials, personal data, private evidence, Google Maps consumer content, or provider rows whose terms prohibit redistribution;
- keep bulk snapshots outside Git and identify them only through the applicable validation report;
- do not treat the manually verified 100-place reference sample as production catalog data.

The first catalog-audit tests construct synthetic candidates in TypeScript so the approved metric boundaries can be verified without committing any real business record.

`synthetic-boundary.osm` is a four-node administrative boundary used to verify the pinned, containerized Osmium extraction path before processing the Philippines snapshot. It is project-authored synthetic test data and contains no contributor or business information.

`tagum-reference-sample.json` contains the owner-approved, locked sampling plan and an initially empty place list. The sample stays in draft assembly status until exactly 100 lawfully evidenced places fulfill its category, official PSA urban/rural, business-type, opening-era, and barangay targets. Provider measurement cannot begin against a draft, and real entries require lawful evidence for identity, location, category, and open status.
