"use client";

import { createBrowserClient } from "@supabase/ssr";

import { readPublicSupabaseConfig } from "@/platform/config/public-env";
import type { Database } from "@/platform/supabase/database.types";

export function createBrowserSupabaseClient() {
  const { publishableKey, url } = readPublicSupabaseConfig();

  return createBrowserClient<Database>(url, publishableKey);
}
