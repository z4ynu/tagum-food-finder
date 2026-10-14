# Asa Ta Mangaon? Design System

## Document control

| Field | Value |
| --- | --- |
| Product | Asa Ta Mangaon? |
| Descriptor | Tagum Food Finder |
| Document status | Approved |
| Discovery status | Complete |
| Last updated | 2026-10-14 |
| Approved | 2026-10-13 |
| Target milestone | Private beta in February 2027 |
| Product owner | Repository owner |
| Build model | Solo-built |

This document defines the visual language, interaction patterns, responsive behavior, accessibility targets, content style, and component rules for the public PWA and its administrative surface.

It applies the approved requirements in [`prd.md`](./prd.md) and the technical boundaries in [`architecture.md`](./architecture.md). Data definitions belong in `data.md`. Security implementation and privacy procedures belong in `security.md`.

## Design read

Reading this as: a greenfield consumer food-discovery PWA for Tagum residents and visitors, with a friendly local voice, utility-first map experience, and lively but trustworthy visual language.

The product must feel like a local decision companion, not a delivery marketplace, travel directory, luxury restaurant guide, or generic map clone.

## Design dials

| Dial | Value | Interpretation |
| --- | ---: | --- |
| `DESIGN_VARIANCE` | 6 | Distinctive composition with predictable task flows |
| `MOTION_INTENSITY` | 4 | Functional transitions and feedback without cinematic effects |
| `VISUAL_DENSITY` | 6 | Fast decision information without dashboard-level compression |

The public discovery experience may use more expressive spacing and imagery. Correction forms and the moderation interface use conventional, denser product patterns. The same tokens and accessibility rules apply to both.

## Experience principles

1. The map is context, not the only interface.
2. A person should understand the nearest useful option within seconds.
3. Unknown information must look different from negative information.
4. Distance, budget, match reason, and verification state outrank decorative content.
5. Registration never interrupts anonymous discovery.
6. Real local photos are valuable. Generic stock food imagery is misleading.
7. Color supports meaning but never carries meaning alone.
8. Motion explains hierarchy, feedback, or state change. It does not decorate idle screens.
9. Mobile portrait is the primary canvas.
10. Local character comes from language, real places, and behavior rather than cultural clichés.

## Foundation

### Component approach

The approved foundation is:

- Tailwind CSS for tokens, layout, and responsive utilities;
- customized shadcn-style components built on accessible Radix primitives where appropriate;
- one app-owned component layer rather than multiple visual systems;
- Figtree as the primary type family;
- Phosphor Icons as the only general-purpose icon family;
- Motion for the small number of transitions that need more than CSS.

Default shadcn styling must not ship unchanged. Components must use the tokens, radii, states, typography, and interaction rules in this document.

The implementation must inspect the package manifest before adding any dependency. Exact package versions are selected and locked when the application is scaffolded.

### Greenfield mode

This is a greenfield system. There is no existing interface to preserve. The approved product name, requirements, language, routes established later, legal copy, and accessibility behavior must not be changed silently during implementation.

### Brand identity

The approved mascot mark is a friendly local food guide combining a location-pin silhouette, rice-bowl curve, leaf sprout, fork, and restrained face. It communicates food discovery without borrowing delivery-marketplace imagery.

- Use the standalone mark for favicons, PWA icons, compact navigation, and branded product moments such as the wheel hub.
- Compose the primary lockup from the mark and live Figtree text so the product name remains crisp, accessible, and responsive.
- Keep the mark's proportions, colors, face, sprout, bowl curve, and fork unchanged.
- Do not add a chef hat, delivery bag, vehicle, food photo, or unapproved mascot name.
- Do not stretch, rotate, recolor, or place the mark on a background that obscures its dark-green outline.
- Expression variants require separate approval before use.

Production asset locations and concept history are recorded in [`brand/mascot-logo-concept-01.md`](./brand/mascot-logo-concept-01.md).

## Color system

### Supplied brand palette

