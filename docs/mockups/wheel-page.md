# Wheel Page Mockup Approval

## Status

`OWNER APPROVED`

## Design read

A playful but trustworthy local decision tool for solo diners, using the approved light Tagum Food Finder visual system without casino or generic game styling.

- Design variance: 6
- Motion intensity: 5
- Visual density: 4

## Proposed direction

- The ready-to-spin state is the first Wheel page shown for approval.
- Every place receives equal visual area and probability.
- The approved greens divide the wheel; lime is reserved for the pointer and eventual outcome highlight.
- The page plainly states that one phone controls the wheel.
- Users can review, remove, reorder, and manually add places before spinning.
- The main action is a single deep-green `Spin the wheel` button.
- Mobile keeps the wheel first and places the editable list below it.
- Desktop uses an asymmetric two-column layout with place setup on the left and the wheel stage on the right.
- The Wheel navigation destination is active in both breakpoint variants.

## Motion intent for implementation

- Application logic chooses the result before animation begins.
- Standard motion uses a bounded rotation with clear deceleration.
- Reduced motion replaces rotation with a short segment-highlight sequence.
- The result state will offer Directions, Remove, and Spin again without opening navigation automatically.

## Mockups

- `wheel-mobile.png`
- `wheel-desktop.png`

The owner approved this direction by asking to continue. The implemented prototype follows this ready-to-spin composition and adds the documented result state.
