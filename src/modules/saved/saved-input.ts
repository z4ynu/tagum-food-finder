const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PLACE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function isPlaceSlug(value: string): boolean {
  return value.length <= 180 && PLACE_SLUG_PATTERN.test(value);
}

export function normalizeWheelListName(value: string): string | null {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > 0 && normalized.length <= 40 ? normalized : null;
}
