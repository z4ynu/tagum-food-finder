# Design System

## Document control

- Status: Discovery
- Last updated: 2026-10-12
- Visual direction approval: Pending

## Preliminary design read

Reading this as: a mobile-first consumer food-discovery product for budget-conscious Tagum diners, with a local, energetic, practical, and trustworthy language, leaning toward an accessible custom product interface rather than a generic directory template.

This design read is proposed and must be confirmed or corrected before visual design begins.

## Proposed experience principles

- Make the next useful action obvious within the first screen.
- Show food and price before secondary business details.
- Use familiar local language without making instructions ambiguous.
- Prefer structured filters and progressive disclosure over crowded screens.
- Treat real food photography as content, not decoration.
- Keep tap targets, labels, focus states, and contrast accessible.
- Provide loading, empty, error, stale-data, and no-match states.
- Respect reduced-motion and system theme preferences unless the approved brand requires a fixed theme.

## Proposed Taste configuration

These dials are a starting hypothesis, not an approved direction.

| Dial | Proposed value | Reason |
| --- | ---: | --- |
| Design variance | 6/10 | Distinctive and local without disrupting fast task completion |
| Motion intensity | 3/10 | Responsive feedback with minimal battery, performance, and accessibility cost |
| Visual density | 6/10 | Enough information for comparison on mobile without becoming a dense dashboard |

## Required foundations

### Color

Pending decisions include brand palette, light or adaptive theme behavior, semantic status colors, map colors, and accessible contrast pairs. One accent-color system and one radius system should be selected and documented.

### Typography

Pending decisions include type family, Cebuano and Filipino character support, scale, weight availability, loading strategy, numeric price treatment, and fallback fonts.

### Spacing and layout

The system will be mobile-first. Breakpoints, content widths, spacing scale, safe-area behavior, map/list layouts, and bottom-navigation behavior remain open.

### Icons and imagery

One maintained icon family should be selected. Food photography requires aspect-ratio rules, quality standards, attribution policy, fallback imagery, moderation, and optimization rules.

### Components

Candidate primitives include buttons, links, inputs, selects, filter chips, price selectors, search suggestions, result cards, menu-item rows, establishment headers, opening-status indicators, maps, markers, drawers, dialogs, notices, skeletons, empty states, and moderation controls.

## Proposed primary screens

- Home and guided discovery
- Search results in list view
- Search results in map view, if approved
- Establishment profile
- Menu-item detail or menu section
- Surprise Me result, if approved
- Saved places, if accounts are approved
- Sign-in and account settings
- Community submission and review flows, if approved
- Administration and moderation surfaces

## Content and language decisions

| ID | Decision | Status |
| --- | --- | --- |
| DS-001 | Brand name and tagline | Open |
| DS-002 | Primary interface language | Open |
| DS-003 | Tone and code-switching rules | Open |
| DS-004 | Visual personality | Open |
| DS-005 | Color and theme strategy | Open |
| DS-006 | Typography | Open |
| DS-007 | Icon family | Open |
| DS-008 | Photography direction | Open |
| DS-009 | Motion policy | Open |
| DS-010 | Navigation model | Open |

## Pre-implementation gate

Before frontend code is created, the design direction, tokens, responsive navigation, core component states, and at least the primary discovery flow must be approved. Public-facing pages must complete the installed Taste skill's applicable pre-flight checks.
