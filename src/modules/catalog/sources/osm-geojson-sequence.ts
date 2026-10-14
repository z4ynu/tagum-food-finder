import { geometryCoversPoint, type MultiPolygonGeometry, type Position } from "../audit/boundary";
import type { NormalizedPlaceCandidate } from "../audit/candidate";
import { normalizeOpenStreetMapPlace, type OsmElementSnapshot } from "./openstreetmap";

export type OsmCoordinateMethod =
  | "line-midpoint"
  | "missing"
  | "polygon-representative"
  | "source-point";

export type OsmSnapshotCandidate = Readonly<{
  candidate: NormalizedPlaceCandidate;
  coordinateMethod: OsmCoordinateMethod;
}>;

export type OsmSnapshotReadResult = Readonly<{
  accepted: readonly OsmSnapshotCandidate[];
  collapsedSourceDuplicates: number;
  recordsRead: number;
  rejected: Readonly<
    Record<"invalid-feature" | "missing-id" | "missing-name" | "not-food-place", number>
  >;
}>;

type GeoJsonGeometry = Readonly<{
  coordinates?: unknown;
  type?: unknown;
}>;

type GeoJsonFeature = Readonly<{
  geometry?: GeoJsonGeometry | null;
  properties?: Readonly<Record<string, unknown>> | null;
  type?: unknown;
}>;

type ReaderOptions = Readonly<{
  maxBytes?: number;
  maxRecords?: number;
  retrievedAt: string;
  snapshotVersion: string;
}>;

const defaultMaxBytes = 5_000_000;
const defaultMaxRecords = 10_000;
const recordSeparator = String.fromCharCode(0x1e);

function stripRecordSeparator(line: string): string {
  return line.startsWith(recordSeparator) ? line.slice(1) : line;
}

function isPosition(value: unknown): value is Position {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number" &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  );
}

function isLineString(value: unknown): value is Position[] {
  return Array.isArray(value) && value.length > 0 && value.every(isPosition);
}

function isPolygon(value: unknown): value is Position[][] {
  return Array.isArray(value) && value.length > 0 && value.every(isLineString);
}

function isMultiPolygon(value: unknown): value is Position[][][] {
  return Array.isArray(value) && value.length > 0 && value.every(isPolygon);
}

function signedRingArea(ring: readonly Position[]): number {
  let area = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const current = ring[index];
    const next = ring[index + 1];
    area += current[0] * next[1] - next[0] * current[1];
  }
  return area / 2;
}

function ringCentroid(ring: readonly Position[]): Position | null {
  const area = signedRingArea(ring);
  if (Math.abs(area) < Number.EPSILON) return null;

  let longitude = 0;
  let latitude = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const current = ring[index];
    const next = ring[index + 1];
    const cross = current[0] * next[1] - next[0] * current[1];
    longitude += (current[0] + next[0]) * cross;
    latitude += (current[1] + next[1]) * cross;
  }

  const scale = 1 / (6 * area);
  return [longitude * scale, latitude * scale];
}

