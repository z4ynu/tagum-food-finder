import { candidateSchemaVersion } from "../audit/candidate";
import {
  type AdapterResult,
  normalizeOptionalText,
  normalizeSourceDate,
  normalizeStringList,
} from "./adapter-result";

export type FoursquareOsPlaceRow = Readonly<{
  address?: unknown;
  country?: unknown;
  date_closed?: unknown;
  date_refreshed?: unknown;
  email?: unknown;
  facebook_id?: unknown;
  fsq_category_labels?: unknown;
  fsq_place_id?: unknown;
  instagram?: unknown;
  latitude?: unknown;
  locality?: unknown;
  longitude?: unknown;
  name?: unknown;
  postcode?: unknown;
  region?: unknown;
  tel?: unknown;
  twitter?: unknown;
  website?: unknown;
}>;

function normalizeCoordinates(row: FoursquareOsPlaceRow) {
  if (typeof row.longitude !== "number" || typeof row.latitude !== "number") {
    return null;
  }

  return { latitude: row.latitude, longitude: row.longitude };
}

function normalizeSocial(row: FoursquareOsPlaceRow): string[] {
  const entries = [
    ["facebook", row.facebook_id],
    ["instagram", row.instagram],
    ["twitter", row.twitter],
  ] as const;

  return entries.flatMap(([platform, value]) => {
    const normalized = normalizeOptionalText(value);
    return normalized ? [`${platform}:${normalized}`] : [];
  });
}

export function normalizeFoursquareOsPlace(
  row: FoursquareOsPlaceRow,
  snapshotVersion: string,
  retrievedAt: string,
): AdapterResult {
  const recordId = normalizeOptionalText(row.fsq_place_id);
  if (!recordId) {
    return { outcome: "rejected", reason: "missing-id" };
  }

  const name = normalizeOptionalText(row.name);
  if (!name) {
    return { outcome: "rejected", reason: "missing-name" };
  }

  return {
    outcome: "accepted",
    candidate: {
      address: {
        addressLine: normalizeOptionalText(row.address),
        barangayLabel: null,
        countryCode: normalizeOptionalText(row.country),
        locality: normalizeOptionalText(row.locality),
        postalCode: normalizeOptionalText(row.postcode),
        region: normalizeOptionalText(row.region),
      },
      alternateNames: [],
      candidateKey: `foursquare-os-places:${recordId}`,
      contacts: {
        email: normalizeOptionalText(row.email),
        phone: normalizeOptionalText(row.tel),
        social: normalizeSocial(row),
        website: normalizeOptionalText(row.website),
      },
      coordinates: normalizeCoordinates(row),
      name,
      openingHoursText: null,
      retrievedAt,
      schemaVersion: candidateSchemaVersion,
      source: { recordId, slug: "foursquare-os-places", snapshotVersion },
      sourceCategoryLabels: normalizeStringList(row.fsq_category_labels),
      sourceClosedAt: normalizeSourceDate(row.date_closed),
      sourceCuisineLabels: [],
      sourceUpdatedAt: normalizeSourceDate(row.date_refreshed),
    },
  };
}
