import { describe, expect, it } from "vitest";

import { AuthenticationRequiredError, requireAuthenticatedUserId } from "./authenticated-user";

describe("requireAuthenticatedUserId", () => {
  it("returns the verified user identifier", () => {
    expect(
      requireAuthenticatedUserId({
        data: { user: { id: "user-123" } },
        error: null,
      }),
    ).toBe("user-123");
  });

  it("rejects a missing user", () => {
    expect(() =>
      requireAuthenticatedUserId({
        data: { user: null },
        error: null,
      }),
    ).toThrow(AuthenticationRequiredError);
  });

  it("rejects a failed trusted-user lookup", () => {
    expect(() =>
      requireAuthenticatedUserId({
        data: { user: null },
        error: new Error("provider details"),
      }),
    ).toThrow("Authentication is required.");
  });
});
