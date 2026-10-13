export type ReviewState = "fail" | "not-assessed" | "pass";

export type CandidateAuditAssessment = Readonly<{
  candidateKey: string;
  categoryUsability: "unknown" | "unusable" | "usable";
  coordinateUsability: "unknown" | "unusable" | "usable";
  duplicateGroupId: string | null;
  lifecycle: "open" | "permanently-closed" | "unknown";
  priceEvidence: "defensible" | "unknown";
}>;

export type AuditViability = Readonly<{
  categoryDiscovery: ReviewState;
  cost: ReviewState;
  license: ReviewState;
  refresh: ReviewState;
}>;

export type AuditRate = Readonly<{
  denominator: number;
  numerator: number;
  percentage: number | null;
}>;

export type PlaceDataAuditResult = Readonly<{
  decision: "fail" | "incomplete" | "pass";
  gates: Readonly<{
    categoryDiscovery: boolean;
    closedRecords: boolean;
    coordinateUsability: boolean;
    cost: boolean;
    duplicates: boolean;
    license: boolean;
    refresh: boolean;
    spotCheckSize: boolean;
  }>;
  metrics: Readonly<{
    categoryUsability: AuditRate;
    closedRecords: AuditRate;
    coordinateUsability: AuditRate;
    duplicates: AuditRate;
    priceCoverage: AuditRate;
  }>;
}>;

function createRate(numerator: number, denominator: number): AuditRate {
  const percentage =
    denominator === 0 ? null : Math.round((numerator / denominator) * 10_000) / 100;

  return { denominator, numerator, percentage };
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} must be unique.`);
  }
}

function countDuplicateRows(assessments: readonly CandidateAuditAssessment[]): number {
  const groupSizes = new Map<string, number>();

  for (const assessment of assessments) {
    if (assessment.duplicateGroupId) {
      groupSizes.set(
        assessment.duplicateGroupId,
        (groupSizes.get(assessment.duplicateGroupId) ?? 0) + 1,
      );
    }
  }

  return [...groupSizes.values()].reduce(
    (duplicateRows, groupSize) => duplicateRows + Math.max(0, groupSize - 1),
    0,
  );
}

export function calculatePlaceDataAudit(
  candidates: readonly CandidateAuditAssessment[],
  viability: AuditViability,
): PlaceDataAuditResult {
  assertUnique(
    candidates.map((candidate) => candidate.candidateKey),
    "Candidate keys",
  );

  const usableCoordinateCount = candidates.filter(
    (candidate) => candidate.coordinateUsability === "usable",
  ).length;
  const closedRecordCount = candidates.filter(
    (candidate) => candidate.lifecycle === "permanently-closed",
  ).length;
  const usableCategoryCount = candidates.filter(
    (candidate) => candidate.categoryUsability === "usable",
  ).length;
  const defensiblePriceCount = candidates.filter(
    (candidate) => candidate.priceEvidence === "defensible",
  ).length;
  const duplicateCount = countDuplicateRows(candidates);

  const metrics = {
    categoryUsability: createRate(usableCategoryCount, candidates.length),
    closedRecords: createRate(closedRecordCount, candidates.length),
    coordinateUsability: createRate(usableCoordinateCount, candidates.length),
    duplicates: createRate(duplicateCount, candidates.length),
    priceCoverage: createRate(defensiblePriceCount, candidates.length),
  };

  const gates = {
    categoryDiscovery: viability.categoryDiscovery === "pass",
    closedRecords:
      metrics.closedRecords.percentage !== null && metrics.closedRecords.percentage < 5,
    coordinateUsability:
      metrics.coordinateUsability.percentage !== null &&
      metrics.coordinateUsability.percentage >= 95,
    cost: viability.cost === "pass",
    duplicates: metrics.duplicates.percentage !== null && metrics.duplicates.percentage < 5,
    license: viability.license === "pass",
    refresh: viability.refresh === "pass",
    spotCheckSize: candidates.length === 25,
  };

  const hasFailedMeasuredGate =
    !gates.coordinateUsability ||
    !gates.duplicates ||
    !gates.closedRecords ||
    viability.categoryDiscovery === "fail" ||
    viability.cost === "fail" ||
    viability.license === "fail" ||
    viability.refresh === "fail";
  const hasIncompleteRequiredReview =
    !gates.spotCheckSize || Object.values(viability).includes("not-assessed");

  return {
    decision: hasFailedMeasuredGate ? "fail" : hasIncompleteRequiredReview ? "incomplete" : "pass",
    gates,
    metrics,
  };
}
