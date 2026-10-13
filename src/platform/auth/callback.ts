export type AuthCodeExchange = (code: string) => Promise<{ error: unknown | null }>;

export type AuthCallbackDecision = Readonly<
  { outcome: "success" } | { outcome: "invalid"; reason: "missing-code" | "exchange-failed" }
>;

export async function evaluateAuthCallback(
  code: string | null,
  exchangeCode: AuthCodeExchange,
): Promise<AuthCallbackDecision> {
  if (!code) {
    return { outcome: "invalid", reason: "missing-code" };
  }

  try {
    const { error } = await exchangeCode(code);

    if (error) {
      return { outcome: "invalid", reason: "exchange-failed" };
    }

    return { outcome: "success" };
  } catch {
    return { outcome: "invalid", reason: "exchange-failed" };
  }
}
