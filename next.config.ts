import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

function placeMediaRemotePatterns() {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!configuredUrl) {
    return [];
  }

  try {
    const pattern = new URL(configuredUrl);
    pattern.pathname = "/storage/v1/object/public/place-media/**";
    pattern.search = "";
    return [pattern];
  } catch {
    return [];
  }
}

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.openfreemap.org",
  "font-src 'self' data: https://*.openfreemap.org",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.openfreemap.org",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const applicationSecurityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), browsing-topics=()",
  },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
] as const;

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        headers: [...applicationSecurityHeaders],
        source: "/(.*)",
      },
      {
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'; object-src 'none'",
          },
        ],
        source: "/sw.js",
      },
    ];
  },
  images: {
    remotePatterns: placeMediaRemotePatterns(),
  },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
