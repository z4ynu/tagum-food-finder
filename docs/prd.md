# Asa Ta Mangaon? Product Requirements Document

## Document control

| Field | Value |
| --- | --- |
| Product | Asa Ta Mangaon? |
| Descriptor | Tagum Food Finder |
| Document status | Approved |
| Discovery status | Complete |
| Last updated | 2026-10-13 |
| Approved | 2026-10-13 |
| Target milestone | Private beta in February 2027 |
| Product owner | Repository owner |
| Build model | Solo-built |

This document defines the product requirements agreed during discovery. Technical architecture, design tokens, database schema, and security implementation will be specified separately after this PRD is approved.

## Executive summary

Asa Ta Mangaon? is a scalable, installable Progressive Web App for finding food places within Tagum City. It uses a person's live location or a manually selected location to show nearby food places on a map, identify the closest suitable options, filter them by current needs, and hand the selected destination to an external navigation application.

The product is not a delivery marketplace, travel-review directory, or restaurant-ranking site. Its core job is to help someone currently in Tagum answer: “Where should I eat right now?”

The experience is usable without signing in. Accounts add cloud persistence and trusted participation: saved places, saved wheel lists, community corrections, and account settings. Community changes never publish automatically.

## Product vision

Become Tagum City's most useful food-decision tool by combining broad local place coverage with honest, progressively enriched information about budget, cravings, occasions, and dietary needs.

## Product goals

1. Help a user reach a suitable food-place decision in less than 60 seconds.
2. Show broad, lawful coverage of customer-facing food places inside Tagum City.
3. Make location, proximity, budget, craving, and occasion the center of discovery.
4. Remain useful when place information is incomplete without presenting unknown data as fact.
5. Improve local data through moderated community corrections.
6. Support long-term operation and growth while remaining feasible for one developer.
7. Validate usefulness through actual destination and route intent rather than vanity traffic.

## Non-goals for the MVP

- Food ordering or delivery logistics
- Payments
- Table reservations
- Native iOS or Android applications
- In-app turn-by-turn navigation
- Public star ratings or written reviews
- Public user photo galleries
- Live group voting or multiplayer wheel sessions
- Push notifications
- Business profile claiming
- Paid placement or monetization
- Guaranteed complete menu coverage
- Guaranteed real-time opening status

## Geographic scope

The private beta and MVP cover food places within the official boundary of Tagum City. Places outside that boundary are excluded from launch results, even when they are physically close to the user. Expansion should occur city by city after the Tagum experience is validated.

## Audience

### Demographic reach

The product is for anyone seeking food within Tagum City. It does not target a restricted age, occupation, income, or social group.

### Primary behavior

The first experience is optimized for one person currently in Tagum who wants to decide where to eat now. Group budgets and group-oriented occasions are supported, but solo decision-making takes priority when interaction complexity conflicts.

## Brand and language

- Public product name: `Asa Ta Mangaon?`
- Descriptive subtitle: `Tagum Food Finder`
- Interface language: English
- Cebuano may appear in the product name and proper local names, but controls, instructions, errors, moderation states, legal content, and accessibility labels use English.
- Tone: local, practical, friendly, and direct.

## Core value proposition

See food places around you, narrow them to what fits the moment, and get directions to the best nearby option.

## Product differentiation

The product competes through needs-based local discovery rather than listing volume, delivery inventory, or popularity rankings. Its memorable behavior is combining live location with budget, craving, occasion, and decision tools designed specifically for eating in Tagum.

## Product principles

1. Discovery works before registration.
2. Location permission is optional and replaceable with manual location selection.
3. Unknown data remains unknown and is never silently treated as a match or mismatch.
4. Verified matches and incomplete listings are visually and semantically distinct.
5. Broad coverage and information quality are measured separately.
6. Community input is structured, attributable to an account, and moderated.
7. Paid influence never silently alters organic relevance.
8. Protected listings, reviews, menus, and photos are not copied without permission.
9. Mobile decision speed takes priority over feature density.
10. The product must remain operable within the owner's time and cost constraints.

## User roles

### Anonymous visitor

Can:

- Browse the map and place listings
- Use live location or select a location manually
- Use filters
- View nearby and closest places
- Open external navigation
- Use the spin wheel
- Store temporary or device-local wheel information

Cannot:

- Submit place corrections
- Save data to the cloud
- Access moderation features

### Registered user

Can perform all anonymous actions and can also:

- Save favorite places to the cloud
- Save wheel lists to the cloud
- Submit structured place corrections with required evidence
- Review their own submission status through a private reference
- Manage their account and request account deletion

### Administrator

The product owner is the sole initial administrator and moderator. The administrator can:

