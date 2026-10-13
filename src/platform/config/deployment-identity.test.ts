import { describe, expect, it } from "vitest";

import { parseDeploymentIdentity } from "./deployment-identity";

describe("parseDeploymentIdentity", () => {
  it("accepts an explicit local identity", () => {
    expect(
      parseDeploymentIdentity({
        APP_ENVIRONMENT: "local",
        SUPABASE_PROJECT_REF: "local",
        supabaseUrl: "http://127.0.0.1:54321",
      }),
    ).toEqual({ environment: "local", supabaseProjectRef: "local" });
  });

  it("accepts a hosted environment whose URL matches its project reference", () => {
    const projectRef = "abcdefghijklmnopqrst";

    expect(
      parseDeploymentIdentity({
        APP_ENVIRONMENT: "staging",
        SUPABASE_PROJECT_REF: projectRef,
        supabaseUrl: `https://${projectRef}.supabase.co`,
      }),
    ).toEqual({ environment: "staging", supabaseProjectRef: projectRef });
  });

  it("rejects an unknown application environment", () => {
    expect(() =>
      parseDeploymentIdentity({
        APP_ENVIRONMENT: "preview",
        SUPABASE_PROJECT_REF: "local",
        supabaseUrl: "http://localhost:54321",
      }),
    ).toThrow("APP_ENVIRONMENT must be local, staging, or production");
  });

  it("rejects a hosted URL that does not match the declared project", () => {
    expect(() =>
      parseDeploymentIdentity({
        APP_ENVIRONMENT: "production",
        SUPABASE_PROJECT_REF: "abcdefghijklmnopqrst",
        supabaseUrl: "https://zyxwvutsrqponmlkjihg.supabase.co",
      }),
    ).toThrow("does not match NEXT_PUBLIC_SUPABASE_URL");
  });

  it("rejects a hosted project in the local environment", () => {
    expect(() =>
      parseDeploymentIdentity({
        APP_ENVIRONMENT: "local",
        SUPABASE_PROJECT_REF: "abcdefghijklmnopqrst",
        supabaseUrl: "https://abcdefghijklmnopqrst.supabase.co",
      }),
    ).toThrow("local environment must use a localhost Supabase URL");
  });
});
