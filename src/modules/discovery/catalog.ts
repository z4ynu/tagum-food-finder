import "server-only";

import { cache } from "react";

import { createServerSupabaseClient } from "@/platform/supabase/server";

import { placeMediaFromRow, type PlaceMediaRow } from "./catalog-media";
import { discoveryPlaceFromRow } from "./catalog-place";
import type { DiscoveryPlace, PlaceMedia } from "./model";

const PAGE_SIZE = 500;

export class CatalogUnavailableError extends Error {
  constructor() {
    super("The public place catalog is temporarily unavailable.");
    this.name = "CatalogUnavailableError";
  }
}

type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

function publicMediaFromRow(supabase: ServerSupabaseClient, row: PlaceMediaRow): PlaceMedia | null {
  if (!row.object_path) {
    return null;
  }

  const { data } = supabase.storage.from("place-media").getPublicUrl(row.object_path);
  return placeMediaFromRow(row, data.publicUrl);
}

async function getPrimaryMediaByPlace(supabase: ServerSupabaseClient) {
  const mediaByPlace = new Map<string, PlaceMedia>();

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("place_media")
      .select("*")
      .order("sort_order", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      return new Map<string, PlaceMedia>();
    }

    for (const row of data) {
      if (!row.place_id || mediaByPlace.has(row.place_id)) {
        continue;
      }

      const media = publicMediaFromRow(supabase, row);
      if (media) {
        mediaByPlace.set(row.place_id, media);
      }
    }

    if (data.length < PAGE_SIZE) {
      return mediaByPlace;
    }
  }
}

export const getCatalogPlaces = cache(async (): Promise<readonly DiscoveryPlace[]> => {
  const supabase = await createServerSupabaseClient();
  const places: DiscoveryPlace[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("place_discovery")
      .select("*")
      .order("canonical_name", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw new CatalogUnavailableError();
    }

    places.push(...data.map(discoveryPlaceFromRow));
    if (data.length < PAGE_SIZE) {
      const mediaByPlace = await getPrimaryMediaByPlace(supabase);
      return places.map((place) => ({ ...place, media: mediaByPlace.get(place.id) ?? null }));
    }
  }
});

export const getCatalogPlaceBySlug = cache(
  async (placeSlug: string): Promise<DiscoveryPlace | null> => {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("place_discovery")
      .select("*")
      .eq("place_slug", placeSlug)
      .maybeSingle();

    if (error) {
      throw new CatalogUnavailableError();
    }

    if (!data) {
      return null;
    }

    const place = discoveryPlaceFromRow(data);
    const { data: mediaRows, error: mediaError } = await supabase
      .from("place_media")
      .select("*")
      .eq("place_slug", placeSlug)
      .order("sort_order", { ascending: true })
      .limit(1);

    if (mediaError || !mediaRows[0]) {
      return { ...place, media: null };
    }

    return { ...place, media: publicMediaFromRow(supabase, mediaRows[0]) };
  },
);
