import { distanceInKilometers } from "./distance";
import type {
  Coordinates,
  DiscoveryFilters,
  DiscoveryPlace,
  EvidenceValues,
  FilterMatchState,
  RankedPlace,
} from "./model";

function matchesQuery(place: DiscoveryPlace, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [place.name, place.category, place.address ?? "", ...place.cuisines]
    .join(" ")
    .toLocaleLowerCase()
    .includes(normalizedQuery);
}

function evidenceMatch(
  evidence: EvidenceValues<string>,
  selected: string | null,
): FilterMatchState {
  if (!selected) {
    return "confirmed" satisfies FilterMatchState;
  }
  if (evidence.level === "unknown") {
    return "unknown" satisfies FilterMatchState;
  }
  if (!evidence.values.includes(selected)) {
    return "excluded" satisfies FilterMatchState;
  }

  return evidence.level === "verified" ? "confirmed" : "probable";
}

function priceMatch(place: DiscoveryPlace, budgetMaximumPhp: number | null): FilterMatchState {
  if (budgetMaximumPhp === null) {
    return "confirmed" satisfies FilterMatchState;
  }
  if (
    place.price.level === "unknown" ||
    place.price.minimumPerPersonPhp === null ||
    place.price.maximumPerPersonPhp === null
  ) {
    return "unknown" satisfies FilterMatchState;
  }
  if (place.price.minimumPerPersonPhp > budgetMaximumPhp) {
    return "excluded" satisfies FilterMatchState;
  }

  return place.price.level === "verified" ? "confirmed" : "probable";
}

export function getPlaceMatchState(
  place: DiscoveryPlace,
  filters: DiscoveryFilters,
): FilterMatchState {
  if (!matchesQuery(place, filters.query)) {
    return "excluded" satisfies FilterMatchState;
  }

  const states = [
    evidenceMatch(place.cravings, filters.craving),
    evidenceMatch(place.occasions, filters.occasion),
    priceMatch(place, filters.budgetMaximumPhp),
  ];

  if (states.includes("excluded")) {
    return "excluded" satisfies FilterMatchState;
  }
  if (states.includes("unknown")) {
    return "unknown" satisfies FilterMatchState;
  }
  if (states.includes("probable")) {
    return "probable" satisfies FilterMatchState;
  }
  return "confirmed" satisfies FilterMatchState;
}

const MATCH_PRIORITY: Record<FilterMatchState, number> = {
  confirmed: 0,
  probable: 1,
  unknown: 2,
  excluded: 3,
};

export function rankPlaces(
  places: readonly DiscoveryPlace[],
  origin: Coordinates,
  filters: DiscoveryFilters,
): readonly RankedPlace[] {
  return places
    .map((place) => ({
      distanceKilometers: distanceInKilometers(origin, place.coordinates),
      matchState: getPlaceMatchState(place, filters),
      place,
    }))
    .filter((result) => result.matchState !== "excluded")
    .sort(
      (first, second) =>
        MATCH_PRIORITY[first.matchState] - MATCH_PRIORITY[second.matchState] ||
        first.distanceKilometers - second.distanceKilometers ||
        first.place.name.localeCompare(second.place.name),
    );
}
