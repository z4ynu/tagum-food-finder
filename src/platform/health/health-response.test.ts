import { describe, expect, it } from "vitest";

import { createHealthResponse } from "./health-response";

describe("createHealthResponse", () => {
  it("returns a stable service health payload", () => {
    expect(createHealthResponse()).toEqual({
      service: "tagum-food-finder",
      status: "ok",
    });
  });
});
