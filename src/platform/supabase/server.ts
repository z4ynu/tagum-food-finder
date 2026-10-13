import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { readPublicSupabaseConfig } from "@/platform/config/public-env";
import { assertServerDeploymentIdentity } from "@/platform/config/server-env";

export async function createServerSupabaseClient() {
  const { publishableKey, url } = readPublicSupabaseConfig();
  assertServerDeploymentIdentity();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, options, value } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies; the auth proxy performs refresh writes.
        }
      },
    },
  });
}
