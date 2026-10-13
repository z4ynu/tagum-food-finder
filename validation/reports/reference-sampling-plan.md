# Tagum Reference Sampling Plan

## Decision

The product owner approved this discovery-balanced 100-place sampling plan on 13 October 2026. The quotas are locked before reference-place collection and before measuring OpenStreetMap or Foursquare coverage.

The reference sample remains in draft assembly status. Provider measurement is prohibited until all 100 places have lawful evidence, fulfill every quota, and pass the readiness validator.

## Approved quotas

### Category

| Category | Places |
| --- | ---: |
| Restaurant | 30 |
| Fast food | 15 |
| Cafe | 15 |
| Bakery | 10 |
| Food stall | 10 |
| Dessert | 8 |
| Prepared-food shop | 5 |
| Food court | 4 |
| Bar with food | 3 |
| **Total** | **100** |

### Other strata

| Dimension | Quota |
| --- | ---: |
| Urban | 75 |
| Rural | 25 |
| Independent | 75 |
| Chain | 25 |
| Established | 85 |
| Newly opened | 15 |

“Newly opened” means opened during the 12 months before the sampling-plan lock date. Urban and rural use the Philippine Statistics Authority classifications, with the rural quota implementing the approved less-dense stratum.

## Barangay basis

The [Philippine Statistics Authority Tagum PSGC listing](https://psa.gov.ph/classification/psgc/barangays/1102319000) identifies 23 barangays, their official urban or rural classification, and 2024 POPCEN population. Every barangay has a minimum target of one verified food place. Population is context only and does not determine the remaining allocation; otherwise the sample could hide weak coverage in less-dense areas.

| Barangay | Classification | 2024 population | Minimum places |
| --- | --- | ---: | ---: |
| Apokon | Urban | 40,500 | 1 |
| Bincungan | Rural | 4,113 | 1 |
| Busaon | Rural | 3,450 | 1 |
| Canocotan | Urban | 9,510 | 1 |
| Cuambogan | Urban | 13,416 | 1 |
| La Filipina | Urban | 23,556 | 1 |
| Liboganon | Rural | 3,035 | 1 |
| Madaum | Urban | 15,454 | 1 |
| Magdum | Urban | 13,331 | 1 |
| Mankilam | Urban | 42,540 | 1 |
| New Balamban | Rural | 1,654 | 1 |
| Nueva Fuerza | Rural | 2,709 | 1 |
| Pagsabangan | Urban | 5,332 | 1 |
| Pandapan | Rural | 2,471 | 1 |
| Magugpo Poblacion | Urban | 2,081 | 1 |
| San Agustin | Rural | 1,628 | 1 |
| San Isidro | Rural | 4,832 | 1 |
| San Miguel | Urban | 23,022 | 1 |
| Visayan Village | Urban | 40,921 | 1 |
| Magugpo East | Urban | 15,065 | 1 |
| Magugpo North | Urban | 8,530 | 1 |
| Magugpo South | Urban | 10,182 | 1 |
| Magugpo West | Urban | 12,710 | 1 |

## Selection safeguards

- Select places from lawful evidence independently of whether either evaluated provider contains them.
- Require evidence for identity, location, category, and current open status.
- Do not copy Google Maps consumer listings or use them as evidence.
- Keep the reference sample evaluation-only; do not import it into the production catalog.
- Record ambiguous lifecycle or branch identity honestly instead of forcing a match.
- Do not begin provider measurement until the sample contains exactly 100 places and the committed quota checks pass.

The machine-readable assembly file is `validation/fixtures/tagum-reference-sample.json`. No real business records are present at plan-lock time.
