import type { AuditPlaceCategory } from "./source-category";

export const referenceSampleSchemaVersion = 1 as const;

export type ReferenceEvidenceKind =
  | "local-government-record"
  | "official-business-site"
  | "official-social-page"
  | "owner-confirmation"
  | "storefront-observation"
  | "other-lawful-public";

export type ReferenceEvidenceSupport =
  | "category"
  | "identity"
  | "location"
  | "open-status"
  | "price";

export type ReferenceSamplePlace = Readonly<{
  barangay: string;
  businessType: "chain" | "independent";
  category: AuditPlaceCategory;
  coordinates: Readonly<{ latitude: number; longitude: number }>;
  evidence: readonly Readonly<{
    kind: ReferenceEvidenceKind;
    observedAt: string;
    reference: string;
    supports: readonly ReferenceEvidenceSupport[];
  }>[];
  geography: "central" | "less-dense";
  lifecycle: "open" | "permanently-closed" | "uncertain";
  name: string;
  openingEra: "established" | "newly-opened";
  referenceId: string;
}>;

export type ReferenceSample = Readonly<{
  measurementStartedAt: string | null;
  places: readonly ReferenceSamplePlace[];
  purpose: "stage0-provider-evaluation";
  samplingPlan: Readonly<{
    barangayTargets: Readonly<Record<string, number>>;
    businessTypeQuotas: Readonly<Record<ReferenceSamplePlace["businessType"], number>>;
    categoryQuotas: Readonly<Record<AuditPlaceCategory, number>>;
    geographyQuotas: Readonly<Record<ReferenceSamplePlace["geography"], number>>;
    lockedAt: string | null;
    newlyOpenedDefinition: string;
    openingEraQuotas: Readonly<Record<ReferenceSamplePlace["openingEra"], number>>;
    rationale: string;
  }>;
  schemaVersion: typeof referenceSampleSchemaVersion;
  status: "draft" | "locked";
}>;