| Token | Value | Primary use |
| --- | --- | --- |
| `brand-700` | `#2E7D32` | Primary actions, selected controls, active markers, brand emphasis |
| `brand-800` | `#256628` | Primary action hover |
| `brand-900` | `#1F5722` | Primary action pressed state |
| `brand-500` | `#4CAF50` | Graphic fills, charts, active illustrations, large non-text accents |
| `brand-200` | `#A5D6A7` | Selected surfaces, soft map states, subtle highlights |
| `neutral-0` | `#FFFFFF` | Elevated surfaces and high-contrast text on dark green |
| `canvas-50` | `#F7FAF7` | Default light canvas |
| `ink-900` | `#1F2D1F` | Primary text and icons |
| `sage-500` | `#6E7F6E` | Decorative muted elements, disabled borders, large labels only |
| `lime-300` | `#C5E86C` | Limited highlight, focus accent, wheel outcome, and callout emphasis |
| `border-light` | `#D5E3D5` | Default borders and dividers on light surfaces |

The palette is a controlled green family with one limited lime highlight. `brand-700` is the primary interactive color. `lime-300` must not become a second general-purpose button color.

### Accessibility correction

`sage-500` has insufficient contrast for normal-size text on `neutral-0` and `canvas-50`. Preserve the supplied color, but do not use it for body copy.

Add the derived token:

| Token | Value | Use |
| --- | --- | --- |
| `text-secondary` | `#5A6B5A` | Secondary body text and helper copy on light surfaces |

### Light-theme semantic roles

| Role | Token |
| --- | --- |
| Page canvas | `canvas-50` |
| Primary surface | `neutral-0` |
| Raised surface | `neutral-0` |
| Primary text | `ink-900` |
| Secondary text | `text-secondary` |
| Disabled or decorative text | `sage-500`, subject to contrast and size rules |
| Primary action | `brand-700` with `neutral-0` text |
| Primary action hover | `brand-800` with `neutral-0` text |
| Primary action pressed | `brand-900` with `neutral-0` text |
| Secondary action | transparent or `neutral-0`, `brand-700` text, visible border |
| Selected surface | `brand-200` with `ink-900` text |
| Highlight surface | `lime-300` with `ink-900` text |
| Default border | `border-light` |
| Focus ring | `lime-300` plus an outer canvas separation ring |

### Dark-theme roles

Dark mode is an optional later preference, not the default public presentation. If implemented, it remains recognizably green and avoids pure black or pure white.

| Token | Value | Use |
| --- | --- | --- |
| `dark-canvas` | `#111A12` | Page background |
| `dark-surface` | `#172318` | Primary surface |
| `dark-surface-raised` | `#1F2D1F` | Sheets, dialogs, and raised controls |
| `dark-border` | `#344735` | Dividers and control boundaries |
| `dark-text` | `#F2F7F2` | Primary text |
| `dark-text-secondary` | `#B8C5B8` | Secondary text |
| `dark-action` | `#A5D6A7` | Primary interactive fill or text, depending on component |
| `dark-highlight` | `#C5E86C` | Focus and limited outcome highlight |

Dark primary buttons use `dark-action` with `ink-900` text. Dark surfaces must not use translucent glass as the default material.

### Semantic status colors

Semantic colors are exceptions to the brand accent and appear only when they communicate real status.

| State | Foreground | Soft background | Required companion |
| --- | --- | --- | --- |
| Success or verified | `#2E7D32` | `#EDF7ED` | Text or verification icon |
| Warning or stale | `#7A4E00` | `#FFF4CC` | Text explaining the stale or caution state |
| Error or rejected | `#B42318` | `#FFF1F0` | Text explaining the error and recovery action |
| Information | `#175CD3` | `#EFF8FF` | Text or information icon |

Do not decorate ordinary labels with status colors. No colored dot is allowed unless it represents a live, meaningful state.

### Verified contrast rules

| Pair | Contrast | Rule |
| --- | ---: | --- |
| White on `#2E7D32` | 5.13:1 | Approved for normal text and primary buttons |
| White on `#256628` | 6.98:1 | Approved for normal text and button hover |
| White on `#1F5722` | 8.59:1 | Approved for normal text and button pressed state |
| White on `#4CAF50` | 2.78:1 | Prohibited for normal text |
| `#1F2D1F` on `#4CAF50` | 5.20:1 | Approved for normal text |
| `#1F2D1F` on `#A5D6A7` | 8.79:1 | Approved |
| `#1F2D1F` on `#C5E86C` | 10.41:1 | Approved |
| `#1F2D1F` on `#F7FAF7` | 13.74:1 | Approved |
| `#6E7F6E` on white | 4.26:1 | Not approved for normal body text |
| `#5A6B5A` on white | 5.70:1 | Approved for secondary text |
| Dark text on dark canvas | 16.40:1 | Approved |

