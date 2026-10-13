import { describe, expect, it, vi } from "vitest";

import { evaluateAuthCallback } from "./callback";

describe("evaluateAuthCallback", () => {
  it("rejects a callback without an authorization code", async () => {
    const exchangeCode = vi.fn();

    await expect(evaluateAuthCallback(null, exchangeCode)).resolves.toEqual({
      outcome: "invalid",
      reason: "missing-code",
    });
    expect(exchangeCode).not.toHaveBeenCalled();
  });

  it("accepts a code after the provider exchange succeeds", async () => {
    const exchangeCode = vi.fn().mockResolvedValue({ error: null });

    await expect(evaluateAuthCallback("one-time-code", exchangeCode)).resolves.toEqual({
      outcome: "success",
    });
    expect(exchangeCode).toHaveBeenCalledExactlyOnceWith("one-time-code");
  });

  it("returns a generic failure when the provider rejects the exchange", async () => {
    const providerError = new Error("provider details must not reach the response");
    const exchangeCode = vi.fn().mockResolvedValue({ error: providerError });

    await expect(evaluateAuthCallback("invalid-code", exchangeCode)).resolves.toEqual({
      outcome: "invalid",
      reason: "exchange-failed",
    });
  });

  it("returns the same generic failure when the exchange throws", async () => {
    const exchangeCode = vi.fn().mockRejectedValue(new Error("network details"));

    await expect(evaluateAuthCallback("expired-code", exchangeCode)).resolves.toEqual({
      outcome: "invalid",
      reason: "exchange-failed",
    });
  });
});
