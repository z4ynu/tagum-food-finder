const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const jwtPattern = /\b[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;
const sensitiveAssignmentPattern =
  /\b(authorization|code|cookie|magic_link|password|secret|session|token)\s*[:=]\s*[^\s,;]+/gi;
const latitudePattern = /\b(lat|latitude)\s*[:=]\s*-?\d{1,2}(?:\.\d+)?/gi;
const longitudePattern = /\b(lng|lon|longitude)\s*[:=]\s*-?\d{1,3}(?:\.\d+)?/gi;
const urlPattern = /https?:\/\/[^\s)\]}>"']+/gi;

export type ErrorEventInput = Readonly<{
  environment: "local" | "production" | "staging";
  error: unknown;
  operation: string;
  release?: string;
  requestMethod?: string;
  routeTemplate?: string;
}>;

export type SafeErrorEvent = Readonly<{
  environment: ErrorEventInput["environment"];
  error: Readonly<{
    message: string;
    name: string;
    stack?: string;
  }>;
  operation: string;
  release?: string;
  request?: Readonly<{
    method?: string;
    route?: string;
  }>;
}>;

function scrubText(value: string): string {
  return value
    .replace(jwtPattern, "[redacted-token]")
    .replace(emailPattern, "[redacted-email]")
    .replace(urlPattern, "[redacted-url]")
    .replace(sensitiveAssignmentPattern, "$1=[redacted]")
    .replace(latitudePattern, "$1=[redacted-coordinate]")
    .replace(longitudePattern, "$1=[redacted-coordinate]")
    .slice(0, 2_000);
}

function normalizeError(error: unknown): SafeErrorEvent["error"] {
  if (!(error instanceof Error)) {
    return {
      message: "Non-Error exception captured.",
      name: "UnknownError",
    };
  }

  const stack = error.stack
    ?.split("\n")
    .slice(0, 20)
    .map((line) => scrubText(line))
    .join("\n");

  return {
    message: scrubText(error.message),
    name: scrubText(error.name).slice(0, 100),
    ...(stack ? { stack } : {}),
  };
}

function normalizeRouteTemplate(routeTemplate: string | undefined): string | undefined {
  if (!routeTemplate) {
    return undefined;
  }

  const path = routeTemplate.split(/[?#]/, 1)[0];

  return path.startsWith("/") ? scrubText(path).slice(0, 200) : undefined;
}

export function createSafeErrorEvent(input: ErrorEventInput): SafeErrorEvent {
  const method = input.requestMethod
    ?.toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 10);
  const route = normalizeRouteTemplate(input.routeTemplate);
  const request =
    method || route ? { ...(method ? { method } : {}), ...(route ? { route } : {}) } : {};

  return {
    environment: input.environment,
    error: normalizeError(input.error),
    operation: input.operation.replace(/[^a-z0-9_.-]/gi, "_").slice(0, 100),
    ...(input.release ? { release: input.release.slice(0, 100) } : {}),
    ...(Object.keys(request).length > 0 ? { request } : {}),
  };
}
