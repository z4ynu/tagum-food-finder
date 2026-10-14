# Discovery Page Mockup Approval

## Status

Approved by the product owner on 2026-10-14.

The owner clarified after reviewing the functional prototype that the final visual direction must use the light reference treatment rather than following the device's dark color scheme. The supplied [light mobile implementation reference](./discovery-mobile-light-reference.png) is the controlling reference for color, surface, and mobile composition.

The approved direction covers the first public discovery page at mobile and desktop breakpoints:

- [Mobile discovery mockup](./discovery-mobile.png)
- [Desktop discovery mockup](./discovery-desktop.png)

## Direction locked for the prototype

- Mobile uses an edge-to-edge map with a compact search region, accessible results sheet, and four-item bottom navigation.
- Desktop uses a compact navigation rail, persistent results panel, and approximately 40/60 list-map split.
- Public discovery defaults to the light canvas shown in the approved references. Dark surfaces are not the default product presentation.
- The page uses the approved Figtree typography, green palette, radius rules, and Phosphor icon direction.
- Selected map markers and result rows are synchronized through shape, border, and label treatment rather than color alone.
- Unknown price or place details remain explicit and do not appear as negative matches.
- OpenStreetMap attribution remains visible at every supported layout.
- The map is supplemental; the ordered list remains the complete operable discovery interface.

## Prototype caveats

The generated street geometry, sample distances, food images, and selected-place state are illustrative design content. They are not approved production data or a cartographically accurate Tagum basemap. Prototype implementation must use synthetic or approved audit data and an approved evaluation tile source. Generated food images must not be presented as photos of real businesses; an honest no-photo treatment is used until licensed media exists.

Material visual changes require a revised mockup and another owner approval before implementation.
