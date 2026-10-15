"use server";

import { revalidatePath } from "next/cache";

import { isPlaceSlug, isUuid, normalizeWheelListName } from "@/modules/saved/saved-input";
import { requireAuthenticatedUserId } from "@/platform/auth/authenticated-user";
import { createServerSupabaseClient } from "@/platform/supabase/server";

type ActionResult<T = undefined> =
  | Readonly<{ data: T; status: "ok" }>
  | Readonly<{ status: "authentication-required" | "error" }>;

async function authenticatedContext() {
  const supabase = await createServerSupabaseClient();
  const userResult = await supabase.auth.getUser();

  try {
    return { supabase, userId: requireAuthenticatedUserId(userResult) };
  } catch {
    return null;
  }
}

export async function setFavoriteAction(input: {
  placeId: string;
  placeSlug: string;
  saved: boolean;
}): Promise<ActionResult<{ saved: boolean }>> {
  if (!isUuid(input.placeId) || !isPlaceSlug(input.placeSlug)) {
    return { status: "error" };
  }

  const context = await authenticatedContext();
  if (!context) {
    return { status: "authentication-required" };
  }

  const { data: place, error: placeError } = await context.supabase
    .from("place_discovery")
    .select("place_id")
    .eq("place_id", input.placeId)
    .eq("place_slug", input.placeSlug)
    .maybeSingle();

  if (placeError || !place) {
    return { status: "error" };
  }

  const mutation = input.saved
    ? await context.supabase.from("favorites").insert({
        place_id: input.placeId,
        profile_id: context.userId,
      })
    : await context.supabase
        .from("favorites")
        .delete()
        .eq("profile_id", context.userId)
        .eq("place_id", input.placeId);

  if (mutation.error && !(input.saved && mutation.error.code === "23505")) {
    return { status: "error" };
  }

  revalidatePath("/saved");
  revalidatePath(`/places/${input.placeSlug}`);
  return { data: { saved: input.saved }, status: "ok" };
}

export async function createWheelListAction(nameInput: string): Promise<
  ActionResult<{
    id: string;
    name: string;
    placeCount: number;
    placeSlug: null;
  }>
> {
  const name = normalizeWheelListName(nameInput);
  if (!name) {
    return { status: "error" };
  }

  const context = await authenticatedContext();
  if (!context) {
    return { status: "authentication-required" };
  }

  const { data: lastList, error: orderError } = await context.supabase
    .from("wheel_lists")
    .select("sort_position")
    .eq("profile_id", context.userId)
    .order("sort_position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (orderError) {
    return { status: "error" };
  }

  const { data, error } = await context.supabase
    .from("wheel_lists")
    .insert({
      name,
      profile_id: context.userId,
      sort_position: (lastList?.sort_position ?? -1) + 1,
    })
    .select("id, name")
    .single();

  if (error) {
    return { status: "error" };
  }

  revalidatePath("/saved");
  return {
    data: { id: data.id, name: data.name, placeCount: 0, placeSlug: null },
    status: "ok",
  };
}

export async function renameWheelListAction(
  listId: string,
  nameInput: string,
): Promise<ActionResult<{ id: string; name: string }>> {
  const name = normalizeWheelListName(nameInput);
  if (!isUuid(listId) || !name) {
    return { status: "error" };
  }

  const context = await authenticatedContext();
  if (!context) {
    return { status: "authentication-required" };
  }

  const { data, error } = await context.supabase
    .from("wheel_lists")
    .update({ name })
    .eq("id", listId)
    .eq("profile_id", context.userId)
    .select("id, name")
    .maybeSingle();

  if (error || !data) {
    return { status: "error" };
  }

  revalidatePath("/saved");
  return { data, status: "ok" };
}

export async function deleteWheelListAction(listId: string): Promise<ActionResult> {
  if (!isUuid(listId)) {
    return { status: "error" };
  }

  const context = await authenticatedContext();
  if (!context) {
    return { status: "authentication-required" };
  }

  const { error } = await context.supabase
    .from("wheel_lists")
    .delete()
    .eq("id", listId)
    .eq("profile_id", context.userId);

  if (error) {
    return { status: "error" };
  }

  revalidatePath("/saved");
  return { data: undefined, status: "ok" };
}
