import { describe, expect, it } from "vitest";

import { normalizeFoursquareOsPlace } from "./foursquare-os";

describe("normalizeFoursquareOsPlace", () => {
  it("maps permitted open-source fields into the source-neutral contract", () => {
    const result = normalizeFoursquareOsPlace(
      {
        address: " 123 Example Street ",
        country: "PH",
        date_closed: null,
        date_refreshed: "2026-09-01",
        fsq_category_labels: [
          "Dining and Drinking > Restaurant",
          "Dining and Drinking > Restaurant",
        ],
        fsq_place_id: "fsq-123",
        instagram: "example_food",
        latitude: 7.447,
        locality: "Tagum",
        longitude: 125.807,
        name: " Example Kitchen ",
        postcode: "8100",
        region: "Davao del Norte",
        tel: "+63 900 000 0000",
        website: "https://example.test",
      },
      "2026-09-01",
      "2026-10-13T00:00:00.000Z",
    );

    expect(result.outcome).toBe("accepted");
    if (result.outcome === "rejected") return;
    expect(result.candidate).toMatchObject({
      candidateKey: "foursquare-os-places:fsq-123",
      coordinates: { latitude: 7.447, longitude: 125.807 },
      name: "Example Kitchen",
      sourceUpdatedAt: "2026-09-01T00:00:00.000Z",
    });
    expect(result.candidate.sourceCategoryLabels).toEqual(["Dining and Drinking > Restaurant"]);
    expect(result.candidate.contacts.social).toEqual(["instagram:example_food"]);
  });

  it("keeps absent or malformed optional values unknown", () => {
    const result = normalizeFoursquareOsPlace(
      {
        date_refreshed: "not-a-date",
        fsq_place_id: "fsq-123",
        latitude: "7.447",
        longitude: null,
        name: "Example Kitchen",
      },
      "2026-09-01",
      "2026-10-13T00:00:00.000Z",
    );

    expect(result.outcome).toBe("accepted");
    if (result.outcome === "rejected") return;
    expect(result.candidate.coordinates).toBeNull();
    expect(result.candidate.sourceUpdatedAt).toBeNull();
  });

  it("rejects rows without a provider identifier or name", () => {
    expect(normalizeFoursquareOsPlace({ name: "Example" }, "2026-09-01", "2026-10-13")).toEqual({
      outcome: "rejected",
      reason: "missing-id",
    });
    expect(
      normalizeFoursquareOsPlace({ fsq_place_id: "fsq-123" }, "2026-09-01", "2026-10-13"),
    ).toEqual({ outcome: "rejected", reason: "missing-name" });
  });
});