All final component combinations must be tested rather than inferred from token membership.

## Typography

### Family

Figtree is the sole primary type family. It should be loaded through `next/font` or self-hosted with `font-display: swap`. The product does not require a decorative serif or monospace display family.

Use tabular numerals where aligned prices, distances, counts, or moderation metrics benefit from them.

### Weight roles

| Weight | Use |
| ---: | --- |
| 400 | Body copy and supporting information |
| 500 | Controls, navigation, labels, and place metadata |
| 600 | Place names, section headings, and emphasized values |
| 700 | Product wordmark and major page titles |

Avoid thin weights. They lose clarity over maps and mobile screens.

### Type scale

| Style | Mobile | Desktop | Line height | Typical use |
| --- | --- | --- | --- | --- |
| Display | 36px | 52px | 1.05-1.1 | Marketing or first-visit statement only |
| Page title | 28px | 36px | 1.15 | Place and account pages |
| Section title | 22px | 26px | 1.2 | Major content sections |
| Card or row title | 17px | 18px | 1.25 | Place names and dialog titles |
| Body | 16px | 16px | 1.5 | Default reading text |
| Compact body | 14px | 14px | 1.45 | Metadata and admin UI |
| Label | 13px | 13px | 1.3 | Controls and short status text |
| Caption | 12px | 12px | 1.35 | Nonessential metadata only |

Normal body copy must not fall below 16px on consumer surfaces. Compact body is acceptable for secondary metadata and administration when contrast remains compliant.

### Typography rules

- Use sentence case for headings, controls, filters, and navigation.
- Avoid uppercase tracking labels as a recurring pattern.
- Keep public page headings concise and functional.
- Do not mix font families for emphasis. Use Figtree weight or italic.
- Do not use gradient text.
- Do not place important copy over busy food photography without a solid scrim.
- Product copy must not contain decorative em dashes or en dashes. Restructure the sentence or use a regular hyphen where appropriate.

## Spacing and sizing

### Base grid

