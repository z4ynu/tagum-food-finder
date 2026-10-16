import { describe, expect, it } from "vitest";

import { normalizeOverturePlace } from "./overture-places";

describe("normalizeOverturePlace", () => {
  it("maps approved open fields into the source-neutral contract", () => {
    const result = normalizeOverturePlace(
      {
        addresses: [
          {
            country: "PH",
            freeform: "Apokon Road, Tagum City",
            locality: "Tagum",
            postcode: "8100",
            region: "Davao del Norte",
          },
        ],
        emails: ["hello@example.test"],
        geometry: { coordinates: [125.807, 7.447], type: "Point" },
        id: "gers-123",
        names: { common: { en: ["Example Cafe"] }, primary: "Example Café" },
        phones: ["+639000000000"],
        socials: ["https://www.facebook.com/example"],
        sources: [
          { dataset: "meta", update_time: "2026-08-01" },
          { dataset: "Foursquare", update_time: "2026-09-02" },
        ],
        taxonomy: { alternates: ["bakery"], primary: "cafe" },
        websites: ["https://example.test"],
      },
      "2026-09-23.1",
      "2026-10-16T00:00:00.000Z",
    );

    expect(result.outcome).toBe("accepted");
    if (result.outcome === "rejected") return;
    expect(result.candidate).toMatchObject({
      candidateKey: "overture-places:gers-123",
      coordinates: { latitude: 7.447, longitude: 125.807 },
      name: "Example Café",
      source: { recordId: "gers-123", slug: "overture-places" },
      sourceUpdatedAt: "2026-09-02T00:00:00.000Z",
    });
    expect(result.candidate.sourceCategoryLabels).toEqual([
      "taxonomy:cafe",
      "taxonomy:bakery",
    ]);
    expect(result.candidate.contacts.social).toEqual(["https://www.facebook.com/example"]);
  });

  it("keeps malformed optional values unknown", () => {
    const result = normalizeOverturePlace(
      {
        addresses: "not-a-list",
        geometry: { coordinates: ["125.8", null], type: "Point" },
        id: "gers-123",
        names: { primary: "Example Cafe" },
        sources: [{ update_time: "not-a-date" }],
      },
      "2026-09-23.1",
      "2026-10-16T00:00:00.000Z",
    );

    expect(result.outcome).toBe("accepted");
    if (result.outcome === "rejected") return;
    expect(result.candidate.coordinates).toBeNull();
    expect(result.candidate.sourceUpdatedAt).toBeNull();
    expect(result.candidate.contacts.website).toBeNull();
  });

  it("rejects records without a stable identifier or name", () => {
    expect(normalizeOverturePlace({ names: { primary: "Cafe" } }, "r1", "2026-10-16")).toEqual({
      outcome: "rejected",
      reason: "missing-id",
    });
    expect(normalizeOverturePlace({ id: "gers-123" }, "r1", "2026-10-16")).toEqual({
      outcome: "rejected",
      reason: "missing-name",
    });
  });
});
