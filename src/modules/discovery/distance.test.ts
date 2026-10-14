import { describe, expect, it } from "vitest";

import { distanceInKilometers, formatDistance } from "./distance";

describe("distanceInKilometers", () => {
  it("returns zero for the same point", () => {
    const point = { latitude: 7.4478, longitude: 125.807 };

    expect(distanceInKilometers(point, point)).toBe(0);
  });

  it("returns a symmetric geographic distance", () => {
    const first = { latitude: 7.4478, longitude: 125.807 };
    const second = { latitude: 7.4488855, longitude: 125.8037407 };

    expect(distanceInKilometers(first, second)).toBeCloseTo(
      distanceInKilometers(second, first),
      10,
    );
    expect(distanceInKilometers(first, second)).toBeGreaterThan(0.3);
    expect(distanceInKilometers(first, second)).toBeLessThan(0.5);
  });
});

describe("formatDistance", () => {
  it("uses meters below one kilometer", () => {
    expect(formatDistance(0.341)).toBe("340 m");
  });

  it("uses a decimal kilometer below ten kilometers", () => {
    expect(formatDistance(1.46)).toBe("1.5 km");
  });
});
