# Suggest an update page

Status: **APPROVED AND IMPLEMENTED**

The owner approved this direction on 2026-10-15. The responsive prototype is implemented at `/places/[placeSlug]/suggest-update`, with a development-only signed-in preview query.

## Design read

This is a short, trust-first correction flow for registered users who notice missing or outdated details on a Tagum food place. It should feel easy enough for any diner to complete while making privacy, evidence, and moderation expectations clear.

## Design dials

- Design variance: 4/10
- Motion intensity: 2/10
- Visual density: 5/10

## Proposed direction

- Open from a specific place profile and preserve that place throughout the flow.
- Use four explicit stages: issue type, corrected details, evidence, and review.
- Keep the first screen focused on one decision: what needs updating.
- Treat `Something else` as an entry to additional structured choices such as duplicate place, contact information, and missing photo or menu; it is not an unbounded message box.
- Require an authenticated account while preserving the selected place and issue if sign-in is needed.
- Require evidence for price, hours, menu, closure, and moved-location changes. Evidence remains optional for cuisine, craving, and occasion suggestions.
- Accept only JPEG, PNG, or WebP images, up to 5 MB each and five files per submission, with a required sharing-rights confirmation.
- State that submissions remain private during review and never change public place data automatically.
- Do not promise a public response time or automatic approval.
- Use the existing mobile back-stack pattern and desktop top header. Do not add a desktop sidebar.

## Implemented prototype states

- Authenticated issue selection
- Signed-out handoff that returns to the selected place and issue
- Corrected-detail forms tailored to each supported issue type
- Required and optional evidence states
- Local file validation and removal for JPEG, PNG, and WebP evidence
- Review and rights confirmation
- Offline and validation states
- Honest unavailable-submission state that sends nothing and creates no reference

Secure uploads, persisted drafts, rate limiting, moderation, status tracking, and successful submission references remain backend work. The prototype does not retain selected files or form data after navigation or refresh.

## Mockups

- `suggest-update-mobile.png`
- `suggest-update-desktop.png`

