# Data

## Document control

- Status: Discovery
- Last updated: 2026-10-12
- Schema approval: Pending

## Data principles

- Maintain first-party structured data rather than copying protected third-party listings or reviews.
- Store the source and verification state for material facts.
- Distinguish an establishment from its branches and individual menu items.
- Preserve price history or at least the date on which a price was verified.
- Publish only fields intended for public use.
- Collect the minimum personal data needed for approved user features.
- Make moderation and administrative changes attributable through audit records.

## Proposed core entities

These entities are candidates and do not represent an approved schema.

| Entity | Purpose |
| --- | --- |
| Establishment | Brand or independent food business identity |
| Branch | Physical Tagum location, coordinates, contact details, and hours |
| Menu item | Discoverable food or drink with a specific price |
| Category | Craving, cuisine, dish type, or dining format classification |
| Occasion | Date, barkada, family, solo, study, or quick-meal suitability |
| Business hour | Regular and exceptional opening periods |
| Media asset | Food, venue, menu, or profile image with ownership and moderation metadata |
| Verification record | Source, verifier, checked date, and confidence for listing facts |
| User profile | Minimal account-facing user information, if accounts are approved |
| Saved item | User bookmark for an establishment, branch, menu item, or collection |
| Review | Moderated user feedback, if reviews are approved |
| Submission | Suggested establishment, correction, photo, or menu update |
| Moderation case | Review state, reason, decision, and moderator history |
| Collection | Curated and shareable group such as meals below a budget |
| Sponsorship | Clearly labeled paid placement, if monetization is approved |

## Relationships to resolve

- Whether establishments can have multiple branches at launch
- Whether menu items belong to an establishment or a specific branch
- Whether prices can vary by branch, size, option, or delivery channel
- Whether categories are curated, user-submitted, or both
- Whether occasion labels are editorial, community-voted, or algorithmic
- Whether reviews apply to an establishment, branch, menu item, or visit
- Whether opening hours require holiday and temporary-closure exceptions

## Provenance and freshness

Every publishable business fact should support the following metadata where applicable:

- Source type
- Source reference or internal evidence
- Submitted by
- Verified by
- Verified at
- Last updated at
- Confidence or verification status
- Publication status

The allowed source types, evidence retention policy, verification cadence, and stale-data behavior remain open decisions.

## Search and ranking inputs

Potential inputs include query text, category, price, open status, distance, occasion, verification quality, popularity, recency, and sponsorship. Organic relevance and paid placement must remain distinguishable.

## Personal data inventory

No personal-data fields are approved yet. If accounts or community features are approved, the data inventory must state purpose, lawful basis or user consent where applicable, retention, visibility, deletion behavior, and access roles for each field.

## Data decision register

| ID | Decision | Status |
| --- | --- | --- |
| DATA-001 | Establishment and branch model | Open |
| DATA-002 | Menu-item and price model | Open |
| DATA-003 | Category and tagging governance | Open |
| DATA-004 | Hours and temporary status model | Open |
| DATA-005 | Verification workflow and stale threshold | Open |
| DATA-006 | Search and ranking rules | Open |
| DATA-007 | User and community data | Open |
| DATA-008 | Media ownership and retention | Open |
| DATA-009 | Sponsored-content representation | Open |
| DATA-010 | Import, export, backup, and deletion rules | Open |
