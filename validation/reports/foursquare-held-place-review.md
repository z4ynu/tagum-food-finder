# Foursquare-backed held-place review

## Decision

The 19 Overture records with retained Foursquare identifiers must not be published as one group. After local operator review, the recommendations are seven new-place approvals, five rejections, five link-or-update investigations against existing public places, and two continued holds.

The review itself did not change production. The Foursquare Places API was unavailable, so decisions use the checksummed Overture record, the active catalog, current public corroboration, and local operator confirmations supplied on 2026-10-17. Provider IDs remain private. The finalized approve and reject decisions were subsequently applied through the audited production workflow described below.

## Review method

- Compare candidate name, category, coordinates, and address with the active 291-place release.
- Find the nearest active place and every active exact-name place.
- Reject records whose stated locality conflicts materially with their Tagum coordinates.
- Avoid publishing a chain outlet when an existing same-name record could represent the same branch.
- Require current outlet-level evidence before approving a new place.
- Treat local operator confirmations as moderation evidence while preserving their provenance separately from provider or first-party evidence.

## Recommendations

| Candidate | Recommendation | Reason |
| --- | --- | --- |
| Blugré Coffee | Approve new with correction | The local operator confirms that Blugré Coffee is an establishment inside Weekly Market. Publish it as the Weekly Market outlet rather than retaining the conflicting Nicole's 22nd Strip identity. |
| Chowking — Malaybalay address | Reject | The source address says Malaybalay, Bukidnon while the coordinates are inside Tagum. |
| Chowking — Tagum City | Link or update | The local operator confirms that Tagum has two Chowking branches, and two Chowking places are already public. Reconcile the branchless candidate with those records instead of creating a third place. |
| Dunkin' — Gaisano Mall of Tagum | Approve new | The local operator confirms the active GMall Tagum outlet. |
| Dunkin' — Gaisano Grand of Tagum | Approve new | The local operator confirms the active Gaisano outlet. A separate Robinsons outlet is also reported but is not represented by this candidate and requires its own source record. |
| Fruitas | Hold | No branch address or current outlet-level evidence is present. |
| Gerry's Grill — Robinsons Place Tagum | Link or update | The local operator and Gerry's official locator confirm the Robinsons branch. The public catalog already contains a same-name Robinsons Place record, so reconcile coordinates rather than create a duplicate. |
| Goodyear Kitchenette | Hold | The local address is plausible but no sufficiently reliable current public source was found. |
| Jollibee — Valencia City address | Reject | The source address says Valencia City, Bukidnon while the coordinates are inside Tagum. |
| Jollibee — Robinsons | Link or update | The local operator and Jollibee's official locator confirm the Robinsons branch, and a public Jollibee record already exists near the mall. |
| Jollibee — Gaisano Mall of Tagum | Link or update | The local operator confirms a Gaisano branch and Jollibee's official locator confirms Tagum mall outlets. Five same-name places are already public, so reconcile branch identity and coordinates. |
| KFC — Gaisano Mall of Tagum | Reject as closed | The local operator confirms that the Gaisano outlet is no longer operating. A newer KFC near St. Mary's College is outside this candidate and requires a separate verified source record. |
| Mang Inasal — Central Warehouse | Reject as closed | The local operator confirms that the Central Warehouse outlet is no longer operating. Downtown and CityMall outlets remain active and should be reconciled with the three public same-name records. |
| McDonald's — Tagum City | Link or update | The local operator confirms three current McDonald's branches, matching the three public records. The branchless candidate should be reconciled, not created as a fourth place. |
| Pizza Hut — SM City Davao address | Reject | The source address says SM City Davao while the coordinates are inside Tagum. |
| Potato Corner — Robinsons Place Tagum | Approve new | Potato Corner's current official campaign store list includes `Robinsons Place Tagum- G/F`, and no Potato Corner place is public. The candidate address identifies that outlet. |
| Red Ribbon — Gaisano Mall of Tagum | Approve new | The local operator confirms the active Gaisano Mall outlet. |
| Red Ribbon — Gaisano Grand Tagum | Approve new | The local operator confirms the active Gaisano Grand outlet. |
| Waffle Time — NCCC Mall of Tagum | Approve new | The local operator confirms the active NCCC outlet. |

## Evidence

- [Jollibee Robinsons Place Tagum and store directory](https://www.jollibee.com.ph/stores?page=%2C27)
- [Jollibee Tagum Gaisano Grand Mall](https://www.jollibee.com.ph/stores/jollibee-tagum-gaisano-grand-mall)
- [Gerry's official Philippine branch locator](https://portal.gerrysgrill.com/ph/)
- [Mang Inasal official locations](https://www.manginasal.ph/locations)
- [Potato Corner 2026 participating-store list](https://potatocorner.com/whats-shaking/you-asked-we-listened-chicken-fries-are-back-%F0%9F%8D%97%F0%9F%94%A5/)
- [KFC official store locator](https://www.kfc.com.ph/en/store-locator)
- [Chowking official store locator](https://www.chowking.ph/location)

Local operator confirmations supplied on 2026-10-17 are first-hand moderation input, not provider or first-party directory verification. They support the updated decisions above but must retain `operator-confirmed` provenance in any moderation audit trail.

## Additional discovery follow-ups

The local operator also identified active places that are not represented by the reviewed candidates:

- Dunkin' — Robinsons Place Tagum
- KFC — near St. Mary's College of Tagum

These must enter through a separate discovery and staging record. They must not be synthesized by changing the branch identity of an unrelated held record.

## Production outcome

On 2026-10-17, production release `ccc58cbc-0121-4bba-bd06-c85666d847ae` recorded seven approvals and five rejections. It published the seven approved places, corrected Blugré to Weekly Market at `7.445063, 125.807438`, retained the original import batch, and increased the public catalog from 291 to 298 places. A live HTTPS response returned `200` and contained all seven new canonical slugs.

The remaining work is to resolve the five link-or-update candidates without creating duplicates and keep Fruitas and Goodyear Kitchenette held until stronger branch evidence exists. Dunkin' Robinsons and the newer KFC near St. Mary's College require separate discovery records.
