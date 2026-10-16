# Stage 0 validation workspace

This directory contains reproducible Stage 0 fixtures, scripts, and reports.

## Data handling

- Commit only synthetic or lawfully redistributable fixtures.
- Do not commit credentials, personal data, restricted source rows, or bulk provider exports.
- Keep large source snapshots outside Git.
- Identify each external snapshot in its report by source, version, retrieval date, license, and checksum.
- Write generated reports to `reports/generated/`; the directory is ignored.
- Keep generated Overture JSONL snapshots and manifests under `snapshots/`; they are ignored and must be regenerated from a pinned public release.

## Reproducibility

Every validation report must state the command and commit used, input versions and checksums, environment or device details, results, failed cases, and any quota or cost consumed.

## Continuous validation

`.github/workflows/validation.yml` runs one bounded quality job on pushes to `main`, pull requests, and manual dispatches. It installs the committed lockfile, then checks formatting, lint, types, unit tests, and the native Next.js production build used by Vercel. Superseded runs on the same ref are cancelled, and the job has a fifteen-minute limit.

A separate five-minute Gitleaks job scans repository history without application secrets or write permissions. Pull requests also run GitHub's dependency-review action and reject newly introduced high or critical advisories. Dependency review is available for public repositories and for eligible organization-owned private repositories; if the repository's visibility or plan prevents it from running, enable the equivalent GitHub security feature or document an owner-approved replacement before beta.

All third-party actions are pinned to immutable release commits. Production deployment is intentionally absent from this workflow.
