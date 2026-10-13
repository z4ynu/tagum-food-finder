import { NextResponse } from "next/server";

import { evaluateAuthCallback } from "@/platform/auth/callback";
import { readAppOrigin } from "@/platform/config/app-origin";
import { createServerSupabaseClient } from "@/platform/supabase/server";

const privateResponseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
} as const;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

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

  const destination = new URL("/", readAppOrigin());
  return NextResponse.redirect(destination, {
    status: 303,
    headers: privateResponseHeaders,
  });
}
