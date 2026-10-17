import { describe, expect, it } from "vitest";

import { applyInMemoryRateLimit, requestClientKey } from "./request-rate-limit";

describe("applyInMemoryRateLimit", () => {
  it("blocks requests beyond the per-window limit and resets afterward", () => {
    const key = "test-rate-limit-window";
    expect(applyInMemoryRateLimit(key, 2, 1_000, 10_000).allowed).toBe(true);
    expect(applyInMemoryRateLimit(key, 2, 1_000, 10_100).allowed).toBe(true);
    expect(applyInMemoryRateLimit(key, 2, 1_000, 10_200)).toMatchObject({ allowed: false });
    expect(applyInMemoryRateLimit(key, 2, 1_000, 11_001).allowed).toBe(true);
  });
});

describe("requestClientKey", () => {
  it("uses the first forwarded address when no direct address is present", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.1, 198.51.100.2" },
    });
    expect(requestClientKey(request)).toBe("203.0.113.1");
  });
});
