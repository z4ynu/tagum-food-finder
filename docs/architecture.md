# Architecture

## Document control

- Status: Discovery
- Last updated: 2026-10-12
- Implementation authorization: Not granted

## Architectural goals

- Deliver a fast, mobile-first experience on common phones and variable mobile connections.
- Keep public browsing available without authentication.
- Support trustworthy, structured establishment and menu data.
- Separate public reads, authenticated community actions, moderation, and privileged administration.
- Allow the product to begin in Tagum without blocking future geographic expansion.
- Keep operational cost and maintenance appropriate for an early-stage product.

## Proposed delivery model

Status: Proposed, awaiting confirmation.

A responsive Progressive Web App is the baseline because it can be shared by URL, indexed by search engines, and optionally installed without an app-store release.

## Candidate technical baseline

The original concept suggested the following stack. None of these choices are approved yet.

| Layer | Candidate | Decision status |
| --- | --- | --- |
| Frontend | React, Vite, TypeScript | Open |
| Styling | Tailwind CSS | Open |
| Backend platform | Supabase | Open |
| Database | PostgreSQL through Supabase | Open |
| Authentication | Supabase Auth | Open |
| Privileged server logic | Supabase Edge Functions | Open |
| Maps | Leaflet with OpenStreetMap | Open |
| PWA support | Vite PWA Plugin | Open |
| Hosting | Vercel | Open |
| Analytics | Vercel Web Analytics only | Open |

Versions must come from the package manager and lockfile when implementation begins. They must not be guessed in this document.

## Proposed system boundaries

### Public web application

Responsible for discovery, filtering, establishment and menu views, shareable collections, and installable PWA behavior.

### Application data service

Responsible for public read models, authenticated user actions, validation, and authorization boundaries.

### Administration surface

Responsible for establishments, menu items, hours, photos, verification state, moderation, and audit history. It must not rely on hidden client UI as an authorization control.

### External services

Potential dependencies include maps, geocoding, image storage, email delivery, hosting, and privacy-conscious analytics. Each dependency requires approval for cost, licensing, reliability, and data handling.

## Proposed request flow

1. The browser requests public discovery data through a restricted public API or database policy.
2. The data layer returns only published, non-sensitive fields.
3. Authenticated actions use the user's session and row-level authorization.
4. Moderation and administrative mutations use server-side privileged operations.
5. Images are served from managed storage with explicit upload and publication rules.

## Quality attributes to define

| Attribute | Required decision |
| --- | --- |
| Performance | Supported devices, connection assumptions, page-weight budget, Core Web Vitals targets |
| Availability | Acceptable downtime and degradation behavior |
| Scale | Expected establishments, menu items, photos, searches, and active users |
| Freshness | How quickly price, hour, and availability changes must appear |
| Offline behavior | Which screens or data remain available without a connection |
| Accessibility | Target conformance and supported assistive technology |
| Localization | Cebuano, English, Filipino, or mixed-language behavior |
| Observability | Error reporting, logs, metrics, and alerting |

## Architecture decision register

| ID | Decision | Status |
| --- | --- | --- |
| ARC-001 | PWA versus standard responsive site | Open |
| ARC-002 | Frontend framework and build tool | Open |
| ARC-003 | Backend and database platform | Open |
| ARC-004 | Authentication providers | Open |
| ARC-005 | Maps, geocoding, and routing providers | Open |
| ARC-006 | Hosting and deployment environments | Open |
| ARC-007 | Search implementation | Open |
| ARC-008 | Image storage and transformation | Open |
| ARC-009 | Offline and installability scope | Open |
| ARC-010 | Monitoring and analytics | Open |

## Environment model

At minimum, development and production environments are expected. A separate preview or staging environment remains an open decision. Secrets must be stored in provider-managed environment settings and never committed.
