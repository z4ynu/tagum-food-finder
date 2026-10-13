# Asa Ta Mangaon? Stage 0 Validation

## Document control

- Status: Ready to execute
- Date: 2026-10-13
- Scope: Provider, deployment, data, cost, and experience validation before the private-beta MVP
- Inputs: `prd.md`, `architecture.md`, `data.md`, `security.md`, and current official provider documentation

## Purpose

Stage 0 answers the questions that could invalidate the planned product before substantial implementation begins. It does not build the MVP. It produces repeatable evidence for the deployment stack, returned place-data quality, map delivery, authentication, cost posture, and the core location-to-route experience.

The Stage 1 MVP may begin only when every blocking gate in this document has passed or the affected product and architecture decisions have been explicitly revised and approved.

## Current recommendation

Proceed with Stage 0 using the approved Next.js, Cloudflare, Supabase, PostGIS, and MapLibre direction, with these refinements:

1. Treat Cloudflare's `vinext` path as an experimental deployment candidate, not a settled adapter. The official guide currently recommends it for new Next.js applications but labels it beta. Test it against the required feature matrix before selecting it.
2. Use Foursquare Open Source Places and an OpenStreetMap regional extract as the first catalog candidates. Do not make the paid Foursquare Places API a runtime dependency.
3. Test a Tagum or Davao del Norte PMTiles archive on Cloudflare R2 as the preferred long-term basemap path. Keep MapTiler only as a time-boxed evaluation fallback when its terms allow the intended use.
4. Keep Google, Facebook, Apple, and personal-email magic-link sign-in in scope. Schedule Apple last among the identity-provider spikes because it requires Apple developer configuration and a paid membership.
5. Use a dedicated transactional-email provider before inviting external users. Supabase's default sender is development-only.

## Research snapshot

This snapshot records time-sensitive facts checked on 2026-10-13. Recheck them before enabling a paid service or public launch.

### Application hosting

- Cloudflare currently recommends `vinext` for new Next.js applications and describes it as beta.
- Cloudflare documents the OpenNext adapter as the maintenance path for existing applications and recommends migration to `vinext` where possible.
- Workers Free currently allows 100,000 requests per day, 10 ms CPU time per invocation, 128 MB memory, and 50 subrequests per invocation.
- Workers Paid currently starts at USD 5 per month and must not be enabled without owner approval.

Conclusion: Cloudflare remains plausible, but framework-adapter compatibility is a blocking technical spike.

### Database and authentication

- Supabase Free currently includes two free projects, 500 MB database size per project, 50,000 monthly active users, 1 GB storage, 5 GB egress, and 500,000 Edge Function invocations.
- Two projects are enough for the approved staging and production separation during a controlled beta.
- Free projects may be paused for low activity, and downloadable managed backups are not included.
- Supabase supports email magic links and the requested Google, Facebook, and Apple OAuth providers.
- Supabase's default SMTP service is limited to authorized team addresses, currently sends at most two messages per hour, and has no delivery or uptime SLA.
- A custom SMTP provider is therefore required before external beta invitations. Resend's current free tier is a viable candidate at 3,000 emails per month and 100 per day, subject to domain authentication and a delivery test.

Conclusion: Supabase is viable for a controlled beta if external backups, custom SMTP, quotas, and project-pause risk are handled.

### Apple sign-in

- Apple web authentication requires a Services ID associated with a primary Apple-platform App ID.
- The Apple Developer Program currently costs USD 99 per membership year, converted to local currency where available.

Conclusion: Apple sign-in remains an MVP requirement, but its annual membership and configuration are explicit owner-funded launch dependencies. Local development must use a provider-disabled state until the required account is available.

### Place sources

- Foursquare Open Source Places is available as a downloadable Apache 2.0 dataset through its Places Portal and Iceberg catalog.
- Its core schema includes coordinates, address, categories, contact fields, website, social identifiers, and closure information. It does not remove the need to validate returned-record quality or prices, and its completeness in Tagum remains unknown.
- Foursquare's paid Places API should not be assumed free at production scale. Its current pricing gives 500 free Pro calls and then charges USD 15 per 1,000 Pro calls.
- OpenStreetMap data is available under ODbL with attribution and share-alike obligations for derived databases.
- The public Nominatim service forbids systematic POI downloads and autocomplete and limits normal use to one request per second.
- The public OpenStreetMap tile service is best-effort, has no SLA, and forbids bulk or offline downloading.
- Geofabrik publishes a Philippines extract suitable for offline evaluation.

