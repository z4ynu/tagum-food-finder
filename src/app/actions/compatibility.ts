"use server";

import { requireAuthenticatedUserId } from "@/platform/auth/authenticated-user";
import { createServerSupabaseClient } from "@/platform/supabase/server";

export async function runProtectedCompatibilityProbe(): Promise<{ authenticated: true }> {
  const supabase = await createServerSupabaseClient();
  const userResult = await supabase.auth.getUser();
  requireAuthenticatedUserId(userResult);

  return { authenticated: true };
}
