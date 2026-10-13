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

  it("does not claim final install icons before their design approval", () => {
    expect(manifest().icons).toBeUndefined();
  });
});