Conclusion: Audit downloadable Foursquare OS Places and OSM extracts. Do not scrape Google Maps, bulk-query public Nominatim, or use public OSM tiles as the production basemap.

### Basemap delivery

- MapLibre GL JS supports PMTiles through the official PMTiles protocol plugin.
- Protomaps documents regional PMTiles extraction and Cloudflare R2 delivery.
- Cloudflare R2 currently includes 10 GB-month storage, one million Class A operations, and ten million Class B operations per month at no charge, with no internet egress fee.
- Protomaps warns that direct R2 requests can exhibit latency above 500 ms, so Tagum-area mobile performance must be measured rather than assumed.
- MapTiler Free is intended for personal, noncommercial, evaluation, and research use. Its current commercial Flex plan starts at USD 30 per month before overage.

Conclusion: Benchmark a small regional PMTiles archive first. MapTiler remains an evaluation fallback, not an assumed public-launch dependency.

### Continuous integration

- GitHub Free currently includes 2,000 Actions minutes per month and 500 MB artifact storage for private repositories; standard runners are free for public repositories.

Conclusion: A bounded validation and MVP pipeline should fit the included allowance. Scheduled data work must track runtime and avoid retaining large artifacts.

## Stage 0A: Deployment feasibility

### Artifact

A minimal, disposable deployment spike containing only the features needed to test the platform. It is not the visual application and is not exempt from later product-quality requirements.

### Test matrix

| Capability | Required evidence | Pass condition |
| --- | --- | --- |
| App Router | Static and server-rendered routes load in local production preview and staging | No adapter-specific runtime errors |
| Route handlers | Typed JSON health route and one authenticated handler | Correct status, headers, and error behavior |
| Supabase browser/server clients | Anonymous read and protected server action | No service-role secret reaches the browser |
| Auth callback | One test OAuth provider plus magic-link callback | Session established and return URL constrained |
| PostGIS | Boundary check and nearest-place query against fixtures | Correct results and indexed query plan |
| PWA | Manifest and service worker delivered in preview/staging | Installability checks pass; update path is controllable |
| Environment isolation | Local and staging use different identifiers and secrets | No production values in source or preview logs |
| Caching | Public catalog response and authenticated response | Public data caches safely; private data is not shared |
| Image handling | One local and one permitted remote image path | Documented behavior without unsupported optimization |
| Error reporting | Scrubbed synthetic client and server failures | Event contains no email, precise location, token, or evidence URL |
| Browser baseline | Android Chrome and iPhone Safari smoke test | Core shell, location prompt, and auth redirect remain usable |

### Adapter decision

Test `vinext` first because it is Cloudflare's current recommendation for new Next.js applications. If any required behavior fails, test the current OpenNext adapter against the same matrix. Select the path with the fewest unsupported behaviors and document its constraints.

Do not preserve two deployment adapters in the application. If neither passes, stop and request approval to change hosting or framework.

### Exit gate

Stage 0A passes when the matrix has evidence for every row, deployment is reproducible from a clean checkout, and the selected adapter is recorded in an architecture decision record.

## Stage 0B: Place-data audit

### Source inputs

1. Foursquare Open Source Places, pinned to a documented release or snapshot when access is available.
2. A Philippines or Mindanao OpenStreetMap extract, clipped locally to the approved Tagum boundary.

Google Maps consumer content must not be copied into the dataset or used as a bulk source.

### Candidate-quality spot check

Select 25 records from the actual candidate catalog. Include a practical mix of:

- approved food-place categories;
- node and area-derived coordinates where present;
- different parts of Tagum where the source provides enough location detail;
- independent businesses and chains when that distinction is evidenced;
- likely duplicate groups and ordinary records.

