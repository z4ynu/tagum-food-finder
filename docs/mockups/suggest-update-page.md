# Suggest an update page

Status: **AWAITING OWNER APPROVAL**

No Suggest an update UI implementation should begin until the owner explicitly approves these mockups or requests revisions.

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

## Planned implementation states

- Authenticated issue selection
- Signed-out handoff that returns to the selected place and issue
- Corrected-detail forms tailored to each supported issue type
- Required and optional evidence states
- Upload validation, progress, retry, and removal
- Review and rights confirmation
- Submission success with a private reference
- Offline, validation, rate-limit, and server-error states
- Abandoned drafts kept privately for up to 30 days when backend persistence is available

## Mockups

- `suggest-update-mobile.png`
- `suggest-update-desktop.png`

