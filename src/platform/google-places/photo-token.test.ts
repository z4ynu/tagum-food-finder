import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createGooglePhotoToken, verifyGooglePhotoToken } from "./photo-token";

describe("Google photo proxy tokens", () => {
  it("round-trips a bounded, short-lived photo request", () => {
    const now = Date.parse("2026-10-17T08:00:00.000Z");
    const token = createGooglePhotoToken(
      "places/google-place/photos/photo-123",
      960,
      "server-secret",
      now,
    );
    expect(verifyGooglePhotoToken(token, "server-secret", now)).toEqual({
      expires: Math.floor(now / 1000) + 300,
      maxWidth: 960,
      photoName: "places/google-place/photos/photo-123",
    });
  });

  it("rejects tampered and expired tokens", () => {
    const now = Date.parse("2026-10-17T08:00:00.000Z");
    const token = createGooglePhotoToken(
      "places/google-place/photos/photo-123",
      960,
      "server-secret",
      now,
    );
    expect(verifyGooglePhotoToken(`${token}x`, "server-secret", now)).toBeNull();
    expect(verifyGooglePhotoToken(token, "server-secret", now + 301_000)).toBeNull();
  });
});
