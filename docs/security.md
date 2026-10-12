# Security and Privacy

## Document control

- Status: Discovery
- Last updated: 2026-10-12
- Security review: Not started

## Security objectives

- Protect administrative and moderation capabilities from unauthorized access.
- Prevent users from reading or modifying data outside their permissions.
- Keep privileged credentials and service-role access off the client.
- Protect public forms and community features from spam, abuse, and malicious content.
- Minimize personal-data collection and document every approved use.
- Keep published business information trustworthy and changes auditable.

## Baseline controls

- Treat all client code and `PUBLIC_*` configuration as public.
- Store secrets only in provider-managed environment settings.
- Require row-level security for browser-accessible Supabase data.
- Use server-side privileged operations for moderation, administration, and protected storage actions.
- Validate and normalize all untrusted input on trusted boundaries.
- Avoid rendering unescaped user-controlled HTML.
- Validate external URLs and uploaded file types.
- Apply least privilege to database roles, storage buckets, API keys, and team access.
- Keep separate development and production credentials.
- Do not log secrets or unnecessary personal data.

## Threat areas to design

| Area | Questions requiring decisions |
| --- | --- |
| Authentication | Login methods, session lifetime, recovery, account deletion, and reauthentication |
| Authorization | Public, user, contributor, moderator, business owner, and administrator roles |
| Administration | MFA, invitation process, audit logging, and emergency access |
| Community content | Spam controls, rate limits, reporting, appeals, and repeat-abuse handling |
| Business claims | Proof of ownership, transfer, revocation, and staff access |
| Uploads | Allowed types, size limits, malware risk, metadata stripping, and moderation |
| Location | Whether precise user location is requested, retained, or processed only in-browser |
| Analytics | Events collected, retention, consent requirements, and third-party sharing |
| Notifications | Email or push consent, unsubscribe, rate limiting, and provider access |
| APIs | Abuse limits, enumeration resistance, cache policy, and error disclosure |

## Proposed privacy posture

- Anonymous browsing by default
- No precise location retention unless an approved feature requires it
- No advertising trackers by default
- No analytics provider or tracking policy has been selected
- Explicit consent before optional notifications
- Self-service account and content deletion if user accounts are introduced

These positions require confirmation and legal review appropriate to the launch jurisdiction and actual data practices.

## Operational security decisions

| ID | Decision | Status |
| --- | --- | --- |
| SEC-001 | Account and authentication model | Open |
| SEC-002 | Authorization roles and permissions | Open |
| SEC-003 | Admin MFA and access lifecycle | Open |
| SEC-004 | Rate limiting and anti-automation | Open |
| SEC-005 | Upload validation and moderation | Open |
| SEC-006 | Location-data handling | Open |
| SEC-007 | Analytics, cookies, and consent | Open |
| SEC-008 | Retention and deletion | Open |
| SEC-009 | Backups and recovery | Open |
| SEC-010 | Incident response and vulnerability reporting | Open |

## Release gate

Before production launch, the project must document the implemented authorization model, verify row-level policies, test account and admin abuse cases, review dependencies, confirm backup and recovery procedures, and record privacy, accessibility, SEO, and mobile-impact findings.
