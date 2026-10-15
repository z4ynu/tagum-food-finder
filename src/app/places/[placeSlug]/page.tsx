import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PlaceProfileView } from "@/components/place-profile/place-profile-view";
import { getCatalogPlaceBySlug } from "@/modules/discovery/catalog";
import { distanceInKilometers, formatDistance } from "@/modules/discovery/distance";
import { TAGUM_CITY_CENTER } from "@/modules/discovery/prototype-places";
import { createServerSupabaseClient } from "@/platform/supabase/server";

type PlacePageProps = Readonly<{
  params: Promise<{ placeSlug: string }>;
}>;

export async function generateMetadata({ params }: PlacePageProps): Promise<Metadata> {
  const { placeSlug } = await params;
  const place = await getCatalogPlaceBySlug(placeSlug);

  if (!place) {
    return { title: "Place not found | Asa Ta Mangaon?" };
  }

  return {
    description: `${place.category} in Tagum City. View available place details and directions.`,
    title: `${place.name} | Asa Ta Mangaon?`,
  };
}

export default async function PlacePage({ params }: PlacePageProps) {
  const { placeSlug } = await params;
  const place = await getCatalogPlaceBySlug(placeSlug);

  if (!place) {
    notFound();
  }

  const distance = formatDistance(distanceInKilometers(TAGUM_CITY_CENTER, place.coordinates));
  let initiallySaved = false;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data: favorite } = await supabase
        .from("favorites")
        .select("place_id")
        .eq("profile_id", userData.user.id)
        .eq("place_id", place.id)
        .maybeSingle();
      initiallySaved = Boolean(favorite);
    }
  } catch {
    initiallySaved = false;
  }

  return (
    <PlaceProfileView
      distanceLabel={`${distance} from Tagum City center`}
      initiallySaved={initiallySaved}
      place={place}
    />
  );
}
