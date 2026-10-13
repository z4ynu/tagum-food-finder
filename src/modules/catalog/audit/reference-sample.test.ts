import { describe, expect, it } from "vitest";
import {
  assertReferenceSampleReady,
  type ReferenceSample,
  validateReferenceSample,
} from "./reference-sample";

const zeroCategoryQuotas = {
  bakery: 0,
  "bar-with-food": 0,
  cafe: 0,
  dessert: 0,
  "fast-food": 0,
  "food-court": 0,
  "food-stall": 0,
  "prepared-food-shop": 0,
  restaurant: 0,
} as const;

function draft(): ReferenceSample {
  return {
    measurementStartedAt: null,
    places: [],
    purpose: "stage0-provider-evaluation",
    samplingPlan: {
      barangayTargets: {},
      businessTypeQuotas: { chain: 0, independent: 0 },
      categoryQuotas: zeroCategoryQuotas,
      geographyQuotas: { central: 0, "less-dense": 0 },
      lockedAt: null,
      newlyOpenedDefinition: "Opened during the 12 months before the sample lock date.",
      openingEraQuotas: { established: 0, "newly-opened": 0 },
      rationale: "Draft quotas await owner approval before any provider measurement.",
    },
    schemaVersion: 1,
    status: "draft",
  };
}

describe("validateReferenceSample", () => {
  it("allows an incomplete draft before provider measurement", () => {
    expect(validateReferenceSample(draft())).toEqual([]);
    expect(() => assertReferenceSampleReady(draft())).toThrow("must be locked");
  });

  it("prevents measurement from starting on a draft", () => {
    expect(
      validateReferenceSample({ ...draft(), measurementStartedAt: "2026-10-13T01:00:00Z" }),
    ).toContain("Provider measurement cannot start while the sample is a draft.");
  });

  it("rejects prohibited Google consumer-map evidence", () => {
    const sample: ReferenceSample = {
      ...draft(),
      places: [
        {
          barangay: "Synthetic Barangay",
          businessType: "independent",
          category: "restaurant",
          coordinates: { latitude: 7.4, longitude: 125.8 },
          evidence: [
            {
              kind: "other-lawful-public",
              observedAt: "2026-10-13T00:00:00Z",
              reference: "https://www.google.com/maps/place/example",
              supports: ["category", "identity", "location", "open-status"],
            },
          ],
          geography: "central",
          lifecycle: "open",
          name: "Synthetic Restaurant",
          openingEra: "established",
          referenceId: "ref-001",
        },
      ],
    };

    expect(validateReferenceSample(sample)).toContain(
      "ref-001 uses prohibited Google consumer-map evidence.",
    );
  });

  it("requires a locked sample to contain 100 places and balanced quotas", () => {
    const sample: ReferenceSample = {
      ...draft(),
      samplingPlan: { ...draft().samplingPlan, lockedAt: "2026-10-13T00:00:00Z" },
      status: "locked",
    };

    expect(() => assertReferenceSampleReady(sample)).toThrow("exactly 100 places");
    expect(validateReferenceSample(sample)).toContain("Category quotas must total 100.");
  });
});
