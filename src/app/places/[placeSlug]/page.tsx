import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PlaceProfileView } from "@/components/place-profile/place-profile-view";
import { distanceInKilometers, formatDistance } from "@/modules/discovery/distance";
import { findPlaceByProfileSlug, placeProfileSlug } from "@/modules/discovery/place-profile-path";
import { PROTOTYPE_PLACES, TAGUM_CITY_CENTER } from "@/modules/discovery/prototype-places";

type PlacePageProps = Readonly<{
  params: Promise<{ placeSlug: string }>;
}>;

export function generateStaticParams() {
  return PROTOTYPE_PLACES.map((place) => ({ placeSlug: placeProfileSlug(place) }));
}

export async function generateMetadata({ params }: PlacePageProps): Promise<Metadata> {
  const { placeSlug } = await params;
  const place = findPlaceByProfileSlug(PROTOTYPE_PLACES, placeSlug);

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
  const place = findPlaceByProfileSlug(PROTOTYPE_PLACES, placeSlug);

  if (!place) {
    notFound();
  }

  const distance = formatDistance(distanceInKilometers(TAGUM_CITY_CENTER, place.coordinates));

  return <PlaceProfileView distanceLabel={`${distance} from Tagum City center`} place={place} />;
}
