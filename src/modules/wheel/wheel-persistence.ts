import type { DiscoveryPlace } from "../discovery/model";
import { placeProfileSlug } from "../discovery/place-profile-path";
import type { WheelEntry } from "./catalog-wheel-entries";

export const MAX_WHEEL_ENTRIES = 50;

export type PersistedWheelEntry = Readonly<{
  id: string;
  label: string;
  placeId: string | null;
}>;

export type WheelEntryMutation = Readonly<{
  label: string;
  placeId: string | null;
}>;

export function normalizeWheelEntryMutations(value: unknown): WheelEntryMutation[] | null {
  if (!Array.isArray(value) || value.length > MAX_WHEEL_ENTRIES) {
    return null;
  }

  const normalized: WheelEntryMutation[] = [];
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object") {
      return null;
    }
    const entry = candidate as Partial<WheelEntryMutation>;
    const label = typeof entry.label === "string" ? entry.label.trim() : "";
    if (!label || label.length > 80) {
      return null;
    }
    if (entry.placeId !== null && typeof entry.placeId !== "string") {
      return null;
    }
    normalized.push({ label, placeId: entry.placeId ?? null });
  }
  return normalized;
}

export function persistedWheelEntries(
  rows: readonly Readonly<{ id: string; label_snapshot: string; place_id: string | null }>[],
): PersistedWheelEntry[] {
  return rows.map((row) => ({
    id: row.id,
    label: row.label_snapshot,
    placeId: row.place_id,
  }));
}

export function wheelEntriesFromPersistence(
  entries: readonly PersistedWheelEntry[],
  places: readonly DiscoveryPlace[],
): WheelEntry[] {
  const placesById = new Map(places.map((place) => [place.id, place]));
  return entries.map((entry) => {
    const place = entry.placeId ? placesById.get(entry.placeId) : null;
    return {
      id: entry.id,
      label: entry.label,
      placeSlug: place ? placeProfileSlug(place) : null,
    };
  });
}

export function wheelEntryMutations(
  entries: readonly WheelEntry[],
  places: readonly DiscoveryPlace[],
): WheelEntryMutation[] {
  const placesBySlug = new Map(places.map((place) => [placeProfileSlug(place), place]));
  return entries.map((entry) => ({
    label: entry.label,
    placeId: entry.placeSlug ? (placesBySlug.get(entry.placeSlug)?.id ?? null) : null,
  }));
}
