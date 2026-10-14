import { describe, expect, it } from "vitest";

import { accountEmailLabel, accountProviderLabel } from "./account-identity";

describe("accountProviderLabel", () => {
  it.each([
    ["google", "Google"],
    ["facebook", "Facebook"],
    ["email", "Personal email"],
    ["unknown", "Personal email"],
    [null, "Personal email"],
  ])("maps %s to %s", (provider, expected) => {
    expect(accountProviderLabel(provider)).toBe(expected);
  });
});

describe("accountEmailLabel", () => {
  it("trims a verified account email", () => {
    expect(accountEmailLabel("  juan@example.com ")).toBe("juan@example.com");
  });

  it.each([null, undefined, "", "   "])("uses a safe fallback for %s", (email) => {
    expect(accountEmailLabel(email)).toBe("Email unavailable");
  });
});
