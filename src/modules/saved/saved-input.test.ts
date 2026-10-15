import { describe, expect, it } from "vitest";

import { isPlaceSlug, isUuid, normalizeWheelListName } from "./saved-input";

describe("saved mutation input", () => {
  it("normalizes a wheel list name without accepting blank or oversized values", () => {
    expect(normalizeWheelListName("  Friday   food trip  ")).toBe("Friday food trip");
    expect(normalizeWheelListName("   ")).toBeNull();
    expect(normalizeWheelListName("x".repeat(41))).toBeNull();
  });

  it("accepts canonical UUID and place slug identifiers", () => {
    expect(isUuid("fd32ebad-88cc-403e-a254-d8f4b36b7160")).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isPlaceSlug("sarah-s-delicious-mami-11263235570")).toBe(true);
    expect(isPlaceSlug("../private")).toBe(false);
  });
});
