import { createHash } from "node:crypto";
import { basename } from "node:path";

import {
  assertBoundaryReadyForAudit,
  type BoundaryFixture,
  clipCandidatesToBoundary,
} from "../audit/boundary";
import { assessSourceCategory } from "../audit/source-category";
import { type OsmCoordinateMethod, readOsmGeoJsonSequence } from "../sources/osm-geojson-sequence";

export const osmImportSchemaVersion = 1 as const;
export const osmAdapterVersion = "osm-geojson-sequence-v1" as const;

export type OsmExtractionManifest = Readonly<{
  boundary: Readonly<{ sha256: string }>;
  generatedAt: string;
  outputs: Readonly<{
    geoJsonSequenceFile: string;
    geoJsonSequenceRecords: number;
    geoJsonSequenceSha256: string;
  }>;
  source: Readonly<{ md5: string; version: string }>;
}>;

type ImportRecord = Readonly<{
  contentHash: string;
  externalRecordKey: string;
  normalizedPayload: Readonly<{
    addressLine: string | null;
    category: Readonly<{
      label: string | null;
      matchedSourceLabel: string | null;
      slug: string | null;
      usability: "review-required" | "unmapped" | "usable";
    }>;
    coordinateMethod: OsmCoordinateMethod;
    cuisineLabels: readonly string[];
    displayAddress: string | null;
    latitude: number;
    longitude: number;
    name: string;
    placeSlug: string;
    sourceCategoryLabels: readonly string[];
    sourceUpdatedAt: string | null;
  }>;
}>;

export type OsmCatalogImportPayload = Readonly<{
  adapterVersion: typeof osmAdapterVersion;
  boundary: Readonly<{
    checksum: string;
    effectiveFrom: string;
    geometry: BoundaryFixture["geometry"];
    name: string;
    slug: string;
    sourceVersion: string;
  }>;
  records: readonly ImportRecord[];
  schemaVersion: typeof osmImportSchemaVersion;
  source: Readonly<{
    attributionText: string;
    checksum: string;
    retrievedAt: string;
    slug: "openstreetmap";
    snapshot: string;
  }>;
  summary: Readonly<{
    acceptedBeforeBoundary: number;
    collapsedSourceDuplicates: number;
    insideBoundary: number;
    readerRejected: number;
    recordsRead: number;
    reviewRequired: number;
    unmapped: number;
    usable: number;
  }>;
}>;

type BuildInput = Readonly<{
  boundary: BoundaryFixture;
  manifest: OsmExtractionManifest;
  snapshot: Buffer;
  snapshotFileName: string;
}>;

