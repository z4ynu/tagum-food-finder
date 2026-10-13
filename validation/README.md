# Stage 0 validation workspace

This directory contains reproducible Stage 0 fixtures, scripts, and reports.

## Data handling

- Commit only synthetic or lawfully redistributable fixtures.
- Do not commit credentials, personal data, restricted source rows, or bulk provider exports.
- Keep large source snapshots outside Git.
- Identify each external snapshot in its report by source, version, retrieval date, license, and checksum.
- Write generated reports to `reports/generated/`; the directory is ignored.

## Reproducibility

Every validation report must state the command and commit used, input versions and checksums, environment or device details, results, failed cases, and any quota or cost consumed.
