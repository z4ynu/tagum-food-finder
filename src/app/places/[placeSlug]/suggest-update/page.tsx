import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AccountSignIn } from "@/components/account/account-sign-in";
import { SuggestUpdateFlow } from "@/components/community-corrections/suggest-update-flow";
import { findPlaceByProfileSlug } from "@/modules/discovery/place-profile-path";
import { PROTOTYPE_PLACES } from "@/modules/discovery/prototype-places";
import { createServerSupabaseClient } from "@/platform/supabase/server";

export const metadata: Metadata = {
  description: "Suggest a correction to a Tagum food place for private review.",
  title: "Suggest an update | Asa Ta Mangaon?",
};

type SuggestUpdatePageProps = Readonly<{
  params: Promise<{ placeSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function hasAuthenticatedUser() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    return !error && Boolean(data.user);
  } catch {
    return false;
  }
}

export default async function SuggestUpdatePage({ params, searchParams }: SuggestUpdatePageProps) {
  const [{ placeSlug }, parameters] = await Promise.all([params, searchParams]);
  const place = findPlaceByProfileSlug(PROTOTYPE_PLACES, placeSlug);

  if (!place) {
    notFound();
  }

  const previewSignedIn =
    process.env.NODE_ENV !== "production" && firstValue(parameters.preview) === "signed-in";
  const returnTo = `/places/${placeSlug}/suggest-update`;
  const authenticated = previewSignedIn || (await hasAuthenticatedUser());

  if (!authenticated) {
    return <AccountSignIn initialError={false} returnTo={returnTo} />;
  }

  return <SuggestUpdateFlow place={place} preview={previewSignedIn} />;
}
