export type PublicSupabaseConfig = Readonly<{
  publishableKey: string;
  url: string;
}>;

type PublicEnvironment = Readonly<{
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
}>;

export class EnvironmentConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvironmentConfigurationError";
  }
}

function requireValue(name: keyof PublicEnvironment, value: string | undefined): string {
  const normalized = value?.trim();

  if (!normalized) {
    throw new EnvironmentConfigurationError(`${name} is required.`);
  }

  return normalized;
}

function validateSupabaseUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new EnvironmentConfigurationError("NEXT_PUBLIC_SUPABASE_URL must be a valid URL.");
  }

  const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const isAllowedProtocol = url.protocol === "https:" || (url.protocol === "http:" && isLocal);

  if (!isAllowedProtocol || url.username || url.password) {
    throw new EnvironmentConfigurationError(
      "NEXT_PUBLIC_SUPABASE_URL must use HTTPS, except for an HTTP localhost URL.",
    );
  }

  return url.toString().replace(/\/$/, "");
}

function decodeJwtRole(value: string): string | undefined {
  const payload = value.split(".")[1];

  if (!payload) {
    return undefined;
  }

  try {
    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const parsed = JSON.parse(atob(base64)) as { role?: unknown };

    return typeof parsed.role === "string" ? parsed.role : undefined;
  } catch {
    return undefined;
  }
}

function validatePublishableKey(value: string): string {
  if (value.startsWith("sb_secret_") || decodeJwtRole(value) === "service_role") {
    throw new EnvironmentConfigurationError(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY cannot contain a server secret.",
    );
  }

  return value;
}

export function parsePublicSupabaseConfig(environment: PublicEnvironment): PublicSupabaseConfig {
  const url = requireValue("NEXT_PUBLIC_SUPABASE_URL", environment.NEXT_PUBLIC_SUPABASE_URL);
  const publishableKey = requireValue(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  return {
    publishableKey: validatePublishableKey(publishableKey),
    url: validateSupabaseUrl(url),
  };
}

export function readPublicSupabaseConfig(): PublicSupabaseConfig {
  return parsePublicSupabaseConfig({
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
}
