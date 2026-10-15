import { DiscoveryShell } from "@/components/discovery/discovery-shell";
import { CatalogUnavailableError, getCatalogPlaces } from "@/modules/discovery/catalog";

export default async function DiscoveryPage() {
  try {
    const places = await getCatalogPlaces();
    return <DiscoveryShell catalogStatus="live" places={places} />;
  } catch (error) {
    if (error instanceof CatalogUnavailableError) {
      return <DiscoveryShell catalogStatus="unavailable" places={[]} />;
    }
    throw error;
  }
}