- Review, edit, approve, reject, merge, or mark submissions insufficient
- Manage food places and place status
- Resolve duplicates
- Manage categories, cravings, occasions, and verified attributes
- Review data-source and verification metadata
- Perform approved bulk import and revalidation operations

Additional moderation roles may be introduced after submission volume demonstrates a need.

## Authentication requirements

- Accounts must be implemented in the MVP.
- Registration is not required for public discovery.
- Authentication should support email magic links and Google sign-in.
- Password-based authentication is not required unless a later technical review finds it necessary.
- Signed-in state provides cloud persistence and contribution access.
- Account collection must remain minimal and purpose-specific.

## Primary user journey

1. The visitor opens the PWA.
2. The product explains why location improves results.
3. The visitor grants live location permission or selects a location manually.
4. The map shows known food places within Tagum City.
5. The product highlights nearby places and identifies the closest options using geographic distance.
6. The visitor optionally applies budget, craving, occasion, or verified dietary filters.
7. Verified matches appear first. Listings with relevant unknown information remain accessible in a separate fallback group.
8. The visitor opens a place profile.
9. The visitor requests directions, which open in an external navigation application.
10. The route request is recorded as the primary success event using privacy-conscious aggregate analytics.

## Functional requirements

### PWA and access

| ID | Requirement |
| --- | --- |
| FR-001 | The product must be an installable, responsive Progressive Web App. |
| FR-002 | Public discovery must function without registration or sign-in. |
| FR-003 | The application shell and recently viewed places should remain available when offline. Fresh search, map data, and routing may require connectivity. |
| FR-004 | The product must provide clear states for offline, loading, unavailable data, errors, and empty results. |

### Location and map

| ID | Requirement |
| --- | --- |
| FR-005 | The product must request location only after explaining its purpose. |
| FR-006 | The product must offer manual location selection when permission is denied, unavailable, or inaccurate. |
| FR-007 | Live location is used for the active experience and must not create a location-history feature. |
| FR-008 | The default map must show all valid sourced food places within Tagum City. |
| FR-009 | Markers must cluster when map density makes individual markers unusable. |
| FR-010 | The product must identify nearby places and calculate closest places using geographic distance. It does not need separate walking, driving, or transit ranking. |
| FR-011 | Selecting directions must open the destination in an external navigation application. |
| FR-012 | In-app turn-by-turn navigation is excluded from the MVP. |

### Place eligibility

The MVP may include:

- Restaurants
- Cafés
- Bakeries
- Carinderias
- Food stalls
- Mall kiosks
- Chain food establishments
- Verified home-based food businesses with customer-facing pickup locations
- Convenience stores with prepared meals
- Bars where food is a meaningful offering
- Market vendors with stable, identifiable customer locations

Delivery-only sellers without a customer-facing pickup location are excluded.

### Place profile

| ID | Requirement |
| --- | --- |
| FR-013 | Every place profile must show its name, location, source state, and available category information. |
| FR-014 | Profiles should show available hours, contact details, price information, photos, and menus when lawfully sourced. |
| FR-015 | A place may launch without a photo or menu. Missing media must not block map coverage. |
| FR-016 | Only licensed source media, business-provided media, or approved user attachments with confirmed sharing rights may be published. |
| FR-017 | Exact verification dates do not need to appear publicly. The interface must use meaningful states such as `Verified`, `Information may be outdated`, or `Community update pending`. |

### Filters

| ID | Requirement |
| --- | --- |
| FR-018 | Users must be able to filter by budget, craving, occasion, and verified dietary or religious attributes. |
| FR-019 | Budget input defaults to a per-person food-and-drink amount. |
| FR-020 | Users may provide group size to calculate a total group budget. |
| FR-021 | Known service charges should be included in budget calculations. |
| FR-022 | Actual menu-item prices produce verified budget matches. |
| FR-023 | Estimated establishment price bands may produce clearly labeled probable matches but must not count as verified matches. |
| FR-024 | Unknown information must never be interpreted as a failed match. |

### Initial craving taxonomy

- Rice meals
- Chicken
- Burgers
- Samgyupsal
- Seafood
- Filipino food
- Street food
- Coffee
- Milk tea
- Desserts
- Late-night food

The taxonomy may be refined through observed search behavior and moderated suggestions.

### Initial occasion taxonomy

- Date night
- Barkada hangout
- Family meal
- Solo meal
- Study or work café
- Quick lunch
- Celebration
- Late-night food

Occasion labels are curated product metadata, not public ratings.

### Dietary and religious attributes

- Vegetarian
- Vegan
- Halal
- Allergen-related information

