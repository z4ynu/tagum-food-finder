import type { NormalizedPlaceCandidate } from "../audit/candidate";

export type AdapterRejectionReason = "missing-id" | "missing-name" | "not-food-place";

export type AdapterResult = Readonly<
  | { candidate: NormalizedPlaceCandidate; outcome: "accepted" }
  | { outcome: "rejected"; reason: AdapterRejectionReason }
>;

export function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized || null;
}

export function normalizeSourceDate(value: unknown): string | null {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    return null;
  }

  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
}

export function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(value.map(normalizeOptionalText).filter((item): item is string => Boolean(item))),
  ];
}
