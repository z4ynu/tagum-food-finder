export const candidateSchemaVersion = 1 as const;

export type SourceReference = Readonly<{
  recordId: string;
  slug: string;
}>;

export type CandidateCoordinates = Readonly<{
  latitude: number;
  longitude: number;
}>;

export type CandidateAddress = Readonly<{
  addressLine: string | null;
  barangayLabel: string | null;
  postalCode: string | null;
}>;

export type NormalizedPlaceCandidate = Readonly<{
  address: CandidateAddress | null;
  alternateNames: readonly string[];
  candidateKey: string;
  coordinates: CandidateCoordinates | null;
  name: string;
  retrievedAt: string;
  schemaVersion: typeof candidateSchemaVersion;
  source: SourceReference;
  sourceCategoryLabels: readonly string[];
  sourceUpdatedAt: string | null;
}>;
