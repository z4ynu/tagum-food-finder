import { describe, expect, it } from "vitest";

import {
  CORRECTION_ISSUES,
  correctionRequiresEvidence,
  evidenceFileError,
  findCorrectionIssue,
} from "./correction-options";

describe("community correction options", () => {
  it("keeps every approved issue key unique", () => {
    const keys = CORRECTION_ISSUES.map((issue) => issue.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it.each(["price_menu", "opening_hours", "temporary_closure", "moved_location", "photo_menu"])(
    "requires evidence for %s",
    (key) => {
      expect(correctionRequiresEvidence(key as never)).toBe(true);
    },
  );

  it("keeps cuisine and occasion evidence optional", () => {
    expect(correctionRequiresEvidence("food_cuisine")).toBe(false);
    expect(correctionRequiresEvidence("occasion")).toBe(false);
  });

  it("finds a supported issue and rejects a missing selection", () => {
    expect(findCorrectionIssue("contact_information")?.label).toBe("Contact information");
    expect(findCorrectionIssue(null)).toBeNull();
  });
});

describe("evidence file validation", () => {
  it("accepts supported image metadata at the size limit", () => {
    expect(
      evidenceFileError({ name: "menu.webp", size: 5 * 1024 * 1024, type: "image/webp" }),
    ).toBeNull();
  });

  it("rejects unsupported files", () => {
    expect(evidenceFileError({ name: "menu.pdf", size: 1200, type: "application/pdf" })).toBe(
      "menu.pdf must be a JPEG, PNG, or WebP image.",
    );
  });

  it("rejects images larger than 5 MB", () => {
    expect(
      evidenceFileError({ name: "large.jpg", size: 5 * 1024 * 1024 + 1, type: "image/jpeg" }),
    ).toBe("large.jpg is larger than 5 MB.");
  });
});
