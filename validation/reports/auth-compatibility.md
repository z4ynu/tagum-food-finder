# Stage 0A Authentication Compatibility

## Status

Partial pass. The framework boundaries compile and the unauthenticated callback response is verified locally. A real session exchange has not been run because no disposable hosted Supabase project or OAuth/email provider is configured.

## Implemented compatibility surface

- `GET /auth/callback` accepts only a one-time `code` parameter.
- The code is passed directly to Supabase's server-side `exchangeCodeForSession` method and is never logged or included in a response.
- Missing, rejected, and exceptional exchanges use the same generic `invalid_auth_callback` response.
- Callback responses are marked `private, no-store` and include `Pragma: no-cache`.
- A successful exchange redirects only to `/` on the exact validated `APP_ORIGIN`; request-controlled return destinations are not accepted.
- The application origin must be HTTPS, except for an HTTP localhost origin, and cannot include credentials, a path, a query, or a fragment.
- The protected compatibility action calls Supabase's trusted `getUser()` lookup and rejects missing or failed authentication before returning success.

## Evidence

| Check | Result |
| --- | --- |
| Unit contract | Pass: 30 repository tests, including callback, trusted-user, and origin-validation cases |
| Next.js production compilation | Pass: `/auth/callback` emitted as a dynamic route |
| Cloudflare adapter compilation | Pass: `/auth/callback` emitted as a Worker route |
| Missing-code HTTP response | Pass: HTTP 400 with generic JSON, `private, no-store`, and `no-cache` headers |
| Server action static boundary | Pass: typed and compiled by the repository checks |
| Server action transport | Not tested: no approved page may invoke the action yet |
| OAuth provider exchange | Not tested: provider and disposable project are not configured |
| Magic-link exchange | Not tested: custom SMTP and disposable project are not configured |
| Session cookie lifecycle | Not tested: requires a real successful exchange |

## Remaining exit work

The Stage 0 authentication gate remains open until a disposable non-production environment verifies:

1. one OAuth provider and one personal-email magic link;
2. successful session-cookie establishment and refresh;
3. expired, replayed, malformed, and provider-denied callbacks;
4. exact callback allowlists for the selected environment;
5. server-action transport from an approved UI;
6. sign-out and cross-environment isolation.
