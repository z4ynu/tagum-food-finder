# Product Requirements Document

## Document control

- Product: Tagum Food Finder
- Working consumer name: Asa Ta Mangaon?
- Status: Discovery
- Last updated: 2026-10-12
- Rule: A statement marked `Proposed` is not approved until the user confirms it.
- Workflow: Complete and approve this PRD before creating architecture, design-system, data, or security documents.

## Discovery method

Each important decision will be evaluated for user value, technical feasibility, data availability, privacy, cost, maintenance, scalability, and appropriate development phase. For every decision, the interview will provide a recommended choice, viable alternatives, tradeoffs, stage impact, and one exact question for approval. Follow-up questions will continue until the answer is precise enough to produce testable requirements. Unresolved decisions remain explicit rather than being silently assumed.

## Product vision

Build a scalable, mobile-first Progressive Web App that helps a person or group in Tagum find food based on their current position and immediate needs. The experience begins with a map of nearby food places and becomes more useful through distance, budget, craving, and occasion filters.

The product is locally focused and decision-oriented. It should help users answer “Where should we eat right now?” rather than merely presenting a directory or delivery catalog.

## Confirmed product direction

- The first product will be a Progressive Web App.
- The system should be designed to scale beyond an initial prototype.
- The map should show the user's current position after explicit location permission.
- Available food places in Tagum should appear as map markers.
- The experience should identify the closest suitable food place.
- The user should be able to request a route to a selected place.
- Discovery should support budget, craving, and occasion filters.
- Occasion examples include date night, barkada hangout, and family dinner.
- The product should prioritize local, needs-based discovery rather than copying Tripadvisor or Foodpanda.
- A spin-the-wheel feature should let a user enter candidate food places and randomly choose one.
- User accounts are not yet approved. They may be added if their value justifies the privacy and security obligations.
- The owner does not want the product to depend on manually onboarding every food place.

## Problem statement

People deciding where to eat often know their constraints but not the establishment name. Existing platforms tend to start with listings, delivery inventory, or general travel reviews. Tagum Food Finder should start with the diner's live context: current location, travel distance, available budget, craving, group needs, and occasion.

## Primary audience

Status: Open.

The product currently targets people and groups looking for food in Tagum. The single primary V1 audience and its defining situation still need to be selected.

## Value proposition

See food places around you, narrow them to what fits the moment, and get a route to the best nearby option.

## Proposed core journey

1. A visitor opens the PWA without being required to sign in.
2. The visitor grants location access or chooses a location manually.
3. The map shows known food places around that location.
4. The app identifies nearby options and allows the visitor to filter by budget, craving, and occasion.
5. The visitor selects a place and requests directions or route guidance.
6. If the group already has candidates, the visitor can use the spin-the-wheel feature to choose one.

## Capability register

| Capability | Recommended phase | Status | Feasibility note |
| --- | --- | --- | --- |
| Installable responsive PWA | MVP | Confirmed | Straightforward with standard web-platform support |
| Browse without an account | MVP | Proposed | Reduces friction and avoids unnecessary personal data |
| Current-location permission and fallback location | MVP | Confirmed | Requires HTTPS, consent, denial handling, and accuracy states |
| Map with food-place markers | MVP | Confirmed | Feasible after a licensed data source and map provider are selected |
| Nearest-place calculation | MVP | Confirmed | Straightforward when coordinates are available |
| Route to a selected place | MVP | Confirmed | Feasible; in-app routing versus external navigation remains open |
| Filter by craving or food category | MVP | Confirmed | Accuracy depends on source categories and local enrichment |
| Filter by budget for a person or group | MVP | Confirmed | Budget semantics and reliable price data remain unresolved |
| Filter by dining occasion | MVP | Confirmed | Requires a locally meaningful taxonomy and a trustworthy labeling method |
| User-entered spin the wheel | MVP | Confirmed | Low complexity and does not require an account if stored locally |
| Establishment details | MVP | Proposed | Available fields depend on the selected source and license |
| User accounts and saved preferences | Later or excluded | Open | Add only if persistent personalization provides enough value |
| Community corrections and enrichment | Later | Proposed | Useful for filling local data gaps but requires moderation |
| Claimed business profiles | Later | Proposed | Could improve accuracy but adds verification and support work |

## Data acquisition constraint

The product needs broad place coverage, but “scrape everything” is not an acceptable implementation requirement unless the source expressly licenses that collection and reuse.

Google Maps consumer content must not be scraped into a permanent listings database. Google's official policy restricts scraping and persistence of place content outside permitted API use. OpenStreetMap provides reusable open data under the ODbL with attribution and share-alike obligations. Foursquare currently documents a Places API backed by its Open Source Places dataset. These are candidate sources, not approved choices.

Research references:

