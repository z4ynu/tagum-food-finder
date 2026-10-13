import "server-only";

import { createClient } from "@supabase/supabase-js";

import { readSupabaseAdminConfig } from "@/platform/config/server-env";

export function createSupabaseAdminClient() {
  const { secretKey, url } = readSupabaseAdminConfig();

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
