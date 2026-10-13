# Asa Ta Mangaon?

Tagum Food Finder is a location-aware food-discovery PWA for Tagum City. The repository is currently in Stage 0 validation; it is not yet a production application.

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

The root screen and `/api/health` exist only to exercise Stage 0 platform behavior. User-facing pages require approved mobile and desktop mockups before implementation.

## Documentation

The repository root is also the Obsidian vault. Product and engineering specifications live in `docs/`; concise work-session notes live in `.vault/sessions/`.
