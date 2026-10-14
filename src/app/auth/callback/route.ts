import { NextResponse } from "next/server";

import { evaluateAuthCallback } from "@/platform/auth/callback";
import { safeAuthReturnPath } from "@/platform/auth/return-path";
import { readAppOrigin } from "@/platform/config/app-origin";
import { createServerSupabaseClient } from "@/platform/supabase/server";

const privateResponseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
} as const;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const returnPath = safeAuthReturnPath(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.json(
      { error: "invalid_auth_callback" },
      { status: 400, headers: privateResponseHeaders },
    );
  }

  const supabase = await createServerSupabaseClient();
  const decision = await evaluateAuthCallback(code, (authorizationCode) =>
    supabase.auth.exchangeCodeForSession(authorizationCode),
  );

  if (decision.outcome === "invalid") {
    return NextResponse.json(
      { error: "invalid_auth_callback" },
      { status: 400, headers: privateResponseHeaders },
    );
  }

  const destination = new URL(returnPath, readAppOrigin());
  return NextResponse.redirect(destination, {
    status: 303,
    headers: privateResponseHeaders,
  });
}
