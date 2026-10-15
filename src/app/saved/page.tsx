import type { Metadata } from "next";

import { AccountSignIn } from "@/components/account/account-sign-in";
import { SavedPage } from "@/components/saved/saved-page";
import { getCatalogPlaces } from "@/modules/discovery/catalog";
import { buildSavedLibrary } from "@/modules/saved/saved-library";
import { createServerSupabaseClient } from "@/platform/supabase/server";

export const metadata: Metadata = {
  description: "Review saved food places and reusable wheel lists for Tagum City.",
  title: "Saved | Asa Ta Mangaon?",
};

export default async function SavedRoute() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return <AccountSignIn initialError={false} returnTo="/saved" />;
    }

    const [places, favoritesResult, listsResult, entriesResult] = await Promise.all([
      getCatalogPlaces(),
      supabase
        .from("favorites")
        .select("place_id, created_at")
        .eq("profile_id", userData.user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("wheel_lists")
        .select("id, name, sort_position")
        .eq("profile_id", userData.user.id)
        .order("sort_position", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase.from("wheel_entries").select("wheel_list_id, place_id, position"),
    ]);

    if (favoritesResult.error || listsResult.error || entriesResult.error) {
      return <SavedPage dataStatus="unavailable" initialPlaces={[]} initialWheelLists={[]} />;
    }

    const library = buildSavedLibrary(
      places,
      favoritesResult.data,
      listsResult.data,
      entriesResult.data,
    );
    return (
      <SavedPage
        dataStatus="ready"
        initialPlaces={library.places}
        initialWheelLists={library.wheelLists}
      />
    );
  } catch {
    return <SavedPage dataStatus="unavailable" initialPlaces={[]} initialWheelLists={[]} />;
  }
}
