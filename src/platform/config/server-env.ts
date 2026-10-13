import "server-only";

import { EnvironmentConfigurationError, readPublicSupabaseConfig } from "./public-env";

export type SupabaseAdminConfig = Readonly<{
  secretKey: string;
  url: string;
}>;

export function readSupabaseAdminConfig(): SupabaseAdminConfig {
  const { url } = readPublicSupabaseConfig();
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!secretKey) {
    throw new EnvironmentConfigurationError("SUPABASE_SERVICE_ROLE_KEY is required on the server.");
  }

  return { secretKey, url };
}
