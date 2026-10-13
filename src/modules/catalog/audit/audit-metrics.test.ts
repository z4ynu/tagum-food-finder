import { describe, expect, it } from "vitest";

import {
  type AuditViability,
  type CandidateAuditAssessment,
  calculatePlaceDataAudit,
} from "./audit-metrics";

const passingViability: AuditViability = {
  categoryDiscovery: "pass",
  cost: "pass",
  license: "pass",
  refresh: "pass",
};

function createCandidates(count = 25): CandidateAuditAssessment[] {
  return Array.from({ length: count }, (_, index) => ({
    candidateKey: `candidate-${index}`,
    categoryUsability: "usable" as const,
    coordinateUsability: "usable" as const,
    duplicateGroupId: null,
    lifecycle: "open" as const,
    priceEvidence: "unknown" as const,
  }));
}

describe("calculatePlaceDataAudit", () => {
  it("passes the exact approved numeric boundaries", () => {
    const candidates = createCandidates();

    candidates[0] = { ...candidates[0], coordinateUsability: "unusable" };
    candidates[1] = { ...candidates[1], duplicateGroupId: "duplicate-group-0" };
    candidates[2] = { ...candidates[2], duplicateGroupId: "duplicate-group-0" };
    candidates[24] = { ...candidates[24], lifecycle: "permanently-closed" };

    const result = calculatePlaceDataAudit(candidates, passingViability);

    expect(result.metrics.coordinateUsability.percentage).toBe(96);
    expect(result.metrics.duplicates.percentage).toBe(4);
    expect(result.metrics.closedRecords.percentage).toBe(4);
    expect(result.metrics.priceCoverage.percentage).toBe(0);
    expect(result.decision).toBe("pass");
  });

  it("fails coordinate usability below ninety-five percent", () => {
    const candidates = createCandidates();
    for (let index = 0; index < 2; index += 1) {
      candidates[index] = { ...candidates[index], coordinateUsability: "unknown" };
    }

    const result = calculatePlaceDataAudit(candidates, passingViability);

    expect(result.metrics.coordinateUsability.percentage).toBe(92);
    expect(result.gates.coordinateUsability).toBe(false);
  });

  it("fails duplicate and closed-record rates above five percent", () => {
    const candidates = createCandidates();
    for (let index = 0; index < 2; index += 1) {
      const firstIndex = index * 2;
      const duplicateGroupId = `duplicate-group-${index}`;
      candidates[firstIndex] = { ...candidates[firstIndex], duplicateGroupId };
      candidates[firstIndex + 1] = { ...candidates[firstIndex + 1], duplicateGroupId };
      candidates[23 + index] = { ...candidates[23 + index], lifecycle: "permanently-closed" };
    }

    const result = calculatePlaceDataAudit(candidates, passingViability);

    expect(result.metrics.duplicates.percentage).toBe(8);
    expect(result.metrics.closedRecords.percentage).toBe(8);
    expect(result.gates.duplicates).toBe(false);
    expect(result.gates.closedRecords).toBe(false);
  });

  it("reports price coverage without making it a pass condition", () => {
    const candidates = createCandidates();
    candidates[0] = { ...candidates[0], priceEvidence: "defensible" };

    const result = calculatePlaceDataAudit(candidates, passingViability);

    expect(result.metrics.priceCoverage.percentage).toBe(4);
    expect(result.decision).toBe("pass");
  });

  it("blocks on a failed required viability review", () => {
    const result = calculatePlaceDataAudit(createCandidates(), {
      ...passingViability,
      license: "fail",
    });

    expect(result.gates.license).toBe(false);
    expect(result.decision).toBe("fail");
  });

  it("stays incomplete until the spot check has exactly twenty-five candidates", () => {
    const result = calculatePlaceDataAudit(createCandidates(10), passingViability);

    expect(result.gates.spotCheckSize).toBe(false);
    expect(result.decision).toBe("incomplete");
  });

  it("stays incomplete while a required review is not assessed", () => {
    const result = calculatePlaceDataAudit(createCandidates(), {
      ...passingViability,
      refresh: "not-assessed",
    });

    expect(result.gates.refresh).toBe(false);
    expect(result.decision).toBe("incomplete");
  });

  it("rejects duplicate input identifiers", () => {
    const candidates = createCandidates();
    candidates[1] = { ...candidates[1], candidateKey: candidates[0].candidateKey };

    expect(() => calculatePlaceDataAudit(candidates, passingViability)).toThrow(
      "Candidate keys must be unique.",
    );
  });
});
