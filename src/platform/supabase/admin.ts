import "server-only";

import { createClient } from "@supabase/supabase-js";

import { readSupabaseAdminConfig } from "@/platform/config/server-env";
import type { Database } from "@/platform/supabase/database.types";

export function createSupabaseAdminClient() {
  const { secretKey, url } = readSupabaseAdminConfig();

  return createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
