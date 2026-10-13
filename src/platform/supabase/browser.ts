"use client";

import { createBrowserClient } from "@supabase/ssr";

import { readPublicSupabaseConfig } from "@/platform/config/public-env";

export function createBrowserSupabaseClient() {
  const { publishableKey, url } = readPublicSupabaseConfig();

  return createBrowserClient(url, publishableKey);
}
