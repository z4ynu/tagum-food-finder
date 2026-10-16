import { createHash } from "node:crypto";
import { basename } from "node:path";

import {
  assertBoundaryReadyForAudit,
  type BoundaryFixture,
  clipCandidatesToBoundary,
} from "../audit/boundary";
import { assessSourceCategory } from "../audit/source-category";
import { normalizeOverturePlace, type OverturePlaceRecord } from "../sources/overture-places";

export const overtureImportSchemaVersion = 1 as const;
export const overtureAdapterVersion = "overture-places-jsonl-v1" as const;

export type OvertureExtractionManifest = Readonly<{
  boundary: Readonly<{ sha256: string }>;
  generatedAt: string;
  outputs: Readonly<{
    jsonLinesFile: string;
    jsonLinesRecords: number;
    jsonLinesSha256: string;
  }>;
  source: Readonly<{ release: string; url: string }>;
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
    confidence: number | null;
    cuisineLabels: readonly string[];
    displayAddress: string | null;
    latitude: number;
    longitude: number;
    name: string;
    operatingStatus: string | null;
    placeSlug: string;
    socialUrls: readonly string[];
    sourceCategoryLabels: readonly string[];
    sourceUpdatedAt: string | null;
    websiteUrl: string | null;
  }>;
}>;

