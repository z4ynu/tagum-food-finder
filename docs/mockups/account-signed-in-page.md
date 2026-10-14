# Signed-in Account page

Status: **APPROVED AND IMPLEMENTED**

The owner approved this direction on 2026-10-15. The responsive prototype is implemented at `/account`, with a development-only signed-in preview at `/account?preview=signed-in`.

## Design read

This is a private account utility for a broad audience that may include minors, not a social profile or public identity page. It should make saved content, update tracking, privacy, and session controls easy to understand while preserving the approved light Tagum Food Finder identity.

## Design dials

- Design variance: 4/10
- Motion intensity: 2/10
- Visual density: 5/10

## Proposed direction

- Show only the minimum useful identity information: verified account email and sign-in provider.
- Do not request or display a profile photo, display name, age, birthday, public activity, contacts, social graph, or location history.
- Summarize Saved places, Wheel lists, and submitted updates without turning the page into a dashboard.
- Keep settings list-led with large targets and clear supporting text.
- Provide separate controls for signing out the current session and all devices.
- Treat data export and account deletion as sensitive workflows that require recent authentication before completion.
- Keep deletion visually separated and require a confirmation flow; the row shown here is only the entry point.
- Use the approved four-destination bottom navigation on mobile, with Account active.
- Use the compact top brand header on desktop. Do not introduce a sidebar.
- Preserve the light visual system, Figtree typography, mascot, and restrained green palette.
- Do not add Apple sign-in, password settings, or a theme selector.

## Implemented prototype states

- Signed-in account summary
- Zero-count authenticated state and clearly labeled populated preview state
- Data export explanation that states the secure export service is not connected
- Current-session sign-out
- All-device sign-out confirmation and completion
- Account deletion explanation that states secure deletion is not connected and performs no deletion
- Offline messaging for actions that require connectivity
- Provider or session error with a clear recovery action
- Signed-out fallback to the existing sign-in experience

Real authenticated identity and sign-out use the configured Supabase client. Cloud-backed activity counts, submitted-update history, export processing, and account deletion remain future backend work and are not simulated as successful actions.

## Mockups

- `account-signed-in-mobile.png`
- `account-signed-in-desktop.png`

