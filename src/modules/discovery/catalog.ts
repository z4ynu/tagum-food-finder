import "server-only";

import { cache } from "react";

import { createServerSupabaseClient } from "@/platform/supabase/server";

import { discoveryPlaceFromRow } from "./catalog-place";
import type { DiscoveryPlace } from "./model";

const PAGE_SIZE = 500;

export class CatalogUnavailableError extends Error {
  constructor() {
    super("The public place catalog is temporarily unavailable.");
    this.name = "CatalogUnavailableError";
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
      return places;
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

    return data ? discoveryPlaceFromRow(data) : null;
  },
);
