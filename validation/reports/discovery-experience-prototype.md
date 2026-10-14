# Stage 0C Discovery Experience Prototype

## Status

Partial pass. The owner-approved discovery page is implemented and verified in desktop and mobile browser viewports. The prototype is ready for owner review, but the Stage 0C gate remains open until live GPS is exercised on real devices and the production map delivery approach is selected.

## Approved direction

- Map-first experience with a mobile results sheet and a 40/60 results-to-map desktop split.
- Figtree typography and the approved green design tokens.
- Light canvas and white/sage surfaces are the controlling visual treatment; the public page does not switch to dark presentation from the device preference.
- Nearest-first discovery with search, budget, craving, and occasion filters.
- Honest treatment of incomplete source data: supported matches and nearby places with unknown details are shown separately.
- External navigation handoff to Google Maps or Waze instead of an in-app routing engine.
- Account, saved-place, and wheel destinations remain disabled until their own approved phases.

The visual reference and approval record are in `docs/mockups/discovery-page.md`.

## Implemented prototype surface

- Responsive desktop navigation rail and mobile bottom navigation.
- First-run location explanation, browser geolocation request, and Tagum City center fallback.
- In-memory location use only; the prototype does not persist precise coordinates.
- Approved OSM audit records rendered as nearest-first list and map markers.
- Map/list selection synchronization, marker clustering, and return-to-location control.
- Search and evidence-aware budget, craving, and occasion filters.
- Explicit catalog incompleteness, price-unavailable, offline, and map-failure states.
- Google Maps and Waze destination links generated from coordinates.
- Keyboard-accessible controls, visible focus states, semantic regions, and reduced-motion handling.

## Browser verification

| Check | Result |
| --- | --- |
| Desktop layout at 1280 × 720 | Pass: results panel, navigation rail, map, controls, and attribution rendered without overlap |
| Mobile layout at 390 × 844 | Pass: map-first composition, results sheet, search, location row, selected card, and bottom navigation rendered correctly |
| Manual location fallback | Pass: selecting Tagum City center closes the first-run dialog and updates the location state |
| Filter behavior | Pass: the Pizza filter returned two source-supported matches and three nearby records with insufficient evidence in a separate group |
| Map/list synchronization | Pass: the selected nearest record is marked in both surfaces |
| Live street basemap | Pass for prototype: OpenFreeMap Positron tiles loaded with visible attribution |
| Map worker delivery | Pass: MapLibre worker loads from the same origin at `/maplibre-gl-worker.mjs` |
| Precise browser location | Not exercised: requires an owner-approved browser permission interaction and real-device validation |
| External navigation launch | Not exercised: destination URLs are unit tested; browser QA did not open third-party navigation sites |

The owner then supplied the light mobile reference again and requested direct implementation rather than retaining the dark system-theme rendering. The revised implementation was visually rechecked at 390 × 844 and 1280 × 720. It now matches the reference's overlay brand and search, white mobile sheet, light desktop rail and results panel, green action hierarchy, and pale-green selection states. Listing media remains an explicit `No photo` placeholder until lawful media exists.

## Temporary map-source decision

The prototype uses OpenFreeMap's public Positron style so the approved experience can be evaluated against a real street basemap without adding a credential. This is an evaluation dependency, not a production-provider decision. OpenFreeMap currently states that its public instance is free and does not require an API key, but it provides no service-level agreement.

Production approval still requires the planned comparison of self-hosted PMTiles and suitable managed providers for reliability, regional performance, attribution, caching, offline behavior, operating cost, and terms. The app preserves visible `OpenFreeMap © OpenMapTiles Data from OpenStreetMap` attribution for the current source.

## Known limitations

- The nine-place catalog is a bounded prototype fixture from the approved OSM audit, not full Tagum coverage.
- Price, cuisine, occasion, hours, lifecycle, and accessibility evidence are incomplete by design.
- No listing images are shown because the current source set does not supply approved reusable media.
- Dark mode uses the same light basemap under a restrained application overlay; a production dark style remains a provider decision.
- The current dependency audit still reports four moderate and six high advisories in the existing experimental vinext adapter chain. No forced major downgrade was accepted.

## Remaining Stage 0C work

1. Exercise allow, deny, unavailable, timeout, and changed-permission geolocation paths on Android Chrome and iPhone Safari.
2. Validate sheet gestures, safe areas, focus order, screen-reader labels, reduced motion, and external navigation on physical devices.
3. Simulate tile and network failure in browser QA and confirm the list remains fully useful.
4. Measure cold-load, interaction, and map-render performance on representative mobile hardware.
5. Benchmark and select the production map delivery approach before replacing the temporary source.
6. Expand catalog evidence only through the approved staging-import and review workflow.

## Current decision

`READY FOR OWNER PROTOTYPE REVIEW`.

The Discovery page is suitable for reviewing the interaction direction. This report does not close Stage 0C or authorize a production map provider.

## References

- [MapLibre GL JS documentation](https://maplibre.org/maplibre-gl-js/docs/)
- [OpenFreeMap quick start](https://openfreemap.org/quick_start/)
- [OpenFreeMap service information](https://openfreemap.org/)
