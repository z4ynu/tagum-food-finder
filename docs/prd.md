# Product Requirements Document

## Document control

- Product: Tagum Food Finder
- Working consumer name: Asa Ta Mangaon?
- Status: Discovery
- Last updated: 2026-10-12
- Rule: A statement marked `Proposed` is not approved until the user confirms it.
- Workflow: Complete and approve this PRD before creating architecture, design-system, data, or security documents.

## Product vision

Create a mobile-first food-discovery product that helps people in Tagum decide where and what to eat using practical local context such as budget, craving, location, occasion, and current availability.

The product should answer intent-based questions such as:

- Where can I eat for less than a specific amount?
- Where can I find a particular food in Tagum?
- Which places fit a date, barkada hangout, family meal, solo meal, or study session?
- Which matching places are open now?
- Which affordable or lesser-known places are worth trying?

## Problem statement

Existing directories and delivery platforms primarily organize discovery around establishments, map proximity, or delivery inventory. This product is intended to organize discovery around the diner's immediate decision: what fits the craving, budget, location, and occasion right now.

## Proposed primary audience

Status: Proposed, awaiting confirmation.

- Budget-conscious college students in Tagum
- Young working adults looking for affordable meals and social venues

Secondary audiences have not been selected.

## Proposed value proposition

Find a suitable meal in Tagum quickly, using local and price-specific information that is easy to browse and share without creating an account.

## Proposed first-release journey

1. A visitor opens the product without signing in.
2. The visitor chooses a budget, craving, location, or occasion.
3. The product returns matching meals and establishments, not only restaurant-level price bands.
4. The visitor reviews price, photos, opening status, location, and directions.
5. The visitor can refine the result or request a random matching suggestion.

## Candidate capabilities

These originate from the concept brief and require scope confirmation.

| Capability | Candidate release | Status |
| --- | --- | --- |
| Browse without an account | MVP | Proposed |
| Search and filter by meal budget | MVP | Proposed |
| Search by craving or food category | MVP | Proposed |
| Establishment and menu-item profiles | MVP | Proposed |
| Photos, prices, hours, address, and directions | MVP | Proposed |
| Admin-managed establishment data | MVP | Proposed |
| Nearby results and map view | MVP or later | Pending decision |
| Occasion filters | MVP or later | Pending decision |
| Surprise Me recommendation | MVP or later | Pending decision |
| User accounts and saved places | Later | Proposed |
| User reviews and photos | Later | Proposed |
| Community establishment submissions | Later | Proposed |
| Claimed business profiles and promotions | Future | Proposed |

## Product principles

- Browsing should not require an account.
- Prices must refer to actual menu items where possible.
- Local usefulness is more important than having the largest listing count.
- Unverified or stale information must be labeled rather than presented as fact.
- Sponsored placements must be distinguishable from organic recommendations.
- Mobile usability and fast decision-making take priority.

## Out of scope

No exclusions are approved yet. Candidate exclusions for the first release include food ordering, delivery logistics, payments, table reservations, real-time chat, and native iOS or Android applications.

## Success criteria

Pending decisions:

- Launch audience and geographic boundary
- Minimum verified establishment and menu-item inventory
- Primary success event
- Target repeat-use rate
- Target search-to-profile and profile-to-directions conversion
- Launch date or time constraint

## Decision register

| ID | Decision | Status |
| --- | --- | --- |
| PRD-001 | Primary V1 user | Open |
| PRD-002 | Exact V1 scope | Open |
| PRD-003 | Geographic boundary | Open |
| PRD-004 | Product name and public language | Open |
| PRD-005 | Core success metric | Open |
| PRD-006 | Monetization constraints | Open |
| PRD-007 | Content verification standard | Open |

## Acceptance process

This document becomes implementation-ready only when all launch-critical decisions are marked approved and every MVP capability has measurable acceptance criteria.
