import { describe, expect, it } from "vitest";

import { EnvironmentConfigurationError } from "./public-env";
import { parseAppOrigin } from "./app-origin";

describe("parseAppOrigin", () => {
  it("accepts an HTTPS deployment origin", () => {
    expect(parseAppOrigin("https://asa-ta-mangaon.example")).toBe("https://asa-ta-mangaon.example");
  });

  it("accepts HTTP only for a local origin", () => {
    expect(parseAppOrigin("http://127.0.0.1:3000")).toBe("http://127.0.0.1:3000");
  });

  it.each([
    undefined,
    "http://asa-ta-mangaon.example",
    "https://user:password@asa-ta-mangaon.example",
    "https://asa-ta-mangaon.example/callback",
    "https://asa-ta-mangaon.example?next=elsewhere",
  ])("rejects an unsafe or non-origin value: %s", (value) => {
    expect(() => parseAppOrigin(value)).toThrow(EnvironmentConfigurationError);
  });
});
