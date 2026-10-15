import type { Database } from "@/platform/supabase/database.types";

import type { DiscoveryPlace, EvidenceLevel } from "./model";

type PlaceDiscoveryRow = Database["public"]["Views"]["place_discovery"]["Row"];

function labelFromSlug(slug: string) {
  const label = slug.replaceAll("-", " ");
  return `${label.charAt(0).toLocaleUpperCase("en")}${label.slice(1)}`;
}

function evidenceLevel(
  values: readonly string[],
  verificationState: PlaceDiscoveryRow["verification_state"],
): EvidenceLevel {
  if (values.length === 0) {
    return "unknown";
  }
  return verificationState === "owner_confirmed" ? "verified" : "source";
}

function requiredFields(row: PlaceDiscoveryRow) {
  if (
    !row.place_id ||
    !row.place_slug ||
    !row.canonical_name ||
    !row.category_label ||
    row.latitude === null ||
    row.longitude === null ||
    !row.source_label
  ) {
    throw new Error("Catalog row is missing required public fields.");
  }

  return {
    category: row.category_label,
    id: row.place_id,
    latitude: row.latitude,
    longitude: row.longitude,
    name: row.canonical_name,
    profileSlug: row.place_slug,
    sourceLabel: row.source_label,
  };
}

export function discoveryPlaceFromRow(row: PlaceDiscoveryRow): DiscoveryPlace {
  const required = requiredFields(row);
  const cravingValues = (row.craving_slugs ?? []).map(labelFromSlug);
  const occasionValues = (row.occasion_slugs ?? []).map(labelFromSlug);
  const hasPrice = row.minimum_centavos !== null && row.maximum_centavos !== null;
  const priceLevel: EvidenceLevel = hasPrice
    ? row.verification_state === "owner_confirmed"
      ? "verified"
      : "source"
    : "unknown";

  return {
    address: row.display_address,
    category: required.category,
    coordinates: { latitude: required.latitude, longitude: required.longitude },
    cravings: {
      level: evidenceLevel(cravingValues, row.verification_state),
      values: cravingValues,
    },
    cuisines: row.cuisine_labels ?? [],
    id: required.id,
    name: required.name,
    occasions: {
      level: evidenceLevel(occasionValues, row.verification_state),
      values: occasionValues,
    },
    price: {
      level: priceLevel,
      maximumPerPersonPhp:
        hasPrice && row.maximum_centavos !== null ? row.maximum_centavos / 100 : null,
      minimumPerPersonPhp:
        hasPrice && row.minimum_centavos !== null ? row.minimum_centavos / 100 : null,
    },
    profileSlug: required.profileSlug,
    sourceLabel: required.sourceLabel,
  };
}
