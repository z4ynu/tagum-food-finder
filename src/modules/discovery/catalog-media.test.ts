import { describe, expect, it } from "vitest";

import type { PlaceMediaRow } from "./catalog-media";
import { placeMediaFromRow } from "./catalog-media";

const ROW: PlaceMediaRow = {
  alt_text: "Front of a cafe in Tagum City",
  attribution_text: "Photo by Example Creator",
  bucket_id: "place-media",
  height: 853,
  license_name: "CC BY 4.0",
  license_url: "https://creativecommons.org/licenses/by/4.0/",
  media_id: "11111111-1111-4111-8111-111111111111",
  media_type: "image/webp",
  object_path: "22222222-2222-4222-8222-222222222222/11111111-1111-4111-8111-111111111111.webp",
  place_id: "22222222-2222-4222-8222-222222222222",
  place_slug: "example-cafe",
  published_at: "2026-10-17T00:00:00.000Z",
  sort_order: 0,
  source_url: "https://example.com/photo",
  width: 1280,
};

describe("placeMediaFromRow", () => {
  it("maps public image and attribution fields", () => {
    expect(placeMediaFromRow(ROW, "https://project.supabase.co/storage/photo.webp")).toEqual({
      altText: "Front of a cafe in Tagum City",
      attributionText: "Photo by Example Creator",
      height: 853,
      licenseName: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      sourceUrl: "https://example.com/photo",
      url: "https://project.supabase.co/storage/photo.webp",
      width: 1280,
    });
  });

  it("rejects an incomplete public media row", () => {
    expect(placeMediaFromRow({ ...ROW, alt_text: null }, "https://example.com/photo.webp")).toBeNull();
  });
});
