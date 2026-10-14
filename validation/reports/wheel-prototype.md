# Wheel Prototype

## Status

Pass for owner prototype review. The owner-approved anonymous Wheel page is implemented and connected to primary navigation and Place Profiles.

## Implemented surface

- Responsive ready-to-spin layout based on the approved mobile and desktop mockups.
- Five useful initial Tagum choices with manual add, remove, and accessible reorder controls.
- Equal-probability selection using rejection sampling over browser-generated unsigned random values.
- The application selects the result before the visual rotation begins.
- Bounded rotation with clear deceleration and a short reduced-motion fallback.
- Result state with Directions, Remove, and Spin again actions.
- Device-local anonymous persistence with no account or server transmission.
- Place Profile handoff through `Add to wheel` without creating duplicates.
- Empty, one-entry, 50-entry limit, and custom-place direction-search behavior.

## Verification

| Check | Result |
| --- | --- |
| Production build | Pass: `/wheel` is statically generated |
| Automated tests | Pass: 21 files and 92 tests, including unbiased-tail rejection and rotation alignment |
| Type checking | Pass |
| Lint and format checks | Pass |
| Mobile layout at 390 × 844 | Pass: wheel-first composition, result actions, editable list, and bottom navigation remain usable |
| Desktop layout at 1280 × 720 | Pass: setup panel, wheel, primary action, and result state fit without overlap |
| Manual add, reorder, and remove | Pass in browser QA |
| Persistence after reload | Pass in browser QA |
| Place Profile handoff | Pass: the canonical place is present without duplication |
| Browser console | Pass: no warnings or errors during responsive QA |

## Intentional limitations

- Anonymous wheel state stays in local storage and does not sync between devices.
- Saving named wheel lists remains unavailable until accounts and private cloud storage are implemented.
- Current filtered Discovery results cannot yet be added as a batch.
- Custom free-text entries use a Google Maps search rather than trusted catalog coordinates.
- Physical-device reduced-motion and installed-PWA persistence still require device validation.

## Current decision

`READY FOR OWNER PROTOTYPE REVIEW`.

The Wheel is ready to evaluate before the next page enters mockup approval.