const sha256Pattern = /^[a-f0-9]{64}$/;

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right, "en"))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function assertManifest(manifest: OsmExtractionManifest): void {
  if (
    !manifest ||
    typeof manifest.generatedAt !== "string" ||
    !Number.isFinite(Date.parse(manifest.generatedAt)) ||
    typeof manifest.source?.version !== "string" ||
    typeof manifest.source.md5 !== "string" ||
    typeof manifest.outputs?.geoJsonSequenceFile !== "string" ||
    !Number.isInteger(manifest.outputs.geoJsonSequenceRecords) ||
    manifest.outputs.geoJsonSequenceRecords < 0 ||
    !sha256Pattern.test(manifest.outputs.geoJsonSequenceSha256) ||
    !sha256Pattern.test(manifest.boundary?.sha256 ?? "")
  ) {
    throw new Error("The OSM extraction manifest is invalid.");
  }
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function displayAddress(
  address: ImportRecord["normalizedPayload"] extends never
    ? never
    : {
        addressLine: string | null;
        barangayLabel: string | null;
        locality: string | null;
      },
): string | null {
  const parts = [address.addressLine, address.barangayLabel, address.locality]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
  return [...new Set(parts)].join(", ") || null;
}

function categoryLabel(slug: string | null): string | null {
  if (!slug) return null;
  return slug
    .split("-")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function recordIdParts(recordId: string): { id: string; type: string } {
  const [type = "record", id = sha256(recordId).slice(0, 10)] = recordId.split("/");
  return { id: slugify(id), type: slugify(type) };
}

export function buildOsmCatalogImport({
  boundary,
  manifest,
  snapshot,
  snapshotFileName,
}: BuildInput): OsmCatalogImportPayload {
  assertManifest(manifest);
  assertBoundaryReadyForAudit(boundary);

  if (basename(snapshotFileName) !== manifest.outputs.geoJsonSequenceFile) {
    throw new Error("Snapshot filename does not match the extraction manifest.");
  }
  const snapshotChecksum = sha256(snapshot);
  if (snapshotChecksum !== manifest.outputs.geoJsonSequenceSha256) {
    throw new Error("Snapshot SHA-256 does not match the extraction manifest.");
  }
  if (boundary.provenance.checksumSha256 !== manifest.boundary.sha256) {
    throw new Error("Boundary SHA-256 does not match the extraction manifest.");
  }

  const retrievedAt = new Date(manifest.generatedAt).toISOString();
  const readResult = readOsmGeoJsonSequence(snapshot.toString("utf8"), {
    retrievedAt,
    snapshotVersion: manifest.source.version,
  });
  if (readResult.recordsRead !== manifest.outputs.geoJsonSequenceRecords) {
    throw new Error("Snapshot record count does not match the extraction manifest.");
  }

  const clipped = clipCandidatesToBoundary(
    readResult.accepted.map(({ candidate }) => candidate),
    boundary.geometry,
  );
  const acceptedKeys = new Set(clipped.accepted.map(({ candidateKey }) => candidateKey));
  const inside = readResult.accepted
    .filter(({ candidate }) => acceptedKeys.has(candidate.candidateKey))
    .sort((left, right) =>
      left.candidate.source.recordId.localeCompare(right.candidate.source.recordId, "en"),
    );

  const baseSlugs = inside.map(({ candidate }) => {
    const { id } = recordIdParts(candidate.source.recordId);
    return `${slugify(candidate.name) || "food-place"}-${id}`;
  });
  const slugCounts = new Map<string, number>();
  for (const slug of baseSlugs) slugCounts.set(slug, (slugCounts.get(slug) ?? 0) + 1);

  const usability = { "review-required": 0, unmapped: 0, usable: 0 };
  const records = inside.map(({ candidate, coordinateMethod }, index): ImportRecord => {
    if (!candidate.coordinates) throw new Error("An in-boundary candidate has no coordinates.");
    const assessment = assessSourceCategory(candidate);
    usability[assessment.usability] += 1;
    const { type } = recordIdParts(candidate.source.recordId);
    const baseSlug = baseSlugs[index];
    const placeSlug = (slugCounts.get(baseSlug) ?? 0) > 1 ? `${baseSlug}-${type}` : baseSlug;
    const normalizedPayload = {
      addressLine: candidate.address?.addressLine ?? null,
      category: {
        label: categoryLabel(assessment.category),
        matchedSourceLabel: assessment.matchedLabel,
        slug: assessment.category,
        usability: assessment.usability,
      },
      coordinateMethod,
      cuisineLabels: [...candidate.sourceCuisineLabels].sort((left, right) =>
        left.localeCompare(right, "en"),
      ),
      displayAddress: candidate.address ? displayAddress(candidate.address) : null,
      latitude: candidate.coordinates.latitude,
      longitude: candidate.coordinates.longitude,
      name: candidate.name,
      placeSlug,
      sourceCategoryLabels: [...candidate.sourceCategoryLabels].sort((left, right) =>
        left.localeCompare(right, "en"),
      ),
      sourceUpdatedAt: candidate.sourceUpdatedAt,
    } as const;

    return {
      contentHash: sha256(stableJson(normalizedPayload)),
      externalRecordKey: candidate.source.recordId,
      normalizedPayload,
    };
  });

  const readerRejected = Object.values(readResult.rejected).reduce(
    (total, count) => total + count,
    0,
  );

  return {
    adapterVersion: osmAdapterVersion,
    boundary: {
      checksum: boundary.provenance.checksumSha256,
      effectiveFrom: boundary.jurisdiction.verifiedAt.slice(0, 10),
      geometry: boundary.geometry,
      name: boundary.name,
      slug: boundary.slug,
      sourceVersion: boundary.provenance.sourceVersion,
    },
    records,
    schemaVersion: osmImportSchemaVersion,
    source: {
      attributionText: boundary.provenance.attribution,
      checksum: snapshotChecksum,
      retrievedAt,
      slug: "openstreetmap",
      snapshot: manifest.source.version,
    },
    summary: {
      acceptedBeforeBoundary: readResult.accepted.length,
      collapsedSourceDuplicates: readResult.collapsedSourceDuplicates,
      insideBoundary: records.length,
      readerRejected,
      recordsRead: readResult.recordsRead,
      reviewRequired: usability["review-required"],
      unmapped: usability.unmapped,
      usable: usability.usable,
    },
  };
}
