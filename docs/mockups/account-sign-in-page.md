# Account sign-in page

Status: **AWAITING OWNER APPROVAL**

No Account page UI implementation should begin until the owner explicitly approves these mockups or requests revisions.

## Design read

This screen is a focused, trust-first entry point for a broad audience that may include minors. It should feel like part of the food finder rather than a social profile or marketing page. The approved light visual system remains unchanged: Figtree, white and pale-sage surfaces, green actions, dark readable text, restrained decoration, and familiar product controls.

## Design dials

- Design variance: 5/10
- Motion intensity: 3/10
- Visual density: 4/10

## Proposed direction

- Lead with the practical value of an account: saved places, saved wheel lists, and tracked updates.
- Make personal-email magic-link authentication the primary action.
- Give Google, Facebook, and Apple equal secondary treatment so no provider appears required or preferred.
- Do not ask for a password, age, birth date, profile photo, location history, contacts, or social permissions.
- Explain that choosing a different sign-in method may create a separate account.
- State that location and discovery history are not linked to the account.
- Keep privacy and terms links available without letting legal copy overwhelm the main task.
- Return the user to their original safe context after successful authentication.

## Planned implementation states

- Initial form
- Invalid or missing email
- Magic-link request in progress
- Check-your-email confirmation
- Provider authentication in progress
- Recoverable provider or magic-link error
- Offline or temporarily unavailable
- Signed-in account summary and sign-out controls as a later approved state

## Mockups

- `account-sign-in-mobile.png`
- `account-sign-in-desktop.png`

