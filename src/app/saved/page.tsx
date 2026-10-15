import type { Metadata } from "next";

import { SavedPage } from "@/components/saved/saved-page";
import { CatalogUnavailableError, getCatalogPlaces } from "@/modules/discovery/catalog";

export const metadata: Metadata = {
  description: "Review saved food places and reusable wheel lists for Tagum City.",
  title: "Saved | Asa Ta Mangaon?",
};

export default async function SavedRoute() {
  try {
    const places = await getCatalogPlaces();
    return <SavedPage catalogStatus="live" places={places} />;
  } catch (error) {
    if (error instanceof CatalogUnavailableError) {
      return <SavedPage catalogStatus="unavailable" places={[]} />;
    }
    throw error;
  }
}
