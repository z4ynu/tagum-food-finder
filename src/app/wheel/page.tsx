import type { Metadata } from "next";

import { WheelPage } from "@/components/wheel/wheel-page";
import { CatalogUnavailableError, getCatalogPlaces } from "@/modules/discovery/catalog";

export const metadata: Metadata = {
  description: "Add food places and let an equal-chance wheel choose where to eat in Tagum.",
  title: "Spin the wheel | Asa Ta Mangaon?",
};

export default async function WheelRoute() {
  try {
    const places = await getCatalogPlaces();
    return <WheelPage catalogStatus="live" places={places} />;
  } catch (error) {
    if (error instanceof CatalogUnavailableError) {
      return <WheelPage catalogStatus="unavailable" places={[]} />;
    }
    throw error;
  }
}
