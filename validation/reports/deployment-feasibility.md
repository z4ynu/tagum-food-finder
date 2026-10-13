# Stage 0A Deployment Feasibility

## Run control

- Status: In progress
- Date: 2026-10-13
- Commit tested before vinext initialization: `70b50ec`
- Host: Windows, Node.js 22.18.0, npm 10.9.3
- Next.js: 16.4.0
- Vinext: 1.1.0
- Vite: 8.3.0
- Cloudflare Vite plugin: 2.0.0 beta build pinned in `package-lock.json`

## Scope of this increment

This increment checks whether the current Cloudflare-recommended `vinext` adapter can compile and serve the minimal Stage 0 Next.js harness. It does not approve the adapter for production and does not cover Supabase, authentication callbacks, PostGIS, PWA behavior, image optimization, persistent caching, Sentry, or real-device browsers.

## Configuration decision

The spike uses:

- Cloudflare as the vinext platform;
- no persistent CDN cache;
- no persistent data cache;
- no Cloudflare Images optimization.

Vinext's own guidance recommends no persistent cache during an initial migration. This keeps the first result attributable to the runtime adapter and avoids provisioning R2, KV, Durable Objects, a second Worker, or a paid image service before the relevant cache and image tests exist. These are spike settings, not the final production architecture.

## Results

| Check | Result | Evidence |
| --- | --- | --- |
| Vinext compatibility scan | Partial pass | 92% compatible: five supported checks, one partial, zero issues |
| App Router discovery | Pass | `src/app`, one page, one layout, and one route handler detected |
| `poweredByHeader` behavior | Pass | Preview root response had no `X-Powered-By` header |
| App Router strict mode | Informational limitation | Vinext does not wrap App Router in `React.StrictMode`; Next.js defaults App Router strict mode on |
| Cloudflare build | Pass with warnings | Five build phases completed and emitted Cloudflare Build Output |
| Root route | Pass | Local Worker preview returned HTTP 200 |
| Dynamic health route | Pass | `/api/health` returned HTTP 200 and the expected stable JSON payload |
| Private response caching | Pass for tested handler | Health response returned `no-store`, `private`, and revalidation-prevention directives |
| Framework header suppression | Pass | No `X-Powered-By` header on the root response |
| PWA delivery | Partial pass | Manifest and root-scoped service worker returned HTTP 200 with correct content types; browser lifecycle and final icon approval remain pending |
| Environment identity | Partial pass | Local and hosted project-reference assertions pass unit tests; independent staging and production deployments remain pending |
| Error scrubbing | Partial pass | Structured allowlist redacts tested tokens, email addresses, URLs, and precise coordinates; Sentry transport is not configured |
| Standard Next.js build | Pass | Next.js production build completed before adapter initialization |
| Dependency audit before vinext | Pass | Zero known vulnerabilities |
| Dependency audit after vinext | Blocked | Six high and four moderate advisories in vinext transitive dependencies |

## Build observations

- The first sandboxed build failed because Cloudflare's type generator could not open a local Miniflare port. The same command completed when local runtime access was allowed. This is an execution-environment restriction, not an application failure.
- The build printed ineffective dynamic-import warnings for vinext internals and the root layout. It still completed.
- The build attempted to contact Docker Desktop and reported that its Linux-engine pipe was unavailable, then completed. Docker is not currently a prerequisite for the tested path, but the unexpected probe should be tracked.
- Vinext classified the health route as dynamic and could not statically classify the root route. The product must not rely on uncertain automatic caching for authenticated or location-sensitive responses.
- Next.js and vinext both generate files under `.next/types`. Running a broad standalone TypeScript check after a vinext build loaded a stale Next.js validator against vinext's different route declarations. The project excludes generator-internal `.next` files from standalone `tsc`; `next build` and `vite build` remain the authoritative framework-specific route checks, while `next-env.d.ts` imports the active generated route declarations needed by source code.

## Dependency risk record

Installing vinext 1.1.0 introduced the following current advisory paths:

- high-severity stack-exhaustion advisory through `vite-plugin-commonjs` to `fast-glob`, `micromatch`, and `braces`;
- moderate infinite-loop advisory through `@vercel/og`, `satori`, and `fflate`;
- aggregate advisories reported against `vinext` and `@vinext/cloudflare` because of those paths.

Npm currently offers only a semver-major downgrade to vinext 0.2.1 as an automatic fix. That is not accepted without compatibility evidence and may not support the tested Next.js stack.

Temporary compensating controls:

- the adapter remains a Stage 0 spike and is not deployed to staging or production;
- builds consume only repository-controlled route and glob inputs;
- no user, provider, or production data enters the harness;
- production approval remains blocked while high-severity advisories are unresolved or lack an owner-approved security exception;
- dependency audit is rerun before each adapter decision.

Risk owner: project owner. Review deadline: 2026-10-27, matching the fourteen-day high-severity response target in `security.md`. The acceptable resolution is an upstream fixed release, a verified safe replacement, removal of the affected adapter, or a documented owner-approved exception with a shorter re-review interval.

## Remaining Stage 0A matrix

- [x] App Router behavior
- [x] Route handler behavior
- [ ] Server action behavior
- [ ] Supabase browser/server boundaries (typed factories and public-secret guards added; live project test pending)
- [ ] Authentication callback behavior
- [ ] PostGIS boundary and nearest-place query (migration and pgTAP contract prepared; execution awaits a Docker-compatible local stack)
- [ ] PWA manifest, service worker, and update behavior (HTTP delivery passed; browser registration, update, and approved icons pending)
- [ ] Local/staging secret and environment isolation (runtime identity and project-match assertions added; separate deployed projects pending)
- [ ] Public catalog cache behavior
- [x] Tested private route does not enter shared cache
- [ ] Image handling
- [ ] Scrubbed client and server error reporting (structured scrubber and tests added; Sentry transport test pending)
- [ ] Android Chrome smoke test
- [ ] iPhone Safari smoke test
- [ ] Reproducible staging deployment

## Current decision

`CONDITIONAL CONTINUE` for Stage 0A only.

Vinext is technically viable enough to continue isolated compatibility work, but it is not approved as the production adapter. The unresolved high-severity build dependency chain is a blocking item for the final adapter decision. No Cloudflare deployment is authorized by this report.

## Commands used

```text
npx vinext check
npx vinext init --platform=cloudflare --cdn-cache=none --data-cache=none --image-optimization=none
npm run build:vinext
npm run start:vinext -- --host 127.0.0.1 --port 4173
```

The preview was queried at `/` and `/api/health`, then stopped after the responses were recorded.

## References

- [Cloudflare: Next.js on Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [Vinext: Deploy to Cloudflare Workers](https://vinext.dev/docs/deploying/cloudflare)
- [Vinext: Caching on Cloudflare](https://vinext.dev/docs/guides/caching)