Review public business evidence only as needed to assess each selected record. This set is a lightweight quality-control check, not an independent sample: it cannot measure how many Tagum places are absent from the source.

### Repeatable harness

The audit command must:

1. ingest pinned source snapshots;
2. clip candidates to the Tagum boundary;
3. normalize names, categories, addresses, coordinates, and source identifiers;
4. propose cross-source matches without silently merging uncertain records;
5. select and record the 25 candidate rows used for manual quality review;
6. emit machine-readable results and a concise Markdown report;
7. avoid storing credentials or redistributing source data beyond its license.

### Metrics and gates

| Metric | Definition | Pass condition |
| --- | --- | --- |
| Coordinate usability | Returned places with coordinates inside or plausibly adjacent to Tagum and accurate enough for a destination marker | At least 95% of returned places |
| Duplicate rate | Distinct candidate rows representing the same real branch after normalization | Below 5% |
| Closed-record rate | Returned places verified permanently closed | Below 5% |
| Category usability | Returned places mapped confidently to an approved top-level category | Reported; blocking if it prevents general food-place discovery |
| Price coverage | Returned places with defensible per-person price evidence | Informational; never impute a verified value |
| License viability | Import, storage, display, attribution, corrections, and refresh are permitted | Required |
| Refresh viability | Repeatable refresh with source version and provenance | Required |
| Cost | Snapshot acquisition, processing, and expected refresh fit the approved ceiling | Required |

Coordinate accuracy must be checked against the actual entrance or building area where lawful reference evidence permits it. A city-centroid or barangay-centroid coordinate is not usable.

### Decision rules

- If combined Foursquare OS Places and OSM pass their quality checks, use both behind source adapters and retain field-level provenance.
- If only one source passes, use it as the initial catalog and document the resulting gaps.
- Do not treat a passing spot check as evidence of complete or percentage-based Tagum coverage.
- Launch the beta with an explicit incomplete-catalog notice and a moderated correction path; reassess the source strategy if users cannot make useful choices.
- Price coverage does not block broad map discovery. It determines how often budget filters can claim a verified match and how much community enrichment is needed.

## Stage 0C: Basemap and experience validation

### Mockup gate

Before implementing the user-facing prototype, generate and present the relevant mobile and desktop mockups. Begin implementation only after the owner explicitly approves them, as required by `AGENTS.md` and `design-system.md`.

### Prototype scenarios

Test on representative Android Chrome and iPhone Safari devices:

1. grant precise location and view nearest places;
2. deny location and select a barangay or map pin;
3. move the map and request results for the visible area;
4. cluster and expand dense markers;
5. open a place and hand off its coordinates to Google Maps;
6. use the Waze handoff when supported;
7. apply budget, craving, and occasion filters;
8. distinguish verified matches, probable matches, and unknown-data fallbacks;
9. lose tile connectivity while retaining usable list discovery;
10. reload the installed PWA and recover from a service-worker update.

### Performance evidence

Capture, under a throttled mobile profile and one real mobile connection:

- initial application payload;
- time to first usable map;
- regional PMTiles request latency and transferred bytes;
- marker rendering at expected Tagum catalog size;
- list response time with and without location;
- GPS acquisition and timeout behavior;
- external-navigation success rate.

No hard performance numbers are invented here. The prototype report establishes the baseline and proposes budgets for approval before Stage 1.

### Exit gate

Stage 0C passes when every scenario has recorded results, no critical journey depends on an unavailable map, precise location is not retained, and the owner approves the experience direction and resulting performance budgets.

## Stage 0D: Identity, email, and cost validation

### Identity sequence

1. Implement and test personal-email magic links with custom SMTP.
2. Implement Google sign-in.
3. Implement Facebook sign-in and record any app-review or business-verification requirement.
4. Implement Apple sign-in after the owner supplies the required enrolled developer account.
5. Verify account linking, provider-email changes, private Apple relay addresses, sign-out, deletion, and reauthentication behavior.

Provider secrets must exist only in password managers and provider configuration. Never place them in the repository, documentation, screenshots, or session notes.

### Cost envelope

Maintain a live monthly forecast with three columns: free allowance, expected beta usage, and paid threshold. Include Cloudflare, Supabase, map delivery, transactional email, monitoring, CI, domain, backups, and place data.