const requiredEvidenceSupports: readonly ReferenceEvidenceSupport[] = [
  "category",
  "identity",
  "location",
  "open-status",
];
function isIsoTimestamp(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

function isGoogleConsumerMapUrl(url: URL): boolean {
  const hostname = url.hostname.toLocaleLowerCase("en");
  return (
    hostname === "maps.app.goo.gl" ||
    hostname.startsWith("maps.google.") ||
    ((hostname === "google.com" || hostname.endsWith(".google.com")) &&
      url.pathname.startsWith("/maps"))
  );
}

function sum(values: Readonly<Record<string, number>>): number {
  return Object.values(values).reduce((total, value) => total + value, 0);
}

function countBy<T extends string>(values: readonly T[]): Record<T, number> {
  const result = {} as Record<T, number>;
  for (const value of values) result[value] = (result[value] ?? 0) + 1;
  return result;
}

function quotaIssues<T extends string>(
  label: string,
  quotas: Readonly<Record<T, number>>,
  actualValues: readonly T[],
): string[] {
  const issues: string[] = [];
  if (Object.values<number>(quotas).some((value) => !Number.isInteger(value) || value < 0)) {
    issues.push(`${label} quotas must be non-negative integers.`);
  }
  if (sum(quotas) !== 100) issues.push(`${label} quotas must total 100.`);

  const actual = countBy(actualValues);
  for (const [key, quota] of Object.entries<number>(quotas)) {
    if ((actual[key as T] ?? 0) !== quota) {
      issues.push(
        `${label} quota ${key} expected ${quota} places but received ${actual[key as T] ?? 0}.`,
      );
    }
  }
  return issues;
}

function evidenceIssues(place: ReferenceSamplePlace): string[] {
  const issues: string[] = [];
  const supported = new Set(place.evidence.flatMap(({ supports }) => supports));
  for (const support of requiredEvidenceSupports) {
    if (!supported.has(support)) issues.push(`${place.referenceId} lacks ${support} evidence.`);
  }

  for (const evidence of place.evidence) {
    if (!isIsoTimestamp(evidence.observedAt)) {
      issues.push(`${place.referenceId} has an invalid evidence observation time.`);
    }
    if (evidence.reference.trim().length === 0) {
      issues.push(`${place.referenceId} has an empty evidence reference.`);
      continue;
    }

    try {
      const url = new URL(evidence.reference);
      if (isGoogleConsumerMapUrl(url)) {
        issues.push(`${place.referenceId} uses prohibited Google consumer-map evidence.`);
      }
    } catch {
      if (
        !evidence.reference.startsWith("observation:") &&
        !evidence.reference.startsWith("confirmation:")
      ) {
        issues.push(`${place.referenceId} has an unsupported non-URL evidence reference.`);
      }
    }
  }

  return issues;
}

export function validateReferenceSample(sample: ReferenceSample): readonly string[] {
  const issues: string[] = [];
  if (sample.schemaVersion !== referenceSampleSchemaVersion)
    issues.push("Unsupported reference-sample schema version.");
  if (sample.purpose !== "stage0-provider-evaluation")
    issues.push("Reference sample has the wrong purpose.");
  if (sample.samplingPlan.rationale.trim().length === 0)
    issues.push("Sampling rationale is required.");
  if (sample.samplingPlan.newlyOpenedDefinition.trim().length === 0)
    issues.push("A newly-opened definition is required.");

  const referenceIds = sample.places.map(({ referenceId }) => referenceId);
  if (new Set(referenceIds).size !== referenceIds.length)
    issues.push("Reference identifiers must be unique.");

  for (const place of sample.places) {
    if (!/^ref-\d{3}$/.test(place.referenceId))
      issues.push(`${place.referenceId} has an invalid reference identifier.`);
    if (!place.name.trim()) issues.push(`${place.referenceId} has an empty name.`);
    if (!place.barangay.trim()) issues.push(`${place.referenceId} has an empty barangay.`);
    if (
      !Number.isFinite(place.coordinates.latitude) ||
      !Number.isFinite(place.coordinates.longitude) ||
      place.coordinates.latitude < -90 ||
      place.coordinates.latitude > 90 ||
      place.coordinates.longitude < -180 ||
      place.coordinates.longitude > 180
    ) {
      issues.push(`${place.referenceId} has invalid WGS84 coordinates.`);
    }
    issues.push(...evidenceIssues(place));
  }

  if (sample.status === "draft") {
    if (sample.samplingPlan.lockedAt !== null)
      issues.push("A draft sampling plan cannot have a lock time.");
    if (sample.measurementStartedAt !== null)
      issues.push("Provider measurement cannot start while the sample is a draft.");
    return issues;
  }

  if (sample.places.length !== 100)
    issues.push("A locked reference sample must contain exactly 100 places.");
  if (!sample.samplingPlan.lockedAt || !isIsoTimestamp(sample.samplingPlan.lockedAt)) {
    issues.push("A locked reference sample requires a valid lock time.");
  }
  if (sample.measurementStartedAt && !isIsoTimestamp(sample.measurementStartedAt)) {
    issues.push("Measurement start time must be a valid timestamp.");
  }
  if (
    sample.measurementStartedAt &&
    sample.samplingPlan.lockedAt &&
    Date.parse(sample.measurementStartedAt) < Date.parse(sample.samplingPlan.lockedAt)
  ) {
    issues.push("Provider measurement cannot begin before the sampling plan is locked.");
  }

  issues.push(
    ...quotaIssues(
      "Category",
      sample.samplingPlan.categoryQuotas,
      sample.places.map(({ category }) => category),
    ),
    ...quotaIssues(
      "Geography",
      sample.samplingPlan.geographyQuotas,
      sample.places.map(({ geography }) => geography),
    ),
    ...quotaIssues(
      "Business type",
      sample.samplingPlan.businessTypeQuotas,
      sample.places.map(({ businessType }) => businessType),
    ),
    ...quotaIssues(
      "Opening era",
      sample.samplingPlan.openingEraQuotas,
      sample.places.map(({ openingEra }) => openingEra),
    ),
  );

  const actualBarangays = countBy(sample.places.map(({ barangay }) => barangay));
  for (const [barangay, minimum] of Object.entries(sample.samplingPlan.barangayTargets)) {
    if (!Number.isInteger(minimum) || minimum < 0)
      issues.push(`Barangay target ${barangay} must be a non-negative integer.`);
    if ((actualBarangays[barangay] ?? 0) < minimum)
      issues.push(`Barangay target ${barangay} requires at least ${minimum} places.`);
  }

  return issues;
}

export function assertReferenceSampleReady(sample: ReferenceSample): void {
  const issues = [...validateReferenceSample(sample)];
  if (sample.status !== "locked") issues.unshift("Reference sample must be locked.");
  if (issues.length > 0)
    throw new Error(`Reference sample is not ready:\n- ${issues.join("\n- ")}`);
}
