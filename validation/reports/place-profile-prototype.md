# Place Profile Prototype

## Status

Pass for owner prototype review. The approved light Place Profile is implemented for every record in the bounded prototype catalog and is linked from the selected Discovery result.

## Implemented surface

- Stable, URL-safe profile paths derived from the place name and source identifier.
- Static profile generation and place-specific page metadata for the nine prototype records.
- Responsive mobile and desktop layouts matching the approved mockups in `docs/mockups/place-profile.md`.
- Explicit no-photo, unconfirmed-price, unconfirmed-hours, and unverified-dietary states.
- Address, compact live map, visible source attribution, and same-origin map worker delivery.
- Expandable Google Maps and Waze destination choices.
- Native-share support with a clipboard fallback.
- Disabled Save, Add to wheel, and Suggest an update controls with phase explanations.
- Discovery-to-profile and profile-to-Discovery navigation.

## Verification

| Check | Result |
| --- | --- |
| Production build | Pass: all nine profile paths were statically generated |
| Automated tests | Pass: 20 files and 88 tests, including slug stability, uniqueness, and lookup |
| Type checking | Pass |
| Lint and format checks | Pass |
| Mobile layout at 390 × 844 | Pass: single-column profile, honest evidence labels, and sticky directions action |
| Desktop layout at 1280 × 720 | Pass: navigation rail, content column, location card, map, and actions render without overlap |
| Live basemap | Pass: OpenFreeMap tiles and attribution rendered |
| Directions disclosure | Pass: Google Maps and Waze choices expand without leaving the page |
| Browser console | Pass: no warnings or errors during responsive QA |

## Intentional limitations

- Distance is labeled from Tagum City center because the Discovery location is not persisted across routes yet.
- Save, wheel, account, and community-update workflows remain unavailable until their approved phases.
- No listing images are displayed because no approved reusable media source is connected.
- Place information remains limited to the reviewed prototype fixture and must not be interpreted as complete or current business data.
- External navigation destinations are unit-tested but were not opened during browser QA.
- Physical-device geolocation, safe-area, and assistive-technology checks remain part of the wider Stage 0C validation gate.

## Current decision

`READY FOR OWNER PROTOTYPE REVIEW`.

The profile surface is ready to evaluate before the next page enters mockup approval.