- [Google Maps JavaScript API policies](https://developers.google.com/maps/documentation/javascript/policies)
- [OpenStreetMap copyright and license](https://www.openstreetmap.org/copyright)
- [Foursquare Places API overview](https://docs.foursquare.com/fsq-developers-places/reference/places-api-overview)

A short data-coverage investigation is required before architecture is approved. It must compare candidate sources against a representative Tagum sample and measure:

- Number of food places found
- Duplicate and closed-place rate
- Coordinate accuracy
- Category quality
- Availability of hours, contact details, photos, menus, and price information
- Licensing, attribution, caching, and redistribution requirements
- API or hosting cost at expected usage
- Update frequency and correction workflow

## Key feasibility finding

A broad point-of-interest source can make the map useful, but it is unlikely to provide complete and reliable menu prices, per-person budgets, cravings, or occasion suitability. Those discovery features require an enrichment strategy, such as curated rules, business claims, community corrections, menu ingestion from licensed sources, or a combination.

Therefore, map coverage and food intelligence must be treated as separate product capabilities with separate quality indicators.

## Proposed incomplete-data behavior

Status: Recommended, awaiting approval.

The recommended approach is a hybrid model:

- Show every valid sourced food place on the unfiltered map, even when enrichment is incomplete.
- Mark missing fields plainly, such as `Price information unavailable` or `Occasion tags not yet verified`.
- When a strict budget, craving, or occasion filter is active, rank verified matches first.
- Keep places with missing relevant data out of the confirmed-match count.
- Offer a separate, clearly labeled way to reveal nearby places whose matching data is unknown.
- Never treat missing data as a failed match.
- Do not invent prices or occasion tags. Any future estimate must be explicitly labeled and supported by a documented method.

This preserves broad local coverage without misleading users about whether a place satisfies their needs.

The main alternatives are:

| Approach | Benefit | Cost or risk | Recommendation |
| --- | --- | --- | --- |
| Hide every incomplete place | Filter results are highly trustworthy | The map may look empty and new places become invisible | Not recommended as the default |
| Show incomplete places as ordinary matches | Maximum visible coverage | Users may believe unknown places satisfy the selected budget or occasion | Reject |
| Show all places but separate verified matches from unknowns | Balances coverage and honesty | Requires clearer interface states and two result groups | Recommended |

## Proposed development stages

These stages are recommendations and require approval.

### Stage 0: Data and experience validation

- Test licensed place sources for actual Tagum coverage.
- Prototype location permission, markers, nearest-place calculation, and route handoff.
- Define what “budget,” “craving,” and “occasion” mean in data terms.
- Validate the map-first journey on mobile before building the full system.

### Stage 1: Useful map MVP

- Installable PWA
- Current or manually selected location
- Broad food-place map coverage from the approved source
- Nearest-place discovery
- Basic category filtering
- Route handoff or approved routing experience
- User-entered spin the wheel stored on the device
- Clear source, freshness, and missing-data labels

### Stage 2: Local food intelligence

- Reliable budget model
- Improved craving taxonomy
- Occasion labels
- Community corrections or structured enrichment
- Better establishment details and freshness workflows

### Stage 3: Persistent community features

- Accounts only if saved preferences, contributions, or business claims justify them
- Moderation and abuse controls
- Business ownership verification
- Optional personalization with explicit privacy controls

## Product principles

- Public discovery should work without an account unless a later decision proves an account is necessary.
- Location access must be optional, explained, and replaceable with manual location selection.
- Broad coverage and enriched-data quality must be shown separately.
- Unknown or stale information must be labeled rather than guessed.
- Organic relevance and paid placement must remain distinguishable if monetization is introduced.
- Mobile usability and fast decision-making take priority.
- The product must not copy protected listings, reviews, menus, or photos without permission.

## Proposed first-release exclusions

- Food ordering and delivery logistics
- Payments
- Table reservations
- Real-time chat
- Native iOS or Android applications
- Mandatory user accounts
- Public reviews and photo uploads
- Business claiming and advertising

These exclusions remain proposed until the MVP boundary is approved.

## Success criteria

Pending decisions:

- Primary V1 audience
- Exact Tagum geographic boundary
- Minimum acceptable place coverage and accuracy
- Acceptable percentage of places with enriched filter data
- Primary success event
- Target search-to-route conversion
- Target repeat-use rate
- Launch date or delivery constraint

## Decision register

| ID | Decision | Status |
| --- | --- | --- |
| PRD-001 | Primary V1 user | Open |
| PRD-002 | Exact V1 scope and staged rollout | Open |
| PRD-003 | Geographic boundary | Open |
| PRD-004 | Product name and public language | Open |
| PRD-005 | Core success metric | Open |
| PRD-006 | Monetization constraints | Open |
| PRD-007 | Content verification standard | Open |
| PRD-008 | Licensed place-data acquisition strategy | Open |
| PRD-009 | Treatment of incomplete place metadata | Open |
| PRD-010 | Budget definition for individuals and groups | Open |
| PRD-011 | Routing experience | Open |
| PRD-012 | Account value and account-free boundary | Open |
| PRD-013 | Craving and occasion taxonomy ownership | Open |
| PRD-014 | Spin-the-wheel inputs and persistence | Open |

## Acceptance process

This document becomes implementation-ready only when every launch-critical decision is approved, every MVP capability has measurable acceptance criteria, and the data investigation shows that the core experience is viable with a lawful and maintainable source.
