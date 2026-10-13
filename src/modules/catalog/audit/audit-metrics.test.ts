import { describe, expect, it } from "vitest";

import {
  type AuditViability,
  type CandidateAuditAssessment,
  calculatePlaceDataAudit,
  type ReferencePlaceAssessment,
} from "./audit-metrics";

const passingViability: AuditViability = {
  categoryDiscovery: "pass",
  cost: "pass",
  license: "pass",
  refresh: "pass",
};

function createCandidates(count = 100): CandidateAuditAssessment[] {
  return Array.from({ length: count }, (_, index) => ({
    candidateKey: `candidate-${index}`,
    categoryUsability: "usable" as const,
    coordinateUsability: "usable" as const,
    duplicateGroupId: null,
    lifecycle: "open" as const,
    priceEvidence: "unknown" as const,
  }));
}

function createReferences(matchedCount = 80, count = 100): ReferencePlaceAssessment[] {
  return Array.from({ length: count }, (_, index) => ({
    matches:
      index < matchedCount
        ? [{ candidateKey: `candidate-${index}`, decision: "confirmed" as const }]
        : [],
    referenceId: `reference-${index}`,
  }));
}

describe("calculatePlaceDataAudit", () => {
  it("passes the exact approved numeric boundaries", () => {
    const candidates = createCandidates();

    for (let index = 0; index < 5; index += 1) {
      candidates[index] = { ...candidates[index], coordinateUsability: "unusable" };
    }
    for (let index = 0; index < 4; index += 1) {
      const firstIndex = index * 2;
      const duplicateGroupId = `duplicate-group-${index}`;
      candidates[firstIndex] = { ...candidates[firstIndex], duplicateGroupId };
      candidates[firstIndex + 1] = { ...candidates[firstIndex + 1], duplicateGroupId };
      candidates[90 + index] = { ...candidates[90 + index], lifecycle: "permanently-closed" };
    }

    const result = calculatePlaceDataAudit(createReferences(), candidates, passingViability);

    expect(result.metrics.coverage).toEqual({ numerator: 80, denominator: 100, percentage: 80 });
    expect(result.metrics.coordinateUsability.percentage).toBe(95);
    expect(result.metrics.duplicates.percentage).toBe(4);
    expect(result.metrics.closedRecords.percentage).toBe(4);
    expect(result.metrics.priceCoverage.percentage).toBe(0);
    expect(result.decision).toBe("pass");
  });

  it("fails coverage below eighty percent", () => {
    const result = calculatePlaceDataAudit(
      createReferences(79),
      createCandidates(),
      passingViability,
    );

    expect(result.gates.coverage).toBe(false);
    expect(result.decision).toBe("fail");
  });

  it("fails coordinate usability below ninety-five percent", () => {
    const candidates = createCandidates();
    for (let index = 0; index < 6; index += 1) {
      candidates[index] = { ...candidates[index], coordinateUsability: "unknown" };
    }

    const result = calculatePlaceDataAudit(createReferences(), candidates, passingViability);

    expect(result.metrics.coordinateUsability.percentage).toBe(94);
    expect(result.gates.coordinateUsability).toBe(false);
  });

  it("fails duplicate and closed-record rates at exactly five percent", () => {
    const candidates = createCandidates();
    for (let index = 0; index < 5; index += 1) {
      const firstIndex = index * 2;
      const duplicateGroupId = `duplicate-group-${index}`;
      candidates[firstIndex] = { ...candidates[firstIndex], duplicateGroupId };
      candidates[firstIndex + 1] = { ...candidates[firstIndex + 1], duplicateGroupId };
      candidates[90 + index] = { ...candidates[90 + index], lifecycle: "permanently-closed" };
    }

    const result = calculatePlaceDataAudit(createReferences(), candidates, passingViability);

    expect(result.metrics.duplicates.percentage).toBe(5);
    expect(result.metrics.closedRecords.percentage).toBe(5);
    expect(result.gates.duplicates).toBe(false);
    expect(result.gates.closedRecords).toBe(false);
  });

  it("reports price coverage without making it a pass condition", () => {
    const candidates = createCandidates();
    candidates[0] = { ...candidates[0], priceEvidence: "defensible" };

    const result = calculatePlaceDataAudit(createReferences(), candidates, passingViability);

    expect(result.metrics.priceCoverage.percentage).toBe(1);
    expect(result.decision).toBe("pass");
  });

  it("blocks on a failed required viability review", () => {
    const result = calculatePlaceDataAudit(createReferences(), createCandidates(), {
      ...passingViability,
      license: "fail",
    });

    expect(result.gates.license).toBe(false);
    expect(result.decision).toBe("fail");
  });

  it("stays incomplete until the sample has exactly one hundred references", () => {
    const result = calculatePlaceDataAudit(
      createReferences(8, 10),
      createCandidates(10),
      passingViability,
    );

    expect(result.metrics.coverage.percentage).toBe(80);
    expect(result.gates.referenceSampleSize).toBe(false);
    expect(result.decision).toBe("incomplete");
  });

  it("stays incomplete while a required review is not assessed", () => {
    const result = calculatePlaceDataAudit(createReferences(), createCandidates(), {
      ...passingViability,
      refresh: "not-assessed",
    });

    expect(result.gates.refresh).toBe(false);
    expect(result.decision).toBe("incomplete");
  });

  it("rejects duplicate input identifiers", () => {
    const candidates = createCandidates();
    candidates[1] = { ...candidates[1], candidateKey: candidates[0].candidateKey };

    expect(() => calculatePlaceDataAudit(createReferences(), candidates, passingViability)).toThrow(
      "Candidate keys must be unique.",
    );
  });

  it("rejects reference matches to unknown candidates", () => {
    const references = createReferences();
    references[0] = {
      ...references[0],
      matches: [{ candidateKey: "missing-candidate", decision: "confirmed" }],
    };

    expect(() => calculatePlaceDataAudit(references, createCandidates(), passingViability)).toThrow(
      "Reference reference-0 names unknown candidate missing-candidate.",
    );
  });
});
