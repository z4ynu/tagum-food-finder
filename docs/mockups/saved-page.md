# Saved page

Status: **APPROVED AND IMPLEMENTED**

The owner approved this direction on 2026-10-14. The responsive `/saved` prototype now follows these mockups.

## Design read

This is a practical personal library for signed-in users, not a dashboard. It should make saved places and reusable wheel lists easy to scan while preserving the approved light Tagum Food Finder identity.

## Design dials

- Design variance: 5/10
- Motion intensity: 3/10
- Visual density: 5/10

## Proposed direction

- Keep the mobile page list-led, with Saved places as the primary view and Wheel lists still discoverable in the same screen.
- Use honest category illustrations instead of stock food photography for real places without verified media.
- Give Directions a clear secondary action without competing with place names.
- Keep removal behind the overflow action and provide an undo state after a place is removed.
- Use the approved four-destination bottom navigation on mobile, with Saved active.
- Use a compact horizontal brand header on desktop. Do not introduce a sidebar.
- Use the wider desktop canvas for an asymmetric Saved places and Wheel lists layout.
- Keep wheel lists private and identify them by name and place count.
- State that saved content syncs to the signed-in account without implying that sync is currently connected in the local prototype.

## Implemented prototype states

- Populated Saved library using clearly identified prototype content
- Empty Saved places with a `Find places` action
- Empty Wheel lists with a `Create a wheel list` action
- Offline access to last available content
- Remove-place action with undo
- Create, rename, and delete wheel-list dialogs
- Signed-out handoff to the Account page

Saved changes currently remain in the browser session. Account-backed persistence, loading skeletons, and recoverable synchronization errors will be added with the hosted Supabase integration rather than simulated as working cloud behavior.

## Mockups

- `saved-mobile.png`
- `saved-desktop.png`

