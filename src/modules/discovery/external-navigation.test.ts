import { describe, expect, it } from "vitest";

import { googleMapsDirectionsUrl, wazeDirectionsUrl } from "./external-navigation";

const DESTINATION = { latitude: 7.4488855, longitude: 125.8037407 };

describe("external navigation URLs", () => {
  it("builds a Google Maps destination-only route", () => {
    const url = new URL(googleMapsDirectionsUrl(DESTINATION));

    expect(url.origin).toBe("https://www.google.com");
    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.get("destination")).toBe("7.4488855,125.8037407");
  });

  it("builds a Waze navigation handoff", () => {
    const url = new URL(wazeDirectionsUrl(DESTINATION));

    expect(url.origin).toBe("https://www.waze.com");
    expect(url.searchParams.get("ll")).toBe("7.4488855,125.8037407");
    expect(url.searchParams.get("navigate")).toBe("yes");
  });
});
