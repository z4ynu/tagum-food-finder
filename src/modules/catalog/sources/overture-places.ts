import { candidateSchemaVersion } from "../audit/candidate";
import {
  type AdapterResult,
  normalizeOptionalText,
  normalizeSourceDate,
  normalizeStringList,
} from "./adapter-result";

type OvertureNames = Readonly<{ common?: unknown; primary?: unknown }>;
type OvertureTaxonomy = Readonly<{ alternates?: unknown; hierarchy?: unknown; primary?: unknown }>;
type OvertureAddress = Readonly<{
  country?: unknown;
  freeform?: unknown;
  locality?: unknown;
  postcode?: unknown;
  region?: unknown;
}>;
type OvertureGeometry = Readonly<{ coordinates?: unknown; type?: unknown }>;

export type OverturePlaceRecord = Readonly<{
  addresses?: unknown;
  confidence?: unknown;
  emails?: unknown;
  geometry?: OvertureGeometry;
  id?: unknown;
  names?: OvertureNames;
  operating_status?: unknown;
  phones?: unknown;
  socials?: unknown;
  sources?: unknown;
  taxonomy?: OvertureTaxonomy;
  websites?: unknown;
}>;

function firstRecord(value: unknown): Readonly<Record<string, unknown>> | null {
  if (!Array.isArray(value)) return null;
  return (
    value.find(
      (item): item is Readonly<Record<string, unknown>> =>
        Boolean(item) && typeof item === "object" && !Array.isArray(item),
    ) ?? null
  );
}

function normalizeCoordinates(geometry: OvertureGeometry | undefined) {
  if (geometry?.type !== "Point" || !Array.isArray(geometry.coordinates)) return null;
  const [longitude, latitude] = geometry.coordinates;
  return typeof longitude === "number" && typeof latitude === "number"
    ? { latitude, longitude }
    : null;
}

function sourceUpdatedAt(sources: unknown): string | null {
  if (!Array.isArray(sources)) return null;
  const timestamps = sources
    .flatMap((source) => {
      if (!source || typeof source !== "object" || Array.isArray(source)) return [];
      const normalized = normalizeSourceDate((source as Record<string, unknown>).update_time);
      return normalized ? [normalized] : [];
    })
    .sort();
  return timestamps.at(-1) ?? null;
}

function sourceLabels(taxonomy: OvertureTaxonomy | undefined): string[] {
  const values = [
    normalizeOptionalText(taxonomy?.primary),
    ...normalizeStringList(taxonomy?.alternates),
  ];
  return [...new Set(values.filter((value): value is string => Boolean(value)))].map(
    (value) => `taxonomy:${value}`,
  );
}

function alternateNames(names: OvertureNames | undefined): string[] {
  if (!names?.common || typeof names.common !== "object" || Array.isArray(names.common)) return [];
  return normalizeStringList(Object.values(names.common));
}

export function normalizeOverturePlace(
  record: OverturePlaceRecord,
  snapshotVersion: string,
  retrievedAt: string,
): AdapterResult {
  const recordId = normalizeOptionalText(record.id);
  if (!recordId) return { outcome: "rejected", reason: "missing-id" };

  const name = normalizeOptionalText(record.names?.primary);
  if (!name) return { outcome: "rejected", reason: "missing-name" };

  const address = firstRecord(record.addresses) as OvertureAddress | null;
  return {
    outcome: "accepted",
    candidate: {
      address: {
        addressLine: normalizeOptionalText(address?.freeform),
        barangayLabel: null,
        countryCode: normalizeOptionalText(address?.country),
        locality: normalizeOptionalText(address?.locality),
        postalCode: normalizeOptionalText(address?.postcode),
        region: normalizeOptionalText(address?.region),
      },
      alternateNames: alternateNames(record.names),
      candidateKey: `overture-places:${recordId}`,
      contacts: {
        email: normalizeStringList(record.emails)[0] ?? null,
        phone: normalizeStringList(record.phones)[0] ?? null,
        social: normalizeStringList(record.socials),
        website: normalizeStringList(record.websites)[0] ?? null,
      },
      coordinates: normalizeCoordinates(record.geometry),
      name,
      openingHoursText: null,
      retrievedAt,
      schemaVersion: candidateSchemaVersion,
      source: { recordId, slug: "overture-places", snapshotVersion },
      sourceCategoryLabels: sourceLabels(record.taxonomy),
      sourceClosedAt: null,
      sourceCuisineLabels: [],
      sourceUpdatedAt: sourceUpdatedAt(record.sources),
    },
  };
}
