import { describe, expect, it } from "vitest";

import robots from "./robots";

describe("robots metadata", () => {
  it("keeps the private beta out of search indexes", () => {
    expect(robots()).toEqual({
      rules: {
        disallow: "/",
        userAgent: "*",
      },
    });
  });
});
