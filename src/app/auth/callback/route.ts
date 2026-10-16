import { NextResponse } from "next/server";

import { evaluateAuthCallback, evaluateEmailOtpCallback } from "@/platform/auth/callback";
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
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const returnPath = safeAuthReturnPath(requestUrl.searchParams.get("next"));

  const supabase = await createServerSupabaseClient();
  const decision = tokenHash
    ? await evaluateEmailOtpCallback(tokenHash, type, (emailTokenHash) =>
        supabase.auth.verifyOtp({ token_hash: emailTokenHash, type: "email" }),
      )
    : await evaluateAuthCallback(code, (authorizationCode) =>
        supabase.auth.exchangeCodeForSession(authorizationCode),
      );

  if (decision.outcome === "invalid") {
    const failureDestination = new URL("/account", readAppOrigin());
    failureDestination.searchParams.set("error", "signin_failed");
    failureDestination.searchParams.set("returnTo", returnPath);
    return NextResponse.redirect(failureDestination, {
      status: 303,
      headers: privateResponseHeaders,
    });
  }

  const destination = new URL(returnPath, readAppOrigin());
  return NextResponse.redirect(destination, {
    status: 303,
    headers: privateResponseHeaders,
  });
}