Annual fees such as Apple membership and the domain must be shown separately and as a monthly equivalent. Currency conversion must use the amount charged at purchase time plus a contingency; this document does not fix an exchange rate.

The gate passes only when:

- expected recurring infrastructure remains at or below PHP 3,000 per month;
- automatic overage is disabled or capped wherever possible;
- the owner explicitly approves every paid service and annual fee;
- graceful-degradation behavior exists for exhausted quotas;
- custom SMTP delivery succeeds to representative Gmail, Outlook, and Apple relay addresses.

## Evidence layout

Store Stage 0 materials without committing licensed bulk datasets or personal data:

```text
validation/
  README.md
  fixtures/
  reports/
  scripts/
  snapshots/
```

`snapshots/` contains only small, redistributable fixtures. Large or restricted provider snapshots stay outside Git and are identified by source, version, retrieval date, license, and checksum in the report.

Each report records:

- command and commit used;
- input versions and checksums;
- environment and device details;
- results and failed cases;
- cost or quota consumed;
- decision and owner approval when required.

## Stop conditions

Stop and request a decision if any of these occurs:

- neither supported Cloudflare adapter can run a required feature reliably;
- returned place-data quality misses the PRD gate;
- required source rights do not permit the canonical catalog or public display;
- no compliant basemap path fits the approved ceiling;
- a required identity provider cannot be configured under the owner's available accounts;
- the legal/privacy launch review changes minor access or correction collection materially;
- forecast recurring cost exceeds PHP 3,000 per month.

## Stage 0 completion record

Stage 0 is not complete on the date of this document. Research is complete enough to begin the controlled spikes. The following evidence remains required:

- [ ] Deployment compatibility report
- [ ] Adapter architecture decision record
- [ ] 25-record candidate-quality report
- [ ] Source license and attribution record
- [ ] PMTiles versus eligible hosted-map benchmark
- [ ] Approved experience mockups
- [ ] Real-device experience-prototype report
- [ ] Authentication and SMTP report
- [ ] Owner-approved cost forecast
- [ ] Explicit Stage 1 go/no-go decision

## Official references

- [Cloudflare: Next.js on Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [Cloudflare: OpenNext adapter](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/)
- [Cloudflare: Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare: Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare: R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Supabase: Billing and usage](https://supabase.com/docs/guides/platform/billing-on-supabase)
- [Supabase: Production checklist](https://supabase.com/docs/guides/deployment/going-into-prod)
- [Supabase: Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase: Social login](https://supabase.com/docs/guides/auth/social-login)
- [Apple: Configure Sign in with Apple for the web](https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web/)
- [Apple: Program enrollment](https://developer.apple.com/help/account/membership/program-enrollment/)
- [Foursquare: Access FSQ Open Source Places](https://docs.foursquare.com/data-products/docs/access-fsq-os-places)
- [Foursquare: Places OS data schema](https://docs.foursquare.com/data-products/docs/places-os-data-schema)
- [Foursquare: Places API changes](https://docs.foursquare.com/developer/reference/upcoming-changes)
- [OpenStreetMap: Copyright and license](https://www.openstreetmap.org/copyright)
- [OpenStreetMap Foundation: Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/)
- [OpenStreetMap Foundation: Tile usage policy](https://operations.osmfoundation.org/policies/tiles/)
- [Geofabrik: Philippines extract](https://download.geofabrik.de/asia/philippines.html)
- [Protomaps: Basemap downloads](https://docs.protomaps.com/basemaps/downloads)
- [Protomaps: Cloudflare deployment](https://docs.protomaps.com/deploy/cloudflare)
- [MapLibre: PMTiles example](https://maplibre.org/maplibre-gl-js/docs/examples/pmtiles/)
- [MapTiler: Cloud pricing](https://www.maptiler.com/cloud/pricing/)
- [MapTiler: Cloud terms](https://www.maptiler.com/terms/cloud/)
- [Resend: Pricing](https://resend.com/pricing)
- [GitHub: Included product usage](https://docs.github.com/en/billing/reference/product-usage-included)
