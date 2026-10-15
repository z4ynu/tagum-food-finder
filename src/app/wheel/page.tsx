import type { Metadata } from "next";

import { WheelPage } from "@/components/wheel/wheel-page";
import { CatalogUnavailableError, getCatalogPlaces } from "@/modules/discovery/catalog";
import type { DiscoveryPlace } from "@/modules/discovery/model";
import { isUuid } from "@/modules/saved/saved-input";
import {
  persistedWheelEntries,
  wheelEntriesFromPersistence,
} from "@/modules/wheel/wheel-persistence";
import { createServerSupabaseClient } from "@/platform/supabase/server";

export const metadata: Metadata = {
  description: "Add food places and let an equal-chance wheel choose where to eat in Tagum.",
  title: "Spin the wheel | Asa Ta Mangaon?",
};

type WheelRouteProps = Readonly<{
  searchParams: Promise<{ list?: string | string[] }>;
}>;

export default async function WheelRoute({ searchParams }: WheelRouteProps) {
  let catalogStatus: "live" | "unavailable" = "live";
  let places: readonly DiscoveryPlace[] = [];
  try {
    places = await getCatalogPlaces();
  } catch (error) {
    if (error instanceof CatalogUnavailableError) {
      catalogStatus = "unavailable";
    } else {
      throw error;
    }
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { list: listParam } = await searchParams;
      const requestedListId = Array.isArray(listParam) ? listParam[0] : listParam;
      const { data: lists, error: listsError } = await supabase
        .from("wheel_lists")
        .select("id, name")
        .eq("profile_id", userData.user.id)
        .order("sort_position", { ascending: true })
        .order("created_at", { ascending: true });

      if (listsError) {
        return (
          <WheelPage
            catalogStatus={catalogStatus}
            initialEntries={[]}
            persistence={{
              dataStatus: "unavailable",
              listId: null,
              listName: null,
              mode: "account",
            }}
            places={places}
          />
        );
      }

      const selectedList =
        (requestedListId && isUuid(requestedListId)
          ? lists.find((list) => list.id === requestedListId)
          : null) ??
        lists[0] ??
        null;
      const entriesResult = selectedList
        ? await supabase
            .from("wheel_entries")
            .select("id, label_snapshot, place_id")
            .eq("wheel_list_id", selectedList.id)
            .order("position", { ascending: true })
        : { data: [], error: null };

      if (entriesResult.error) {
        return (
          <WheelPage
            catalogStatus={catalogStatus}
            initialEntries={[]}
            persistence={{
              dataStatus: "unavailable",
              listId: selectedList?.id ?? null,
              listName: selectedList?.name ?? null,
              mode: "account",
            }}
            places={places}
          />
        );
      }

      return (
        <WheelPage
          catalogStatus={catalogStatus}
          initialEntries={wheelEntriesFromPersistence(
            persistedWheelEntries(entriesResult.data),
            places,
          )}
          persistence={{
            dataStatus: "ready",
            listId: selectedList?.id ?? null,
            listName: selectedList?.name ?? null,
            mode: "account",
          }}
          places={places}
        />
      );
    }
  } catch {
    return (
      <WheelPage
        catalogStatus={catalogStatus}
        initialEntries={[]}
        persistence={{ dataStatus: "unavailable", listId: null, listName: null, mode: "account" }}
        places={places}
      />
    );
  }

  return (
    <WheelPage
      catalogStatus={catalogStatus}
      initialEntries={[]}
      persistence={{ mode: "local" }}
      places={places}
    />
  );
}
