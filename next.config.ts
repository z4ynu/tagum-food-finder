import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
        source: "/sw.js",
      },
    ];
  },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