function polygonRepresentativePoint(polygon: Position[][]): Position | null {
  const centroid = ringCentroid(polygon[0]);
  const geometry: MultiPolygonGeometry = { coordinates: [polygon], type: "MultiPolygon" };

  if (centroid && geometryCoversPoint(geometry, centroid)) {
    return centroid;
  }

  const outerRing = polygon[0];
  const longitudes = outerRing.map((position) => position[0]);
  const latitudes = outerRing.map((position) => position[1]);
  const boxCenter: Position = [
    (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
  ];

  return geometryCoversPoint(geometry, boxCenter) ? boxCenter : (outerRing[0] ?? null);
}

function lineMidpoint(line: Position[]): Position | null {
  if (line.length === 1) return line[0];

  const segments = line.slice(1).map((end, index) => {
    const start = line[index];
    return { end, length: Math.hypot(end[0] - start[0], end[1] - start[1]), start };
  });
  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
  if (totalLength === 0) return line[0];

  const target = totalLength / 2;
  let traversed = 0;
  for (const segment of segments) {
    if (traversed + segment.length >= target) {
      const ratio = (target - traversed) / segment.length;
      return [
        segment.start[0] + (segment.end[0] - segment.start[0]) * ratio,
        segment.start[1] + (segment.end[1] - segment.start[1]) * ratio,
      ];
    }
    traversed += segment.length;
  }

  return line.at(-1) ?? null;
}

function geometryCoordinate(
  geometry: GeoJsonGeometry | null | undefined,
): Readonly<{ method: OsmCoordinateMethod; position: Position | null }> {
  if (!geometry || typeof geometry.type !== "string") {
    return { method: "missing", position: null };
  }

  if (geometry.type === "Point" && isPosition(geometry.coordinates)) {
    return { method: "source-point", position: geometry.coordinates };
  }

  if (geometry.type === "LineString" && isLineString(geometry.coordinates)) {
    return { method: "line-midpoint", position: lineMidpoint(geometry.coordinates) };
  }

  if (geometry.type === "Polygon" && isPolygon(geometry.coordinates)) {
    return {
      method: "polygon-representative",
      position: polygonRepresentativePoint(geometry.coordinates),
    };
  }

  if (geometry.type === "MultiPolygon" && isMultiPolygon(geometry.coordinates)) {
    const largestPolygon = [...geometry.coordinates].sort(
      (left, right) => Math.abs(signedRingArea(right[0])) - Math.abs(signedRingArea(left[0])),
    )[0];
    return {
      method: "polygon-representative",
      position: largestPolygon ? polygonRepresentativePoint(largestPolygon) : null,
    };
  }

  return { method: "missing", position: null };
}

function parseFeature(line: string): GeoJsonFeature | null {
  let value: unknown;
  try {
    value = JSON.parse(stripRecordSeparator(line));
  } catch {
    return null;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as GeoJsonFeature;
}

function featureToElement(
  feature: GeoJsonFeature,
): Readonly<{ coordinateMethod: OsmCoordinateMethod; element: OsmElementSnapshot }> | null {
  if (feature.type !== "Feature" || !feature.properties) return null;

  const properties = feature.properties;
  const sourceType = properties["@type"];
  const sourceId = properties["@id"];
  const coordinate = geometryCoordinate(feature.geometry);
  const tags = Object.fromEntries(
    Object.entries(properties).filter(([key]) => !key.startsWith("@")),
  );

  return {
    coordinateMethod: coordinate.position ? coordinate.method : "missing",
    element: {
      center: coordinate.position
        ? { lat: coordinate.position[1], lon: coordinate.position[0] }
        : undefined,
      id: sourceId,
      lat: sourceType === "node" ? coordinate.position?.[1] : undefined,
      lon: sourceType === "node" ? coordinate.position?.[0] : undefined,
      tags,
      timestamp: properties["@timestamp"],
      type: sourceType,
    },
  };
}

export function readOsmGeoJsonSequence(
  input: string,
  options: ReaderOptions,
): OsmSnapshotReadResult {
  const maxBytes = options.maxBytes ?? defaultMaxBytes;
  const maxRecords = options.maxRecords ?? defaultMaxRecords;
  if (Buffer.byteLength(input, "utf8") > maxBytes) {
    throw new Error(`OSM snapshot exceeds the ${maxBytes}-byte reader limit.`);
  }

  const lines = input.split(/\r?\n/).filter((line) => stripRecordSeparator(line).trim());
  if (lines.length > maxRecords) {
    throw new Error(`OSM snapshot exceeds the ${maxRecords}-record reader limit.`);
  }

  const acceptedByKey = new Map<string, OsmSnapshotCandidate>();
  let collapsedSourceDuplicates = 0;
  const rejected = {
    "invalid-feature": 0,
    "missing-id": 0,
    "missing-name": 0,
    "not-food-place": 0,
  };

  for (const line of lines) {
    const feature = parseFeature(line);
    const converted = feature ? featureToElement(feature) : null;
    if (!converted) {
      rejected["invalid-feature"] += 1;
      continue;
    }

    const result = normalizeOpenStreetMapPlace(
      converted.element,
      options.snapshotVersion,
      options.retrievedAt,
    );
    if (result.outcome === "rejected") {
      rejected[result.reason] += 1;
      continue;
    }

    const candidate = { candidate: result.candidate, coordinateMethod: converted.coordinateMethod };
    const existing = acceptedByKey.get(result.candidate.candidateKey);
    if (!existing) {
      acceptedByKey.set(result.candidate.candidateKey, candidate);
      continue;
    }

    collapsedSourceDuplicates += 1;
    const methodPriority: Readonly<Record<OsmCoordinateMethod, number>> = {
      "line-midpoint": 1,
      missing: 0,
      "polygon-representative": 3,
      "source-point": 2,
    };
    if (methodPriority[candidate.coordinateMethod] > methodPriority[existing.coordinateMethod]) {
      acceptedByKey.set(result.candidate.candidateKey, candidate);
    }
  }

  return {
    accepted: [...acceptedByKey.values()],
    collapsedSourceDuplicates,
    recordsRead: lines.length,
    rejected,
  };
}
