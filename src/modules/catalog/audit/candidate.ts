export const candidateSchemaVersion = 1 as const;

export type SourceReference = Readonly<{
  recordId: string;
  slug: string;
  snapshotVersion: string;
}>;

export type CandidateCoordinates = Readonly<{
  latitude: number;
  longitude: number;
}>;

export type CandidateAddress = Readonly<{
  addressLine: string | null;
  barangayLabel: string | null;
  countryCode: string | null;
  locality: string | null;
  postalCode: string | null;
  region: string | null;
}>;

export type CandidateContacts = Readonly<{
  email: string | null;
  phone: string | null;
  social: readonly string[];
  website: string | null;
}>;

export type NormalizedPlaceCandidate = Readonly<{
  address: CandidateAddress | null;
  alternateNames: readonly string[];
  candidateKey: string;
  contacts: CandidateContacts;
  coordinates: CandidateCoordinates | null;
  name: string;
  openingHoursText: string | null;
  retrievedAt: string;
  schemaVersion: typeof candidateSchemaVersion;
  source: SourceReference;
  sourceCategoryLabels: readonly string[];
  sourceClosedAt: string | null;
  sourceCuisineLabels: readonly string[];
  sourceUpdatedAt: string | null;
}>;
