const ALLOWED_EXACT_PATHS = new Set(["/", "/wheel"]);

export function safeAuthReturnPath(value: string | null | undefined): string {
  const candidate = value?.trim();

  if (!candidate?.startsWith("/") || candidate.startsWith("//")) {
    return "/";
  }

  let parsed: URL;

  try {
    parsed = new URL(candidate, "https://return.invalid");
  } catch {
    return "/";
  }

  const isAllowedPath =
    ALLOWED_EXACT_PATHS.has(parsed.pathname) || parsed.pathname.startsWith("/places/");

  if (parsed.origin !== "https://return.invalid" || !isAllowedPath) {
    return "/";
  }

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
