import { readFileSync } from "node:fs";
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
      barangaySourceUrl: "https://psa.gov.ph/classification/psgc/barangays/1102319000",
      categoryQuotas: zeroCategoryQuotas,
      geographyDefinition: "PSA urban and rural classifications.",
      geographyQuotas: { rural: 0, urban: 0 },
      lockedAt: null,
      newlyOpenedDefinition: "Opened during the 12 months before the sample lock date.",
      openingEraQuotas: { established: 0, "newly-opened": 0 },
      rationale: "Draft quotas await owner approval before any provider measurement.",
    },
    schemaVersion: 2,
    status: "draft",
  };
}

describe("validateReferenceSample", () => {
  it("accepts the committed owner-approved plan as an assembly draft", () => {
    const fixture = JSON.parse(
      readFileSync(
        new URL("../../../../validation/fixtures/tagum-reference-sample.json", import.meta.url),
        "utf8",
      ),
    ) as ReferenceSample;

    expect(validateReferenceSample(fixture)).toEqual([]);
    expect(fixture.samplingPlan.lockedAt).not.toBeNull();
    expect(fixture.places).toHaveLength(0);
  });

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
          geography: "urban",
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

  it("allows an owner-approved sampling plan to be locked during assembly", () => {
    const sample: ReferenceSample = {
      ...draft(),
      samplingPlan: {
        ...draft().samplingPlan,
        barangayTargets: { "Synthetic Barangay": 1 },
        businessTypeQuotas: { chain: 25, independent: 75 },
        categoryQuotas: { ...zeroCategoryQuotas, restaurant: 100 },
        geographyQuotas: { rural: 25, urban: 75 },
        lockedAt: "2026-10-13T13:21:55Z",
        openingEraQuotas: { established: 85, "newly-opened": 15 },
      },
    };

    expect(validateReferenceSample(sample)).toEqual([]);
    expect(() => assertReferenceSampleReady(sample)).toThrow("must be locked");
  });
});
