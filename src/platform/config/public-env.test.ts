import { describe, expect, it } from "vitest";

import { EnvironmentConfigurationError, parsePublicSupabaseConfig } from "./public-env";

function encodePayload(payload: object): string {
  return btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

describe("parsePublicSupabaseConfig", () => {
  it("accepts an HTTPS project URL and publishable key", () => {
    expect(
      parsePublicSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co/",
      }),
    ).toEqual({
      publishableKey: "sb_publishable_example",
      url: "https://example.supabase.co",
    });
  });

  it("allows HTTP only for local development", () => {
    expect(
      parsePublicSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local-anon-key",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      }).url,
    ).toBe("http://127.0.0.1:54321");

    expect(() =>
      parsePublicSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
        NEXT_PUBLIC_SUPABASE_URL: "http://example.supabase.co",
      }),
    ).toThrow(EnvironmentConfigurationError);
  });

  it("reports missing variables without printing their values", () => {
    expect(() => parsePublicSupabaseConfig({})).toThrow("NEXT_PUBLIC_SUPABASE_URL is required.");
  });

  it("rejects a new-format server secret in a public variable", () => {
    expect(() =>
      parsePublicSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_do-not-expose",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      }),
    ).toThrow("cannot contain a server secret");
  });

  it("rejects a legacy service-role JWT in a public variable", () => {
    const serviceRoleJwt = `header.${encodePayload({ role: "service_role" })}.signature`;

    expect(() =>
      parsePublicSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: serviceRoleJwt,
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      }),
    ).toThrow("cannot contain a server secret");
  });
});