These attributes must not be inferred from cuisine, name, imagery, or user assumptions. They may be displayed only when supported by accepted evidence. They become active filters only when coverage is sufficient to produce useful and honest results.

### Incomplete-data behavior

| ID | Requirement |
| --- | --- |
| FR-025 | The unfiltered map must show every valid sourced place even when enrichment is incomplete. |
| FR-026 | Missing fields must be stated plainly, such as `Price information unavailable`. |
| FR-027 | Active filters must rank verified matches first. |
| FR-028 | Places with unknown relevant data must remain outside the confirmed-match count. |
| FR-029 | Users must be able to reveal a separate group of nearby places whose match state is unknown. |
| FR-030 | The product must never invent prices, dietary status, or occasion suitability. |

### Result ranking

Organic results rank using the following priority:

1. Verified match to active filters
2. Geographic proximity
3. Verification quality
4. Information freshness
5. Availability of useful profile details

Popularity does not automatically outrank local relevance. Paid placement is excluded from the MVP and must never be presented as organic relevance in later releases.

### No-result behavior

When filters return no verified matches, the product must:

1. Explain which active constraints limited the results.
2. Suggest relaxing one constraint at a time.
3. Offer nearby places with unknown relevant information as a separately labeled fallback.
4. Avoid claiming that no suitable place exists.

### Opening status

`Open now` is excluded until data validation demonstrates sufficiently reliable operating hours. It is preferable to omit opening status than to provide misleading information.

## Spin-the-wheel requirements

| ID | Requirement |
| --- | --- |
| FR-031 | A user can manually enter food-place choices into a wheel. |
| FR-032 | A user can build a wheel from current filtered results. |
| FR-033 | One phone runs the wheel; live synchronization and group voting are not required. |
| FR-034 | Every eligible entry has equal probability by default. |
| FR-035 | Users can remove a previously selected result before spinning again. |
| FR-036 | Anonymous wheel use and device-local persistence must work without an account. |
| FR-037 | Registered users can save wheel lists to the cloud. |
| FR-038 | Weighted favorites are excluded from the initial wheel. |

## Community correction requirements

Each place profile must provide a structured `Suggest an update` action.

### Account and submission rules

- Submission requires a registered account.
- Free-form messages are not the primary correction mechanism.
- Contact information already associated with the account is used only for submission follow-up and account operations.
- A private reference allows the contributor to review submission status.
- A submission never changes public data automatically.

### Supported submission types

- Price or menu change
- Food or cuisine category
- Occasion suitability
- Opening hours
- Temporary closure
- Permanent closure
- Moved location
- Duplicate place
- Missing or incorrect contact information
- Missing or incorrect photo or menu

### Evidence rules

- Attachments are required for price, hours, menu, closure, moved-location, and ownership-related changes.
- Attachments are optional for craving, cuisine, and occasion suggestions.
- Uploaders must confirm that they are permitted to share uploaded material.
- Upload restrictions and moderation apply before any media becomes public.

### Moderation behavior

- New submissions enter a private queue.
- The administrator can approve, edit, reject, merge, or mark a submission insufficient.
- Approved changes retain their source, review state, and internal verification timestamp.
- Rate limiting, bot protection, duplicate detection, and upload validation are required.
- The internal moderation target is 72 hours, but the product makes no public turnaround guarantee.
- The owner allocates approximately two hours per week to moderation.

Community corrections improve the product after launch but do not replace the initial place-data source.

## Data acquisition requirements

The owner does not want to manually onboard every food place. The product must begin from one or more lawful, maintainable place-data sources.

Google Maps consumer content must not be scraped into a permanent listings database. Stage 0 must compare lawful candidates, including OpenStreetMap and Foursquare's open places offering, using actual Tagum coverage rather than marketing claims.

Research references:

