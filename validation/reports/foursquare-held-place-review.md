# Foursquare-backed held-place review

## Decision

The 19 Overture records with retained Foursquare identifiers must not be published as one group. Manual review recommends one new-place approval, three rejections for source-location conflicts, five link-or-update investigations against existing public places, and ten continued holds.

No production record was changed by this review. The Foursquare Places API was unavailable, so decisions use the checksummed Overture record, the active catalog, and current public corroboration. Provider IDs remain private.

## Review method

- Compare candidate name, category, coordinates, and address with the active 291-place release.
- Find the nearest active place and every active exact-name place.
- Reject records whose stated locality conflicts materially with their Tagum coordinates.
- Avoid publishing a chain outlet when an existing same-name record could represent the same branch.
- Require current outlet-level evidence before approving a new place.

## Recommendations

| Candidate | Recommendation | Reason |
| --- | --- | --- |
| Blugré Coffee | Hold | The Nicole's 22nd Strip address is corroborated by public directories, but the current ordering listing refers to a Weekly Market outlet. Current outlet identity needs confirmation. |
| Chowking — Malaybalay address | Reject | The source address says Malaybalay, Bukidnon while the coordinates are inside Tagum. |
| Chowking — Tagum City | Link or update | Two Chowking places are already public; the candidate is 434 metres from the nearest same-name place and has no branch-specific address. |
| Dunkin' — Gaisano Mall of Tagum | Hold | Multiple public listings corroborate a GMall Tagum outlet, but no current first-party locator result was found. |
| Dunkin' — Gaisano Grand of Tagum | Hold | Historical store lists corroborate the outlet, but current outlet status and exact coordinates remain unverified. |
| Fruitas | Hold | No branch address or current outlet-level evidence is present. |
| Gerry's Grill — Robinsons Place Tagum | Link or update | Gerry's official locator confirms the branch, and the public catalog already contains a same-name Robinsons Place record. The candidate is about two kilometres from that record and must not become a duplicate. |
| Goodyear Kitchenette | Hold | The local address is plausible but no sufficiently reliable current public source was found. |
| Jollibee — Valencia City address | Reject | The source address says Valencia City, Bukidnon while the coordinates are inside Tagum. |
| Jollibee — Robinsons | Link or update | Jollibee's official locator confirms Robinsons Place Tagum, and a public Jollibee record already exists near the mall. |
| Jollibee — Gaisano Mall of Tagum | Link or update | Jollibee's official locator confirms Tagum mall outlets, while five same-name places are already public. Branch identity and coordinates need reconciliation. |
| KFC — Gaisano Mall of Tagum | Hold | Historical evidence exists, but KFC's current official locator did not return a Tagum outlet. |
| Mang Inasal — Central Warehouse | Hold | Mang Inasal officially lists Tagum Downtown, CityMall Tagum, and GMall Tagum, but not this branch label; three same-name places are already public. |
| McDonald's — Tagum City | Link or update | Three McDonald's places are already public and the candidate has no branch-specific address. |
| Pizza Hut — SM City Davao address | Reject | The source address says SM City Davao while the coordinates are inside Tagum. |
| Potato Corner — Robinsons Place Tagum | Approve new | Potato Corner's current official campaign store list includes `Robinsons Place Tagum- G/F`, and no Potato Corner place is public. The candidate address identifies that outlet. |
| Red Ribbon — Gaisano Mall of Tagum | Hold | The candidate is plausible but lacks current outlet-level corroboration. |
| Red Ribbon — Gaisano Grand Tagum | Hold | The candidate is plausible but lacks current outlet-level corroboration. |
| Waffle Time — NCCC Mall of Tagum | Hold | The candidate has a specific mall address but lacks current outlet-level corroboration. |

## Evidence

- [Jollibee Robinsons Place Tagum and store directory](https://www.jollibee.com.ph/stores?page=%2C27)
- [Jollibee Tagum Gaisano Grand Mall](https://www.jollibee.com.ph/stores/jollibee-tagum-gaisano-grand-mall)
- [Gerry's official Philippine branch locator](https://portal.gerrysgrill.com/ph/)
- [Mang Inasal official locations](https://www.manginasal.ph/locations)
- [Potato Corner 2026 participating-store list](https://potatocorner.com/whats-shaking/you-asked-we-listened-chicken-fries-are-back-%F0%9F%8D%97%F0%9F%94%A5/)
- [KFC official store locator](https://www.kfc.com.ph/en/store-locator)
- [Chowking official store locator](https://www.chowking.ph/location)

Third-party results for Blugré and Dunkin' were treated as corroboration only and were not sufficient for automatic approval.

## Required next step

The one approved candidate still requires an explicit moderation decision and a new immutable catalog release. The five link-or-update candidates require branch matching before any canonical record or coordinate changes. The current published import batch must not be edited in place.
