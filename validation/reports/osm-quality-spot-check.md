# OSM Candidate Quality Spot Check

## Decision

**PASS for MVP implementation with unknown-data safeguards.**

The checksummed OpenStreetMap extract provides a lawful, refreshable baseline of 176 unique named food-place candidates inside the approved Tagum boundary. The selected records pass the structural coordinate, category, and duplicate checks required to begin catalog engineering.

This decision does not assert complete Tagum coverage or prove that every candidate is still operating. Imported records must begin as unverified, opening status must remain unknown unless supported by accepted evidence, and the beta must provide a visible correction path.

## Reproducibility

- Review date: 2026-10-14
- Implementation commit: `5314b80`
- Runtime: Node.js 22 on Windows
- Source version: `geofabrik-philippines-2026-10-12T23:01:00Z`
- Source MD5: `d12ded513809afc929b74573c2c28f57`
- Extract SHA-256: `80c8994a5074ed14a2b9e533e6949535873996ff0e8352431b42ecc5b96f46f5`
- Boundary: OSM relation `15986415`, version 8
- Boundary SHA-256: `6b4633950b60c7402d0e8373354eb2df34ffe7e460464e934800f304543e2af0`
- Provider/API cost consumed: none

Command:

```powershell
npm run audit:osm -- validation/snapshots/osm-tagum-food-places.geojsonseq validation/snapshots/osm-tagum-food-places.manifest.json validation/fixtures/tagum-boundary-osm-15986415-v8.json validation/reports/generated
```

The command writes the aggregate inventory and the record-level review worksheet to the ignored `validation/reports/generated/` directory. Raw provider rows are not committed.

## Selection

The deterministic selector chose exactly 25 unique candidates from the actual in-boundary inventory. It prioritizes:

- category variety, including every source category that requires manual review;
- source-point and polygon-representative coordinate methods;
- north, south, east, and west geographic extremes;
- a complete suspected-duplicate pair when one exists;
- stable source-identity order for the remaining slots.

After source-identity deduplication, the inventory contained no exact-name candidate pair within 75 metres, so no suspected duplicate pair was available for selection. The selected set contained 23 source points, two polygon representatives, six canonical categories, and both review-required confectionery records.

## Results

| Check | Result | Gate |
| --- | --- | --- |
| Review size | 25 unique candidates | Pass: exactly 25 |
| Structural coordinate usability | 25 of 25 inside the approved boundary; 23 source points and 2 polygon representatives | Pass: 100% |
| Category usability | 23 direct food categories; Tagum Pie and Jean Cakes & Pastries manually confirmed as food businesses | Pass: 100% |
| Candidate duplicates | 0 of 25 after identical source IDs were collapsed | Pass: 0% |
| Full-inventory duplicate signal | 0 groups among 176 unique candidates under the exact-name/75-metre heuristic | Pass |
| Confirmed permanently closed | 0 of 25 | Pass numerically; lifecycle confidence remains limited |
| Recent public corroboration | 7 of 25 | Informational |
| Lifecycle unknown or conflicting | 18 of 25 | Must remain visibly unknown |
| Defensible per-person price evidence | 0 of 25 under the approved evidence standard | Informational; never impute |
| License | ODbL attribution and share-alike handling previously accepted by the owner | Pass |
| Refresh | Checksummed, pinned, repeatable local extraction | Pass |
| Acquisition cost | No recurring source or API fee for the tested extraction | Pass |

The coordinate result proves that the records can produce stable destination markers and are inside the city boundary. Independent current-location corroboration was available only for a minority of the selected places, so the result must not be presented as entrance-level verification.

## Public-evidence review

Recent public evidence corroborated the existence or location of seven selected candidates:

- Tagum Pie: a 2026 neighboring-business page identifies it on Arellano Street ([source](https://www.beautynailhairsalons.com/PH/Tagum-City/135834149616790/De-Stress-Massage-%26-Spa-Arellano-Tagum-Branch)).
- Big Fat Tummy: a 2025 business profile identifies the Tagum restaurant near Robinsons Place ([source](https://edgedavao.net/entrepreneurs/2025/04/game-changer-kristoffer-u-tan-from-nurse-to-restaurateur/)).
- Chowking: the official Gaisano mall directory lists a Tagum branch ([source](https://gaisanomalls.com/mall-directory/)).
- Pizzakaya: a 2026 listing identifies the Trade Center branch on Quezon Street and contains recent activity ([source](https://restaurantguru.com/Pizzakaya-Tagum-City)).
- Pizza Treat: a neighboring Trade Center business published its location beside Pizza Treat in 2026 ([source](https://www.evepla.com/PH/Tagum-City/1860194667556547/Christine-Party-Needs-Shop)).
- Sarah's Delicious Mami: a 2026 listing reports recent activity and a matching central Tagum location ([source](https://restaurantguru.com/Sarahs-Delicious-Mami-Tagum-City)).
- The Turq Cafe: a 2026 local discussion identifies the cafe near the new city hall ([source](https://www.reddit.com/r/tagum/comments/1u0ydin/need_your_opinion/)).

The Palm City Food Park produced conflicting public signals: one current directory marks it closed, while another recently updated listing still describes it as operating ([closed signal](https://www.bizippines.com/the-palm-city-food-park), [operating signal](https://restaurantguru.com/amp/The-Palm-City-Food-Park-Tagum-City)). It remains lifecycle-unknown pending direct evidence.

The remaining candidates had only old, source-derived, ambiguous, or insufficient public evidence. Absence of search evidence was not interpreted as closure.

## Required product safeguards

1. Import the OSM candidates as unverified records with field-level source provenance.
2. Do not show `Open now`, verified opening hours, dietary claims, or a verified price tier without accepted evidence.
3. Show an explicit freshness/unknown-data treatment on place profiles and results.
4. Let signed-in users submit missing details, closure reports, price ranges, and evidence for moderation.
5. Keep budget filtering honest: unknown-price places may appear only as labeled fallbacks, never as strict matches.
6. Re-run the pinned extraction and duplicate checks on every catalog refresh.
7. Treat Foursquare as optional enrichment; it is not required to begin the OSM-backed MVP.

## Remaining Stage 0B work

- Create the source-rights and attribution record used by the production UI and database export.
- Define the initial import-to-staging publication contract.
- Carry the 176-record baseline into the Stage 0C prototype only after its mobile and desktop mockups are approved.

