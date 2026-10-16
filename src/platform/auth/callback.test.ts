import { describe, expect, it, vi } from "vitest";

import { evaluateAuthCallback, evaluateEmailOtpCallback } from "./callback";

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

describe("evaluateEmailOtpCallback", () => {
  it("accepts an email token hash after verification succeeds", async () => {
    const verifyEmailOtp = vi.fn().mockResolvedValue({ error: null });

    await expect(
      evaluateEmailOtpCallback("one-time-token-hash", "email", verifyEmailOtp),
    ).resolves.toEqual({ outcome: "success" });
    expect(verifyEmailOtp).toHaveBeenCalledExactlyOnceWith("one-time-token-hash");
  });

  it("rejects missing or unsupported email verification parameters", async () => {
    const verifyEmailOtp = vi.fn();

    await expect(evaluateEmailOtpCallback(null, "email", verifyEmailOtp)).resolves.toEqual({
      outcome: "invalid",
      reason: "missing-code",
    });
    await expect(
      evaluateEmailOtpCallback("one-time-token-hash", "recovery", verifyEmailOtp),
    ).resolves.toEqual({ outcome: "invalid", reason: "missing-code" });
    expect(verifyEmailOtp).not.toHaveBeenCalled();
  });

  it("returns a generic failure when token verification fails", async () => {
    const verifyEmailOtp = vi.fn().mockResolvedValue({ error: new Error("provider details") });

    await expect(
      evaluateEmailOtpCallback("expired-token-hash", "email", verifyEmailOtp),
    ).resolves.toEqual({ outcome: "invalid", reason: "exchange-failed" });
  });
});
