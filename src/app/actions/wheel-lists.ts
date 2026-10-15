"use server";

import { revalidatePath } from "next/cache";

import { isUuid } from "@/modules/saved/saved-input";
import {
  normalizeWheelEntryMutations,
  persistedWheelEntries,
  type PersistedWheelEntry,
} from "@/modules/wheel/wheel-persistence";
import { requireAuthenticatedUserId } from "@/platform/auth/authenticated-user";
import { createServerSupabaseClient } from "@/platform/supabase/server";

type SaveWheelEntriesResult =
  | Readonly<{
      data: Readonly<{ entries: readonly PersistedWheelEntry[]; listId: string }>;
      status: "ok";
    }>
  | Readonly<{ status: "authentication-required" | "error" }>;

export async function saveWheelEntriesAction(input: {
  entries: unknown;
  listId: string | null;
}): Promise<SaveWheelEntriesResult> {
  const entries = normalizeWheelEntryMutations(input.entries);
  if (
    !entries ||
    (input.listId !== null && !isUuid(input.listId)) ||
    entries.some((entry) => entry.placeId !== null && !isUuid(entry.placeId))
  ) {
    return { status: "error" };
  }

  const supabase = await createServerSupabaseClient();
  const userResult = await supabase.auth.getUser();
  let userId: string;
  try {
    userId = requireAuthenticatedUserId(userResult);
  } catch {
    return { status: "authentication-required" };
  }

  let listId = input.listId;
  let createdList = false;

  if (listId) {
    const { data: ownedList, error } = await supabase
      .from("wheel_lists")
      .select("id")
      .eq("id", listId)
      .eq("profile_id", userId)
      .maybeSingle();
    if (error || !ownedList) {
      return { status: "error" };
    }
  } else {
    const { data: lastList, error: orderError } = await supabase
      .from("wheel_lists")
      .select("sort_position")
      .eq("profile_id", userId)
      .order("sort_position", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (orderError) {
      return { status: "error" };
    }

    const { data: created, error: createError } = await supabase
      .from("wheel_lists")
      .insert({
        name: "My wheel",
        profile_id: userId,
        sort_position: (lastList?.sort_position ?? -1) + 1,
      })
      .select("id")
      .single();
    if (createError) {
      return { status: "error" };
    }
    listId = created.id;
    createdList = true;
  }

  const { data, error } = await supabase.rpc("replace_wheel_entries", {
    p_entries: entries.map((entry) => ({
      entry_kind: entry.placeId ? "place" : "custom",
      label_snapshot: entry.label,
      place_id: entry.placeId,
    })),
    p_wheel_list_id: listId,
  });

  if (error) {
    if (createdList) {
      await supabase.from("wheel_lists").delete().eq("id", listId).eq("profile_id", userId);
    }
    return { status: "error" };
  }

  revalidatePath("/saved");
  revalidatePath("/wheel");
  return { data: { entries: persistedWheelEntries(data), listId }, status: "ok" };
}
