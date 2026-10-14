import { describe, expect, it } from "vitest";

import manifest from "./manifest";

describe("web app manifest", () => {
  it("uses the approved identity and standalone launch behavior", () => {
    expect(manifest()).toMatchObject({
      display: "standalone",
      name: "Asa Ta Mangaon?",
      scope: "/",
      short_name: "Asa Ta Mangaon?",
      start_url: "/",
      theme_color: "#2E7D32",
    });
  });

  it("publishes the approved mascot install icons", () => {
    expect(manifest().icons).toEqual([
      {
        purpose: "any",
        sizes: "192x192",
        src: "/brand/icon-192.png",
        type: "image/png",
      },
      {
        purpose: "maskable",
        sizes: "512x512",
        src: "/brand/icon-512.png",
        type: "image/png",
      },
    ]);
  });
});