Use a 4px base unit. Preferred spacing values are:

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64`

Avoid arbitrary spacing unless needed for safe-area insets, map geometry, or optical alignment.

### Touch and control sizing

- Minimum touch target: 44 by 44 CSS pixels.
- Default input height: 48px.
- Compact desktop or admin control height: 40px, while preserving a 44px hit area when possible.
- Primary mobile action height: 52px.
- Bottom navigation visual height: 64px plus device safe-area inset.
- Desktop rail width: 72px in icon mode, expandable only when labels require it.

### Layout widths

- Reading content: maximum 680px.
- Forms: maximum 640px.
- Place profile content: maximum 960px.
- General desktop shell: maximum 1440px, except the edge-to-edge map.
- Dialogs: size to task, never use a desktop modal for an entire mobile flow.

## Shape, borders, and elevation

### Radius system

The documented mixed-radius rule is:

- surfaces, sheets, dialogs, and image containers: 16px;
- inputs, buttons, result rows with contained backgrounds, and menus: 12px;
- filter chips, compact status labels, and segmented controls: full pill;
- map markers: purpose-built map geometry, not governed by surface radius.

Do not introduce additional radius sizes without updating this document.

### Borders

Use one-pixel borders to separate controls and adjacent surfaces. Long result lists use spacing and occasional group dividers, not boxes around every row.

### Elevation

Use elevation only when an element is physically or interactively above another:

- mobile results sheet;
- popover or menu;
- dialog;
- selected map preview;
- sticky action area over scrolling content.

Shadows must be softly tinted toward the surrounding green-gray hue. Do not place strong shadows on every card.

## Responsive framework

Use these standard breakpoints unless implementation evidence requires a change:

| Name | Width | Primary behavior |
| --- | ---: | --- |
| Base | below 640px | Mobile portrait, bottom navigation, map sheet |
| `sm` | 640px | Large phone and small tablet refinements |
| `md` | 768px | Tablet, optional side-by-side content |
| `lg` | 1024px | Desktop rail and persistent list-map split |
| `xl` | 1280px | Wider discovery and place profiles |
| `2xl` | 1536px | Maximum shell spacing, not larger body text |

Mobile portrait is designed first. Tablet, desktop split view, and mobile landscape are deliberate adaptations rather than stretched mobile layouts.

Use `min-height: 100dvh` for full-height application shells. Account for top, bottom, left, and right safe-area insets on installable mobile PWAs.

## Application shell

### Root behavior

The root opens directly into discovery. It is not a marketing gate.

On the first visit, show a concise introduction that explains the product and offers:

- `Use my location`
- `Choose manually`

The browser permission request occurs only after `Use my location` is activated. Returning users go directly to their previous non-sensitive discovery state where appropriate.

### Mobile navigation

Use a four-item bottom navigation:

1. Discover
2. Saved
3. Wheel
4. Account

Each item combines a Phosphor icon and visible label. The selected item uses brand color, weight, and shape, not color alone.

For anonymous visitors, Account opens a focused sign-in-benefits page. It does not force authentication.

### Desktop navigation

Use a compact left rail beside the discovery workspace. Navigation remains on one line per item and does not exceed the visual weight of the results.

The rail includes the same destinations as mobile. Account and settings remain at the lower end of the rail when space permits.

### Layer order

Use a documented z-index scale:

| Layer | Purpose |
| ---: | --- |
| 0 | Page and map content |
| 10 | Sticky headers and bottom navigation |
| 20 | Results sheet and floating map controls |
| 30 | Popovers and dropdowns |
| 40 | Dialog backdrop and dialogs |
| 50 | Toast region and critical system notices |

Do not use arbitrary high z-index values.

## Discovery experience

### Mobile layout

The default mobile discovery screen contains:

- an edge-to-edge map;
- a compact top search and filter region;
- current-location and map controls;
- an accessible draggable results sheet;
- bottom navigation beneath or integrated safely with the sheet geometry.

The results sheet has three stable positions:

1. collapsed preview with the strongest nearby result;
2. half-height results for normal browsing;
3. expanded list for scanning and keyboard or assistive-technology use.

Dragging is never the only way to change sheet position. Provide accessible expand and collapse controls with state labels.

### Desktop layout

At `lg` and above, use a persistent results list beside the map. The initial proportion is approximately 40 percent results and 60 percent map, adjusted during usability testing.

The list scrolls independently only when focus behavior, keyboard navigation, and visible scroll context remain clear. The map does not cover the navigation rail or filter panel.

### Map and list synchronization

- Selecting a marker selects and reveals its result row.
- Selecting a result row selects its marker and keeps the place visible.
- Hover may preview synchronization on pointer devices but never replaces click or keyboard selection.
- A selected item must remain identifiable without relying only on green.
- Map movement may offer `Search this area`; it must not trigger disruptive fetches continuously while panning.

### Map fallback

Every place visible through the map is also available in the ordered result list. If map tiles fail, the list remains functional with distance and available place information.

### Map controls

Map controls use 44px touch targets, visible focus styles, accessible names, and solid surfaces over the map. Required controls include:

- return to current or selected location;
- zoom where platform conventions require explicit controls;
- expand or collapse results on mobile;
- search the moved map area when applicable.

Do not overload the map with floating actions.

## Map markers and clusters

### Marker system

Use one consistent marker form. Do not encode every cuisine as a different marker shape.

Marker states include:

- default place;
- verified match;
- probable or estimated match;
- relevant data unknown;
- selected place;
- temporarily unavailable or closed when such data is displayed.

State differences combine fill, border, icon treatment, scale, and associated text. They do not depend on color alone.

The current location uses the familiar blue location convention with an optional accuracy area. It must not be confused with food-place markers or the green brand system.

### Clusters

Clusters show the number of contained places. Activating a cluster zooms or expands it. When several places occupy the same coordinate, use an accessible overlapping-marker strategy such as spiderfying or an associated list.

Cluster animation is short and spatially meaningful. Reduced-motion mode updates immediately.

### Attribution

Map attribution remains visible, legible, and reachable at every size. It must not be hidden by the results sheet, navigation, or safe-area treatment.

## Result rows

### Information order

Each result row prioritizes:

1. place name;
2. distance;
3. expected price range and confidence label;
4. match explanation;
5. primary cuisine or place category;
6. verification or freshness state;
7. real thumbnail when available.

Do not show star ratings or popularity bars in the MVP.

### Closest match

The first verified result may receive a `Closest match` explanation. This is integrated into the row rather than shown as a large floating banner.

### Images

Use a small result thumbnail only when real, permitted media exists. Missing imagery receives a structured fallback using place initials, a cuisine icon, or restrained category treatment.

Never use stock meal photography as if it depicts a specific place.

### Row behavior

- The whole row is selectable without nesting conflicting click targets.
- Secondary actions remain limited and clearly separated.
- Selection uses a visible border or surface change plus an icon or label.
- Rows are separated primarily by spacing. Avoid a heavy card around every result.

## Filters

### Entry and active state

Use one prominent `Filters` control. Active filters appear as horizontally scrollable chips near the result context.

Do not place many independent floating filter buttons over the map.

### Mobile

Filters open in a full-height bottom sheet with grouped controls. The sheet shows an updating result preview count and ends with a single `Show places` action.

### Desktop

Filters appear in a side panel adjacent to results. The user may keep the panel open while reviewing the map.

### Budget

Use selectable bands:

- Under ₱100
- ₱100-₱199
- ₱200-₱349
- ₱350-₱599
- ₱600+

Group size is optional and calculates a clearly explained total. A continuous slider is not used because the underlying data is banded and confidence varies.

### Craving and occasion

Allow one primary craving and one occasion at a time. This keeps ranking explainable. Changing either selection replaces the previous choice.

### Dietary and religious attributes

These controls are multi-select and appear only when the product can explain coverage honestly. A coverage warning must not imply that unverified places fail the selected attribute.

### No verified results

The no-result state:

1. identifies which active constraint limited results;
2. suggests one constraint to relax;
3. keeps the user's choices intact;
4. offers a separately labeled group of nearby places with relevant unknown data.

The system never removes filters without consent.

## Place profiles

### Structure

Place profiles are dedicated shareable URLs. The content order is:

1. place identity, category, and location;
2. distance and primary match reasons;
3. expected price range, source confidence, and freshness state;
4. persistent `Get directions` action;
5. available hours, contact, and supporting attributes;
6. real photos or menus when lawfully available;
7. Save, Add to wheel, Share, and Suggest an update actions;
8. source and verification explanations where useful.

Essential decision information must appear before an image gallery.

### Primary action

`Get directions` is the dominant action. On mobile, it remains available in a safe-area-aware sticky action region without hiding content.

Secondary actions do not compete visually with it. Less frequent actions may live in an accessible overflow menu.

### Missing information

State missing fields next to the relevant concept:

- `Price information unavailable`
- `Hours not confirmed`
- `Dietary information not verified`

Do not omit missing fields silently when the absence affects a decision. Do not show one generic warning banner for unrelated missing data.

### Suggest an update

Place `Suggest an update` near correctable information and in the profile action menu. Authentication may be requested after the user expresses intent, while preserving the selected place and issue type.

## Wheel experience

The wheel is playful and tactile without casino styling, artificial scarcity, flashing effects, or confetti overload.

### Visual behavior

- Use the approved green palette with the lime highlight reserved for the final selection.
- Give every entry equal visual area and probability.
- Keep labels readable and truncate only with an accessible full-name alternative.
- State that one phone controls the wheel.
- Avoid sound by default.

### Motion

The standard interaction uses a bounded spin with clear deceleration and a deterministic final selection supplied by application logic. Animation never determines the random result.

Reduced-motion mode uses a short highlight sequence and reveals the result without rotation.

### Outcome

After selection, show the place clearly with:

- Directions
- Remove
- Spin again

Do not open navigation automatically.

## Authentication and account experience

Use a focused sign-in page rather than a modal over the map. Explain the concrete benefits:

- save favorite places;
- save wheel lists;
- submit and follow corrections;
- manage account preferences.

Personal-email magic link, Google, and Facebook sign-in receive clear, consistent treatment without implying that one provider is required. Legal and privacy links remain present but do not overwhelm the primary task.

After authentication, return the user to their original context when safe.

Account preferences may contain theme selection in a later phase. The initial and default public theme is light, following the owner-approved Discovery references even when the device prefers a dark color scheme.

## Correction flow

Use a short staged flow:

1. choose the issue type;
2. enter the corrected information;
3. add required evidence;
4. review and submit.

The actual issue name serves as the step label. Avoid generic visible labels such as `Step 1` or `Stage 2`.

### Form rules

- Labels appear above inputs.
- Placeholder text never replaces a label.
- Helper text appears before an error occurs when it prevents mistakes.
- Error text appears below the relevant field.
- Required evidence rules are stated before upload.
- Upload progress, failure, and retry states are visible.
- Leaving the flow warns only when meaningful entered data would be lost.
- A sign-in interruption preserves safe draft context.

## Administrative interface

The administrator uses the same typography, colors, controls, and accessibility foundation with a higher density.

The admin surface favors:

- conventional navigation;
- compact tables or structured lists;
- persistent filters;
- bulk selection only where operations are reversible and clear;
- side-by-side evidence and proposed changes;
- explicit approve, edit, reject, merge, and insufficient-evidence actions;
- confirmation for destructive or externally visible changes;
- audit history without decorative presentation.

The public Taste direction does not justify experimental moderation layouts. Administrative efficiency and error prevention take priority.

## Component specifications

### Buttons

Variants:

- primary: `brand-700` with white text;
- secondary: bordered surface with `brand-700` or theme-appropriate text;
- quiet: text or icon treatment with a visible hover surface;
- destructive: semantic error styling, used only for destructive actions.

Rules:

- one primary action per focused region;
- labels remain on one line at desktop sizes;
- active feedback may use `scale(0.98)` or a one-pixel translation;
- disabled controls remain legible and communicate why when necessary;
- icon-only buttons require accessible names and tooltips on pointer devices.

### Chips

Chips are reserved for filters, compact statuses, and removable selections. They are not decorative category confetti.

Selected chips use a filled or strongly outlined state plus a check or removal affordance. Chip rows may scroll horizontally on mobile with visible overflow cues from clipped neighboring content, not instructional scroll text.

### Inputs

Inputs use 12px radii, visible borders, a strong focus ring, persistent labels, and inline errors. Search fields include a clear control when populated.

### Sheets and dialogs

Use sheets for mobile filters, results, and context-preserving tasks. Use dialogs for focused confirmation or short decisions. Do not place long forms in narrow centered dialogs.

Focus must be trapped appropriately, escape behavior must be predictable, and focus returns to the invoking control.

### Toasts

Toasts are used only for transient outcomes such as `Saved` or a network retry failure. Validation, missing data, moderation state, and offline status remain inline or persistent.

### Badges and states

Status treatment combines icon, words, and color. Avoid decorative pills on every row. Use status labels only when the information changes user interpretation.

### Images

- Reserve aspect ratio before loading to prevent layout shift.
- Use responsive image sizing and modern formats.
- Provide meaningful alt text for informative images.
- Use empty alt text for redundant decoration.
- Do not overlay category pills or invented photo-credit captions on images.
- Never imply a stock or generated image depicts a real place.

## Loading, empty, error, and stale states

### Loading

Use skeletons matching the final shapes:

- result-row skeletons match text and thumbnail geometry;
- profile skeletons reserve the sticky action and major fields;
- the map reserves its complete area;
- marker loading does not block the list if list data is ready.

Avoid a centered spinner as the entire screen.

### Empty

An empty state states what is empty and provides one useful action. Examples include adding places to a wheel, saving a first favorite, or clearing a limiting filter.

### Error

Errors explain what failed in plain language and offer one appropriate recovery action. Technical identifiers may be copyable in an expanded support detail but are not the headline.

### Offline

Show a persistent offline banner. Cached recent place summaries remain accessible and are marked as potentially stale. Fresh map, search, submission, and route operations explain that connectivity is required.

### Stale data

Stale source information is a data-quality state, not a system error. Use a warning treatment with clear wording and allow correction submission where relevant.

## Motion system

### Approved motion

Motion is limited to:

- results-sheet position changes;
- marker and result synchronization;
- filter selection and result-count feedback;
- menu, sheet, and dialog transitions;
- save and submission feedback;
- wheel spin and outcome;
- route-level transitions when they clarify navigation.

### Timing

| Interaction | Duration | Character |
| --- | ---: | --- |
| Press feedback | 80-120ms | Immediate |
| Chip or selection state | 120-180ms | Crisp |
| Popover or small menu | 150-220ms | Quick |
| Sheet or dialog | 220-320ms | Stable and spatial |
| Map selection synchronization | 180-300ms | Spatial |
| Wheel | Purpose-specific, bounded | Playful but not prolonged |

Animate transform and opacity. Do not animate layout dimensions on every frame. Do not use `transition: all`.

### Reduced motion

Honor `prefers-reduced-motion` for every nontrivial transition:

- sheets change state with minimal or no travel;
- map movement avoids long animated flights;
- marker scaling becomes an immediate state change;
- the wheel reveals with a short highlight sequence;
- route changes avoid choreographed page transitions.

No interaction becomes unavailable when motion is reduced.

### Prohibited motion

- automatic parallax;
- scroll hijacking;
- infinite decorative loops;
- magnetic cursor effects;
- animated gradient backgrounds;
- map markers that pulse without a real live-state meaning;
- manual window scroll listeners;
- animations driven through React state on every frame.

## Theme behavior

The app follows the device theme on first use. Registered preferences sync to the account. Anonymous preferences remain local.

The theme applies to the whole current surface. Do not alternate light and dark sections within one page.

Map tiles should switch to a corresponding map theme where the provider and attribution rules permit it. If dark tiles are unavailable, map controls and sheets must still preserve contrast without applying unreadable filters to the map canvas.

## Iconography

Use Phosphor Icons with a consistent regular or medium visual weight. Do not mix it with Lucide, Material Symbols, or hand-drawn SVG paths in the same product interface.

Icons support labels rather than replacing unfamiliar actions. Bottom navigation includes visible text. Common map conventions may use icon-only controls when each has an accessible name and tooltip where relevant.

Emoji are not part of the interface icon system. Intentional emoji may appear only in user-generated content after moderation rules are defined.

## Content design

### Voice

The voice is:

- direct;
- helpful;
- locally warm;
- non-judgmental;
- honest about uncertainty.

It is not:

- delivery-sales copy;
- exaggerated marketing;
- constantly humorous;
- bureaucratic directory language;
- fake-local slang.

### Language

Functional UI remains English. Cebuano appears in the product name, proper names, and occasional intentional local phrases that remain understandable from context.

### Labels

Preferred labels are concrete verbs and nouns:

- `Get directions`
- `Use my location`
- `Choose manually`
- `Show places`
- `Save place`
- `Add to wheel`
- `Suggest an update`
- `Spin again`

Avoid vague labels such as `Continue` when the next action can be named.

### Errors and empty states

State what happened, why when known, and one next action. Do not make jokes when location, authentication, evidence upload, or data accuracy fails.

### Uncertainty vocabulary

Use consistent phrases:

- `Verified`
- `Estimated`
- `Information may be outdated`
- `Community update pending`
- `Price information unavailable`
- `Hours not confirmed`
- `Details unknown`

Do not use `verified` as a general badge when only one field has evidence.

## Accessibility

### Target

The product targets WCAG 2.2 AA. Primary reading text should reach AAA contrast where feasible without compromising hierarchy.

### Required behaviors

- complete keyboard access;
- visible focus indication;
- 44px minimum touch targets;
- semantic headings and landmarks;
- real labels for every input;
- status announcements through appropriate live regions;
- logical focus order;
- focus restoration after sheets and dialogs;
- list alternative for all map results;
- no information encoded by color alone;
- system text resizing without clipped controls;
- reduced-motion and reduced-transparency fallbacks;
- sufficient contrast in both themes;
- accessible names for icon-only controls;
- alt text based on image purpose rather than appearance alone.

### Map accessibility

The map canvas is supplemental. The synchronized list is the complete operable representation of discovery results. Keyboard users can navigate the list, select a place, and request directions without manipulating the map.

### Forms

Errors must associate with fields programmatically. Submission summaries identify every invalid section. Required and optional states are conveyed in text.

## PWA behavior

Do not display an install prompt on first visit. Offer installation after demonstrated engagement, such as repeat use or completion of a meaningful discovery action, and allow permanent dismissal.

The installed app must respect safe areas, standalone-mode navigation, back behavior, theme color, and offline states.

Installation is optional. The complete public experience remains usable in the browser.

## Performance design constraints

Targets:

- LCP below 2.5 seconds;
- INP below 200 milliseconds;
- CLS below 0.1.

Design implications:

- discovery is useful before optional images finish loading;
- reserve all media and map dimensions;
- lazy-load below-the-fold profile media;
- do not bundle heavy motion or image-gallery code into first discovery paint;
- isolate interactive client components;
- virtualize only after measurement shows the result list needs it;
- use skeletons that do not cause reflow;
- keep map overlay count bounded through clustering.

## Design QA matrix

Every implemented public surface must be reviewed for:

- mobile portrait, mobile landscape, tablet, and desktop;
- light and dark themes;
- keyboard-only use;
- common screen-reader navigation;
- 200 percent text zoom;
- reduced motion;
- denied or unavailable geolocation;
- offline and slow network;
- missing photos;
- missing price, hours, and dietary data;
- long real place names;
- zero, one, and many results;
- loading, success, empty, stale, and error states;
- map failure with usable list fallback;
- safe-area behavior in installed mode.

## Anti-patterns

Do not ship:

- delivery-service visual mimicry;
- pink Foodpanda-like branding or Grab-like brand imitation;
- stock food photos attached to real listings;
- AI-purple gradients or neon glows;
- glass effects as the default surface material;
- a centered marketing hero before discovery;
- three equal feature cards as a default layout;
- oversized display text that delays the map task;
- cards around every result and metadata block;
- decorative status dots;
- cuisine-specific marker chaos;
- ratings or popularity bars in the MVP;
- automatic filter removal;
- unknown values presented as negative matches;
- repeated permission prompts;
- modal forms that exceed the viewport;
- spinner-only full screens;
- color-only verification states;
- unlabeled icon buttons;
- animations without reduced-motion behavior;
- generic `Something went wrong` messages without a next action;
- first-visit PWA install prompts;
- em dashes or en dashes in visible product copy.

## Implementation readiness checklist

Before public UI implementation begins, confirm:

- [ ] A visual mockup or design image for the specific page has been shown to and explicitly approved by the product owner.
- [ ] Mobile and desktop mockups are included when the page composition differs materially across those breakpoints.
- [ ] Figtree delivery method and included weights are selected.
- [ ] Tailwind and the app-owned component layer are installed at verified versions.
- [ ] Light and dark semantic tokens exist as CSS variables or one equivalent strategy.
- [ ] Contrast tests cover every control state.
- [ ] The radius, spacing, typography, icon, and z-index systems are centralized.
- [ ] Map attribution remains visible at every results-sheet position.
- [ ] Mobile bottom navigation and results sheet coexist with safe-area insets.
- [ ] Discovery has map and fully operable list representations.
- [ ] Unknown-data states are distinct from mismatches.
- [ ] Filters preserve selections and expose confirmed versus unknown counts.
- [ ] Real-place imagery never falls back to misleading stock food.
- [ ] Loading, empty, stale, offline, and error states are designed.
- [ ] Reduced motion changes the wheel and map transitions safely.
- [ ] Dark mode is tested rather than mechanically inverted.
- [ ] Admin layouts use conventional dense patterns.
- [ ] No provider or library default styling remains unreviewed.
- [ ] Every visible string receives a copy review.
- [ ] Lighthouse and accessibility checks are part of delivery verification.

## Design-system acceptance criteria

This document is ready for approval when the product owner confirms that:

1. the green palette and Figtree typography reflect the intended identity;
2. the map-first mobile sheet and desktop split layout match the intended experience;
3. filter, profile, wheel, account, correction, and admin patterns are acceptable;
4. light and dark modes, accessibility, responsive behavior, and motion rules are acceptable;
5. implementation should use these tokens and patterns without silently changing the visual direction.

Before any page is implemented or materially redesigned, its mockup approval gate must be completed. The approved data and security specifications are defined in [`data.md`](./data.md) and [`security.md`](./security.md).
