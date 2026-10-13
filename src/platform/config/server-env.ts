import "server-only";

import { parseDeploymentIdentity } from "./deployment-identity";
import { EnvironmentConfigurationError, readPublicSupabaseConfig } from "./public-env";

export type SupabaseAdminConfig = Readonly<{
  secretKey: string;
  url: string;
}>;

export function assertServerDeploymentIdentity() {
  const { url } = readPublicSupabaseConfig();

  return parseDeploymentIdentity({
    APP_ENVIRONMENT: process.env.APP_ENVIRONMENT,
    SUPABASE_PROJECT_REF: process.env.SUPABASE_PROJECT_REF,
    supabaseUrl: url,
  });
}

export function readSupabaseAdminConfig(): SupabaseAdminConfig {
  const { url } = readPublicSupabaseConfig();
  assertServerDeploymentIdentity();
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!secretKey) {
    throw new EnvironmentConfigurationError("SUPABASE_SERVICE_ROLE_KEY is required on the server.");
  }

  return { secretKey, url };
}
