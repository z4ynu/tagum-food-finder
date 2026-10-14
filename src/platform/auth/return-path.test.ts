import { describe, expect, it } from "vitest";

import { safeAuthReturnPath } from "./return-path";

describe("safeAuthReturnPath", () => {
  it.each([
    [null, "/"],
    [undefined, "/"],
    ["/", "/"],
    ["/wheel?place=tagum-pie", "/wheel?place=tagum-pie"],
    ["/places/the-turq-cafe#location", "/places/the-turq-cafe#location"],
  ])("maps %s to %s", (input, expected) => {
    expect(safeAuthReturnPath(input)).toBe(expected);
  });

  it.each([
    "https://example.com",
    "//example.com/path",
    "/account",
    "/auth/callback",
    "/admin",
    "wheel",
  ])("rejects unsafe or unapproved destination %s", (input) => {
    expect(safeAuthReturnPath(input)).toBe("/");
  });
});
