import { EnvironmentConfigurationError } from "./public-env";

export function parseAppOrigin(value: string | undefined): string {
  const normalized = value?.trim();

  if (!normalized) {
    throw new EnvironmentConfigurationError("APP_ORIGIN is required on the server.");
  }

  let url: URL;

  try {
    url = new URL(normalized);
  } catch {
    throw new EnvironmentConfigurationError("APP_ORIGIN must be a valid URL origin.");
  }

  const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const isAllowedProtocol = url.protocol === "https:" || (url.protocol === "http:" && isLocal);
  const isOriginOnly = url.pathname === "/" && !url.search && !url.hash;

  if (!isAllowedProtocol || url.username || url.password || !isOriginOnly) {
    throw new EnvironmentConfigurationError(
      "APP_ORIGIN must be an HTTPS origin, except for an HTTP localhost origin.",
    );
  }

  return url.origin;
}

export function readAppOrigin(): string {
  return parseAppOrigin(process.env.APP_ORIGIN);
}
