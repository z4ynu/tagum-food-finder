# Asa Ta Mangaon?

Tagum Food Finder is a location-aware food-discovery PWA for Tagum City. The application is being prepared for a controlled private beta and is not yet ready for public production use.

## Prerequisites

- Node.js 22 or later
- npm 10 or later

## Local checks

```bash
npm install
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Start the local Next.js compatibility harness with:

```bash
npm run dev
```

## Deployment

Vercel is the approved application host for the private beta. The repository uses the native Next.js build and does not require a hosting adapter or `vercel.json`. Connect the repository in Vercel, keep production deployment approval manual, and configure environment variables in the Vercel dashboard rather than committing them.

`GOOGLE_PLACES_API_KEY` enables on-demand establishment photos through a server-only Google Places proxy. Restrict the key to Places API (New), configure provider quotas and billing alerts, and never use a `NEXT_PUBLIC_` prefix. Without the key, the existing catalog and designed photo fallbacks continue to work.

The Vercel Hobby plan may be used only while the beta qualifies for its personal, noncommercial terms. Review the current plan terms before invitations or monetization.

User-facing page changes still require approved mobile and desktop mockups before implementation.

## Documentation

The repository root is also the Obsidian vault. Product and engineering specifications live in `docs/`; concise work-session notes live in `.vault/sessions/`.
