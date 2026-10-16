import { describe, expect, it } from "vitest";

import nextConfig from "../../../next.config";

describe("private-beta response headers", () => {
  it("prevents standards-compliant crawlers from indexing app responses", async () => {
    const routes = await nextConfig.headers?.();
    const applicationRoute = routes?.find((route) => route.source === "/(.*)");

    expect(applicationRoute?.headers).toContainEqual({
      key: "X-Robots-Tag",
      value: "noindex, nofollow, noarchive",
    });
  });
});
