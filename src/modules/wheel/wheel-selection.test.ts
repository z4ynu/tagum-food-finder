import { describe, expect, it } from "vitest";

import { nextWheelRotation, wheelIndexFromUint32 } from "./wheel-selection";

describe("wheel selection", () => {
  it("maps accepted unsigned values evenly across entries", () => {
    expect([0, 1, 2, 3, 4].map((value) => wheelIndexFromUint32(5, value))).toEqual([0, 1, 2, 3, 4]);
    expect(wheelIndexFromUint32(5, 5)).toBe(0);
  });

  it("rejects the small biased tail for a caller to resample", () => {
    expect(wheelIndexFromUint32(5, 0xffff_ffff)).toBeNull();
  });

  it("rejects invalid counts and random values", () => {
    expect(() => wheelIndexFromUint32(0, 0)).toThrow(RangeError);
    expect(() => wheelIndexFromUint32(2, -1)).toThrow(RangeError);
    expect(() => wheelIndexFromUint32(2, 0x1_0000_0000)).toThrow(RangeError);
  });

  it("aligns the selected segment center with the top pointer after full turns", () => {
    expect(nextWheelRotation(0, 0, 5)).toBe(2124);
    expect(nextWheelRotation(2124, 2, 5)).toBe(4140);
  });
});
