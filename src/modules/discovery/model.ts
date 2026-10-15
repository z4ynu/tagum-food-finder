export type Coordinates = Readonly<{
  latitude: number;
  longitude: number;
}>;

export type EvidenceLevel = "verified" | "source" | "unknown";

export type EvidenceValues<T> = Readonly<{
  level: EvidenceLevel;
  values: readonly T[];
}>;

export type PriceEvidence = Readonly<{
  level: EvidenceLevel;
  maximumPerPersonPhp: number | null;
  minimumPerPersonPhp: number | null;
}>;

export type DiscoveryPlace = Readonly<{
  address: string | null;
  category: string;
  coordinates: Coordinates;
  cravings: EvidenceValues<string>;
  cuisines: readonly string[];
  id: string;
  name: string;
  occasions: EvidenceValues<string>;
  price: PriceEvidence;
  profileSlug?: string;
  sourceLabel: string;
}>;

export type DiscoveryFilters = Readonly<{
  budgetMaximumPhp: number | null;
  craving: string | null;
  occasion: string | null;
  query: string;
}>;

export type FilterMatchState = "confirmed" | "probable" | "unknown" | "excluded";

export type RankedPlace = Readonly<{
  distanceKilometers: number;
  matchState: FilterMatchState;
  place: DiscoveryPlace;
}>;
