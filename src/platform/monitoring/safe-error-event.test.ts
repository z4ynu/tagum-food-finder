import { describe, expect, it } from "vitest";

import { createSafeErrorEvent } from "./safe-error-event";

describe("createSafeErrorEvent", () => {
  it("keeps only structured diagnostic context", () => {
    const event = createSafeErrorEvent({
      environment: "staging",
      error: new Error("Database unavailable"),
      operation: "catalog.nearby",
      release: "abc123",
      requestMethod: "get",
      routeTemplate: "/api/places/[placeId]?email=person@example.com",
    });

    expect(event).toMatchObject({
      environment: "staging",
      error: { message: "Database unavailable", name: "Error" },
      operation: "catalog.nearby",
      release: "abc123",
      request: { method: "GET", route: "/api/places/[placeId]" },
    });
    expect(event).not.toHaveProperty("body");
  });

  it("redacts tokens, emails, URLs, and precise coordinates", () => {
    const token = "abcdefghij.klmnopqrst.uvwxyzABCD";
    const event = createSafeErrorEvent({
      environment: "production",
      error: new Error(
        `Failed for person@example.com at https://example.com/private/evidence.jpg?token=x token=${token} latitude=7.4477 longitude=125.8078`,
      ),
      operation: "community.evidence",
    });

    expect(event.error.message).toContain("[redacted-email]");
    expect(event.error.message).toContain("[redacted-url]");
    expect(event.error.message).toContain("token=[redacted]");
    expect(event.error.message).toContain("latitude=[redacted-coordinate]");
    expect(event.error.message).toContain("longitude=[redacted-coordinate]");
    expect(event.error.message).not.toContain("person@example.com");
    expect(event.error.message).not.toContain("7.4477");
    expect(event.error.message).not.toContain("125.8078");
  });

  it("does not serialize arbitrary thrown values", () => {
    const event = createSafeErrorEvent({
      environment: "local",
      error: { password: "secret", submission: "private text" },
      operation: "unknown failure",
    });

    expect(event.error).toEqual({
      message: "Non-Error exception captured.",
      name: "UnknownError",
    });
    expect(event.operation).toBe("unknown_failure");
  });
});
