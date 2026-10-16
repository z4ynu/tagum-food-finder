import type { Database } from "@/platform/supabase/database.types";

import type { PlaceMedia } from "./model";

export type PlaceMediaRow = Database["public"]["Views"]["place_media"]["Row"];

export function placeMediaFromRow(row: PlaceMediaRow, publicUrl: string): PlaceMedia | null {
  if (
    !row.alt_text ||
    !row.media_id ||
    !row.object_path ||
    !row.place_id ||
    !row.width ||
    !row.height ||
    !publicUrl.startsWith("http")
  ) {
    return null;
  }

  return {
    altText: row.alt_text,
    attributionText: row.attribution_text,
    height: row.height,
    licenseName: row.license_name,
    licenseUrl: row.license_url,
    sourceUrl: row.source_url,
    url: publicUrl,
    width: row.width,
  };
}