export type OvertureCatalogImportPayload = Readonly<{
  adapterVersion: typeof overtureAdapterVersion;
  boundary: Readonly<{ checksum: string; slug: string }>;
  records: readonly ImportRecord[];
  schemaVersion: typeof overtureImportSchemaVersion;
  source: Readonly<{
    attributionText: string;
    checksum: string;
    release: string;
    retrievedAt: string;
    slug: "overture-places";
    url: string;
  }>;
  summary: Readonly<{
    acceptedBeforeBoundary: number;
    autoPublishEligible: number;
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
  manifest: OvertureExtractionManifest;
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

function assertManifest(manifest: OvertureExtractionManifest): void {
  if (
    !manifest ||
    typeof manifest.generatedAt !== "string" ||
    !Number.isFinite(Date.parse(manifest.generatedAt)) ||
    typeof manifest.source?.release !== "string" ||
    typeof manifest.source.url !== "string" ||
    typeof manifest.outputs?.jsonLinesFile !== "string" ||
    !Number.isInteger(manifest.outputs.jsonLinesRecords) ||
    manifest.outputs.jsonLinesRecords < 0 ||
    !sha256Pattern.test(manifest.outputs.jsonLinesSha256) ||
    !sha256Pattern.test(manifest.boundary?.sha256 ?? "")
  ) {
    throw new Error("The Overture extraction manifest is invalid.");
  }
}

function parseRecords(snapshot: Buffer): OverturePlaceRecord[] {
  const records: OverturePlaceRecord[] = [];
  for (const line of snapshot.toString("utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const value: unknown = JSON.parse(trimmed);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("The Overture snapshot contains a non-object record.");
    }
    records.push(value as OverturePlaceRecord);
  }
  return records;
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function labelFromSlug(slug: string | null): string | null {
  if (!slug) return null;
  return slug
    .split("-")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function confidence(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1
    ? value
    : null;
}

function cuisineLabels(record: OverturePlaceRecord): string[] {
  const primary =
    record.taxonomy && typeof record.taxonomy.primary === "string" ? record.taxonomy.primary : "";
  const match = /^(.+)_restaurant$/.exec(primary);
  if (!match || ["fast_food", "theme", "breakfast_and_brunch"].includes(match[1])) return [];
  return [labelFromSlug(match[1].replaceAll("_", "-"))].filter((value): value is string =>
    Boolean(value),
  );
}

function displayAddress(candidate: ReturnType<typeof normalizeOverturePlace>) {
  if (candidate.outcome === "rejected" || !candidate.candidate.address) return null;
  const address = candidate.candidate.address;
  return [...new Set([address.addressLine, address.locality].filter(Boolean))].join(", ") || null;
}

export function buildOvertureCatalogImport({
  boundary,
  manifest,
  snapshot,
  snapshotFileName,
}: BuildInput): OvertureCatalogImportPayload {
  assertManifest(manifest);
  assertBoundaryReadyForAudit(boundary);
  if (basename(snapshotFileName) !== manifest.outputs.jsonLinesFile) {
    throw new Error("Snapshot filename does not match the Overture extraction manifest.");
  }
  const snapshotChecksum = sha256(snapshot);
  if (snapshotChecksum !== manifest.outputs.jsonLinesSha256) {
    throw new Error("Snapshot SHA-256 does not match the Overture extraction manifest.");
  }
  if (boundary.provenance.checksumSha256 !== manifest.boundary.sha256) {
    throw new Error("Boundary SHA-256 does not match the Overture extraction manifest.");
  }

  const sourceRecords = parseRecords(snapshot);
  if (sourceRecords.length !== manifest.outputs.jsonLinesRecords) {
    throw new Error("Snapshot record count does not match the Overture extraction manifest.");
  }

  const normalized = sourceRecords.map((record) => ({
    normalized: normalizeOverturePlace(record, manifest.source.release, manifest.generatedAt),
    record,
  }));
  const accepted = normalized.filter(
    (
      entry,
    ): entry is typeof entry & {
      normalized: {
        outcome: "accepted";
        candidate: NonNullable<
          Extract<typeof entry.normalized, { outcome: "accepted" }>["candidate"]
        >;
      };
    } => entry.normalized.outcome === "accepted",
  );
  const clipped = clipCandidatesToBoundary(
    accepted.map((entry) => entry.normalized.candidate),
    boundary.geometry,
  );
  const insideKeys = new Set(clipped.accepted.map((candidate) => candidate.candidateKey));
  const inside = accepted.filter((entry) =>
    insideKeys.has(entry.normalized.candidate.candidateKey),
  );

  const usability = { "review-required": 0, unmapped: 0, usable: 0 };
  let autoPublishEligible = 0;
  const records = inside.map(({ normalized: { candidate }, record }): ImportRecord => {
    if (!candidate.coordinates)
      throw new Error("An in-boundary Overture candidate has no coordinates.");
    const assessment = assessSourceCategory(candidate);
    usability[assessment.usability] += 1;
    const normalizedConfidence = confidence(record.confidence);
    const operatingStatus =
      typeof record.operating_status === "string" ? record.operating_status.trim() || null : null;
    if (
      assessment.usability === "usable" &&
      normalizedConfidence !== null &&
      normalizedConfidence >= 0.8 &&
      operatingStatus !== "permanently_closed"
    ) {
      autoPublishEligible += 1;
    }

    const idSuffix =
      slugify(candidate.source.recordId).slice(0, 12) ||
      sha256(candidate.source.recordId).slice(0, 12);
    const normalizedPayload = {
      addressLine: candidate.address?.addressLine ?? null,
      category: {
        label: labelFromSlug(assessment.category),
        matchedSourceLabel: assessment.matchedLabel,
        slug: assessment.category,
        usability: assessment.usability,
      },
      confidence: normalizedConfidence,
      cuisineLabels: cuisineLabels(record),
      displayAddress: displayAddress({ outcome: "accepted", candidate }),
      latitude: candidate.coordinates.latitude,
      longitude: candidate.coordinates.longitude,
      name: candidate.name,
      operatingStatus,
      placeSlug: `${slugify(candidate.name) || "food-place"}-${idSuffix}`,
      socialUrls: candidate.contacts.social,
      sourceCategoryLabels: candidate.sourceCategoryLabels,
      sourceUpdatedAt: candidate.sourceUpdatedAt,
      websiteUrl: candidate.contacts.website,
    } as const;

    return {
      contentHash: sha256(stableJson(normalizedPayload)),
      externalRecordKey: candidate.source.recordId,
      normalizedPayload,
    };
  });

  return {
    adapterVersion: overtureAdapterVersion,
    boundary: { checksum: boundary.provenance.checksumSha256, slug: boundary.slug },
    records,
    schemaVersion: overtureImportSchemaVersion,
    source: {
      attributionText: "Overture Maps Foundation",
      checksum: snapshotChecksum,
      release: manifest.source.release,
      retrievedAt: new Date(manifest.generatedAt).toISOString(),
      slug: "overture-places",
      url: manifest.source.url,
    },
    summary: {
      acceptedBeforeBoundary: accepted.length,
      autoPublishEligible,
      insideBoundary: records.length,
      readerRejected: sourceRecords.length - accepted.length,
      recordsRead: sourceRecords.length,
      reviewRequired: usability["review-required"],
      unmapped: usability.unmapped,
      usable: usability.usable,
    },
  };
}
