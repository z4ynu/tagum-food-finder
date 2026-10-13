import { candidateSchemaVersion } from "../audit/candidate";
import { type AdapterResult, normalizeOptionalText, normalizeSourceDate } from "./adapter-result";

export type OsmElementSnapshot = Readonly<{
  center?: Readonly<{ lat?: unknown; lon?: unknown }>;
  id?: unknown;
  lat?: unknown;
  lon?: unknown;
  tags?: Readonly<Record<string, unknown>>;
  timestamp?: unknown;
  type?: unknown;
}>;

const foodAmenities = new Set(["cafe", "fast_food", "food_court", "ice_cream", "restaurant"]);
const foodShops = new Set([
  "bakery",
  "coffee",
  "confectionery",
  "deli",
  "ice_cream",
  "pastry",
  "tea",
]);
const conditionalFoodAmenities = new Set(["bar", "biergarten", "pub"]);
const osmElementTypes = new Set(["node", "relation", "way"]);

function readTag(tags: Readonly<Record<string, unknown>>, key: string): string | null {
  return normalizeOptionalText(tags[key]);
}

function splitTagList(value: string | null): string[] {
  if (!value) {
    return [];
  }

  return [
    ...new Set(
      value
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function isFoodPlace(tags: Readonly<Record<string, unknown>>): boolean {
  const amenity = readTag(tags, "amenity");
  const shop = readTag(tags, "shop");

  if ((amenity && foodAmenities.has(amenity)) || (shop && foodShops.has(shop))) {
    return true;
  }

  return Boolean(
    amenity &&
      conditionalFoodAmenities.has(amenity) &&
      (readTag(tags, "food") === "yes" || readTag(tags, "cuisine")),
  );
}

function normalizeCoordinates(element: OsmElementSnapshot) {
  const longitude = element.type === "node" ? element.lon : element.center?.lon;
  const latitude = element.type === "node" ? element.lat : element.center?.lat;

  return typeof longitude === "number" && typeof latitude === "number"
    ? { latitude, longitude }
    : null;
}

function firstTag(tags: Readonly<Record<string, unknown>>, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = readTag(tags, key);
    if (value) return value;
  }
  return null;
}

export function normalizeOpenStreetMapPlace(
  element: OsmElementSnapshot,
  snapshotVersion: string,
  retrievedAt: string,
): AdapterResult {
  const elementType = normalizeOptionalText(element.type);
  const elementId =
    typeof element.id === "number" || typeof element.id === "string"
      ? String(element.id).trim()
      : "";
  if (!elementType || !osmElementTypes.has(elementType) || !elementId) {
    return { outcome: "rejected", reason: "missing-id" };
  }

  const tags = element.tags ?? {};
  if (!isFoodPlace(tags)) {
    return { outcome: "rejected", reason: "not-food-place" };
  }

  const name = firstTag(tags, ["name", "brand"]);
  if (!name) {
    return { outcome: "rejected", reason: "missing-name" };
  }

  const street = readTag(tags, "addr:street");
  const houseNumber = readTag(tags, "addr:housenumber");
  const addressLine = [houseNumber, street].filter(Boolean).join(" ") || null;
  const sourceCategoryLabels = ["amenity", "shop"].flatMap((key) => {
    const value = readTag(tags, key);
    return value ? [`${key}:${value}`] : [];
  });

  return {
    outcome: "accepted",
    candidate: {
      address: {
        addressLine,
        barangayLabel: firstTag(tags, ["addr:barangay", "addr:suburb", "addr:village"]),
        countryCode: readTag(tags, "addr:country"),
        locality: firstTag(tags, ["addr:city", "addr:town"]),
        postalCode: readTag(tags, "addr:postcode"),
        region: readTag(tags, "addr:province"),
      },
      alternateNames: [readTag(tags, "alt_name"), readTag(tags, "old_name")].flatMap(splitTagList),
      candidateKey: `openstreetmap:${elementType}/${elementId}`,
      contacts: {
        email: firstTag(tags, ["contact:email", "email"]),
        phone: firstTag(tags, ["contact:phone", "phone"]),
        social: ["contact:facebook", "contact:instagram", "contact:twitter"].flatMap((key) => {
          const value = readTag(tags, key);
          return value ? [`${key.replace("contact:", "")}:${value}`] : [];
        }),
        website: firstTag(tags, ["contact:website", "website"]),
      },
      coordinates: normalizeCoordinates(element),
      name,
      openingHoursText: readTag(tags, "opening_hours"),
      retrievedAt,
      schemaVersion: candidateSchemaVersion,
      source: {
        recordId: `${elementType}/${elementId}`,
        slug: "openstreetmap",
        snapshotVersion,
      },
      sourceCategoryLabels,
      sourceClosedAt: null,
      sourceCuisineLabels: splitTagList(readTag(tags, "cuisine")),
      sourceUpdatedAt: normalizeSourceDate(element.timestamp),
    },
  };
}