- [Google Maps JavaScript API policies](https://developers.google.com/maps/documentation/javascript/policies)
- [OpenStreetMap copyright and license](https://www.openstreetmap.org/copyright)
- [Foursquare Places API overview](https://docs.foursquare.com/fsq-developers-places/reference/places-api-overview)

### Stage 0 source evaluation

Evaluate candidate sources for:

- Food-place count within Tagum City
- Coordinate accuracy
- Duplicate records
- Permanently closed records
- Category quality
- Availability of hours, contacts, photos, menus, and prices
- Licensing and attribution obligations
- Caching and redistribution restrictions
- API, tile, routing, and storage costs
- Update frequency
- Correction workflow

### Data launch gate

Audit a representative sample of 100 real Tagum food places. Proceed with full MVP implementation only if the selected approach:

- Finds at least 80 of the 100 sampled places
- Provides usable coordinates for at least 95% of returned places
- Keeps duplicate and permanently closed results below 5%
- Fits the approved operating-cost ceiling
- Supports a lawful correction and refresh strategy

This audit is product validation, not manual onboarding.

## Analytics and success measurement

### Primary success event

A route request is the primary success event because it indicates that the product helped a user choose a destination.

### Beta measurements

- Map sessions
- Successful location acquisition or manual location selection
- Searches
- Filter use
- Verified-match result counts
- Unknown-data fallback use
- Place-profile opens
- Route requests
- Spin-wheel use
- Account registrations
- Favorites and saved wheels
- Correction submissions
- Approved correction rate
- Repeat usage

Only privacy-conscious aggregate analytics required to improve discovery should be collected. Numeric success targets will be established from real private-beta behavior rather than invented before usage exists.

## MVP scope

### Included

- Installable PWA
- Anonymous public discovery
- User accounts with email magic link and Google sign-in
- Cloud favorites and saved wheel lists for registered users
- Live location and manual fallback
- Tagum food-place map with marker clustering
- Nearby and closest-place discovery
- External navigation handoff
- Basic craving taxonomy
- Budget model with verified and probable match states
- Occasion taxonomy
- Verified dietary and religious attributes when available
- Honest incomplete-data behavior
- Place profiles with available lawful details and media
- Device-local and account-saved spin wheels
- Structured signed-in community corrections
- Attachment evidence
- Owner moderation queue
- Administrative place and taxonomy management
- Bulk import, duplicate review, and revalidation support
- Privacy-conscious product analytics
- Offline application shell and recently viewed places

### Excluded

All items listed under `Non-goals for the MVP` are excluded unless this PRD is formally revised.

## Development stages

### Stage 0: Data and experience validation

- Evaluate lawful place sources against the launch gate.
- Prototype location permission and manual fallback.
- Prototype the map, marker clustering, nearest-place calculation, and external route handoff.
- Validate the budget model and enrichment feasibility.
- Confirm that expected provider costs fit the monthly ceiling.

### Stage 1: Private-beta MVP

- Implement the approved MVP scope.
- Invite controlled Tagum beta usage.
- Measure behavior and data gaps.
- Operate the correction and moderation workflow.
- Establish numeric product targets from observed usage.

### Stage 2: Local food intelligence

- Increase verified price and menu coverage.
- Refine craving and occasion taxonomies.
- Improve dietary-information coverage.
- Add data-quality and revalidation tools based on observed failure modes.
- Consider public launch after quality gates are met.

### Stage 3: Business and community expansion

- Evaluate verified business claims.
- Evaluate additional moderator roles.
- Evaluate structured contributor reputation.
- Test clearly labeled featured placements and aggregated business analytics.
- Expand city by city only after Tagum operations are sustainable.

## Operating constraints

| Constraint | Approved value |
| --- | --- |
| Development model | Solo-built |
| Development capacity | Approximately 12 hours per week |
| Moderation capacity | Approximately 2 hours per week |
| Monthly operating-cost ceiling | ₱3,000 |
| Private-beta target | February 2027 |
| Product ambition | Real long-term service launched as a startup experiment |

Provider usage must be monitored against the cost ceiling. Architecture must include budget alerts, quotas, caching that complies with source licenses, and graceful degradation when an external service is unavailable or its cost limit is reached.

## Key risks and required mitigations

| Risk | Required mitigation |
| --- | --- |
| Insufficient Tagum place coverage | Complete Stage 0 audit before full implementation |
| Missing budget and occasion data | Separate broad coverage from verified enrichment and show unknown states |
| Stale or closed listings | Moderated corrections, internal freshness metadata, and revalidation tooling |
| Misleading dietary or halal information | Publish only evidence-backed verified attributes |
| Copyright or licensing violations | Use approved sources and rights-confirmed media only |
| Spam or malicious corrections | Require accounts, apply rate limits, require evidence, and moderate every change |
| Owner moderation overload | Use structured fields, duplicate detection, bulk tools, and deferred reputation features |
| Provider cost growth | Enforce the monthly ceiling with quotas, monitoring, and graceful degradation |
| Location privacy concerns | Use live location only for the active experience and avoid location history |
| Premature complexity | Keep delivery, payments, reviews, live collaboration, and native apps out of the MVP |

## PRD acceptance criteria

This PRD is ready for approval when the product owner confirms that it accurately represents the discovery decisions. After approval:

1. Product scope changes require an explicit PRD revision.
2. Architecture discovery begins before `docs/architecture.md` is created.
3. No product implementation begins until the required downstream documents are completed and approved in sequence.
