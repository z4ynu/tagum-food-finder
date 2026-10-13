import type { NormalizedPlaceCandidate } from "./candidate";

export const boundaryFixtureSchemaVersion = 1 as const;
export const tagumPsgcCode = "1102319000" as const;

export type Position = readonly [longitude: number, latitude: number];
export type LinearRing = readonly Position[];
export type PolygonCoordinates = readonly LinearRing[];

export type MultiPolygonGeometry = Readonly<{
  coordinates: readonly PolygonCoordinates[];
  type: "MultiPolygon";
}>;

export type BoundaryFixture = Readonly<{
  geometry: MultiPolygonGeometry;
  jurisdiction: Readonly<{
    countryCode: "PH";
    name: string;
    referenceCode: string;
    referenceSystem: string;
    verificationUrl: string;
    verifiedAt: string;
  }>;
  name: string;
  provenance: Readonly<{
    attribution: string;
    checksumSha256: string;
    licenseName: string;
    licenseUrl: string;
    publisher: string;
    retrievedAt: string;
    sourceRecordId: string;
    sourceUrl: string;
    sourceVersion: string;
  }>;
  purpose: "stage0-audit" | "synthetic-test";
  reviewStatus: "approved" | "pending";
  schemaVersion: typeof boundaryFixtureSchemaVersion;
  slug: string;
}>;

export type BoundaryClipResult = Readonly<{
  accepted: readonly NormalizedPlaceCandidate[];
  rejected: readonly Readonly<{
    candidate: NormalizedPlaceCandidate;
    reason: "invalid-coordinate" | "missing-coordinate" | "outside-boundary";
  }>[];
}>;

type RingPosition = "boundary" | "inside" | "outside";

const coordinateTolerance = 1e-10;
const sha256Pattern = /^[a-f0-9]{64}$/;

function assertNonEmpty(label: string, value: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}

function assertIsoTimestamp(label: string, value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    throw new Error(`${label} must be an ISO 8601 UTC timestamp.`);
  }

  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`${label} must be a valid timestamp.`);
  }
}

function assertHttpUrl(label: string, value: string): void {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL.`);
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`${label} must use HTTP or HTTPS.`);
  }
}

function assertPosition([longitude, latitude]: Position): void {
  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new Error("Boundary positions must contain valid WGS84 longitude and latitude values.");
  }
}

function assertRing(ring: LinearRing): void {
  if (ring.length < 4) {
    throw new Error("Boundary rings must contain at least four positions.");
  }

  for (const position of ring) {
    assertPosition(position);
  }

  const first = ring[0];
  const last = ring[ring.length - 1];

  if (first[0] !== last[0] || first[1] !== last[1]) {
    throw new Error("Boundary rings must be closed.");
  }
}

function pointIsOnSegment(point: Position, start: Position, end: Position): boolean {
  const [x, y] = point;
  const [startX, startY] = start;
  const [endX, endY] = end;
  const crossProduct = (y - startY) * (endX - startX) - (x - startX) * (endY - startY);

  if (Math.abs(crossProduct) > coordinateTolerance) {
    return false;
  }

  return (
    x >= Math.min(startX, endX) - coordinateTolerance &&
    x <= Math.max(startX, endX) + coordinateTolerance &&
    y >= Math.min(startY, endY) - coordinateTolerance &&
    y <= Math.max(startY, endY) + coordinateTolerance
  );
}

function classifyPointInRing(point: Position, ring: LinearRing): RingPosition {
  assertRing(ring);
  let inside = false;

  for (
    let index = 0, previousIndex = ring.length - 1;
    index < ring.length;
    previousIndex = index, index += 1
  ) {
    const current = ring[index];
    const previous = ring[previousIndex];

    if (pointIsOnSegment(point, previous, current)) {
      return "boundary";
    }

    const crossesLatitude = current[1] > point[1] !== previous[1] > point[1];
    if (crossesLatitude) {
      const intersectionLongitude =
        ((previous[0] - current[0]) * (point[1] - current[1])) / (previous[1] - current[1]) +
        current[0];

      if (point[0] < intersectionLongitude) {
        inside = !inside;
      }
    }
  }

  return inside ? "inside" : "outside";
}

function polygonCoversPoint(point: Position, polygon: PolygonCoordinates): boolean {
  const [outerRing, ...holes] = polygon;

  if (!outerRing) {
    throw new Error("Boundary polygons must contain an outer ring.");
  }

  const outerPosition = classifyPointInRing(point, outerRing);
  if (outerPosition === "outside") {
    return false;
  }
  if (outerPosition === "boundary") {
    return true;
  }

  for (const hole of holes) {
    const holePosition = classifyPointInRing(point, hole);
    if (holePosition === "boundary") {
      return true;
    }
    if (holePosition === "inside") {
      return false;
    }
  }

  return true;
}

export function geometryCoversPoint(geometry: MultiPolygonGeometry, point: Position): boolean {
  assertPosition(point);
  return geometry.coordinates.some((polygon) => polygonCoversPoint(point, polygon));
}

export function assertBoundaryReadyForAudit(fixture: BoundaryFixture): void {
  if (fixture.purpose !== "stage0-audit" || fixture.reviewStatus !== "approved") {
    throw new Error("The boundary fixture is not approved for the Stage 0 audit.");
  }

  if (!sha256Pattern.test(fixture.provenance.checksumSha256)) {
    throw new Error("The approved boundary fixture must have a lowercase SHA-256 checksum.");
  }

  assertNonEmpty("Boundary name", fixture.name);
  assertNonEmpty("Boundary slug", fixture.slug);
  assertNonEmpty("Jurisdiction name", fixture.jurisdiction.name);
  if (
    fixture.jurisdiction.countryCode !== "PH" ||
    fixture.jurisdiction.referenceSystem !== "PSGC-10" ||
    fixture.jurisdiction.referenceCode !== tagumPsgcCode
  ) {
    throw new Error(`The audit boundary must identify Tagum with PSGC ${tagumPsgcCode}.`);
  }
  assertNonEmpty("Jurisdiction reference system", fixture.jurisdiction.referenceSystem);
  assertHttpUrl("Jurisdiction verification URL", fixture.jurisdiction.verificationUrl);
  assertIsoTimestamp("Jurisdiction verification time", fixture.jurisdiction.verifiedAt);
  assertNonEmpty("Boundary attribution", fixture.provenance.attribution);
  assertNonEmpty("Boundary license name", fixture.provenance.licenseName);
  assertHttpUrl("Boundary license URL", fixture.provenance.licenseUrl);
  assertNonEmpty("Boundary publisher", fixture.provenance.publisher);
  assertIsoTimestamp("Boundary retrieval time", fixture.provenance.retrievedAt);
  assertNonEmpty("Boundary source record ID", fixture.provenance.sourceRecordId);
  assertHttpUrl("Boundary source URL", fixture.provenance.sourceUrl);
  assertNonEmpty("Boundary source version", fixture.provenance.sourceVersion);

  if (fixture.geometry.coordinates.length === 0) {
    throw new Error("The approved boundary fixture must contain geometry.");
  }

  for (const polygon of fixture.geometry.coordinates) {
    if (polygon.length === 0) {
      throw new Error("Boundary polygons must contain an outer ring.");
    }

    for (const ring of polygon) {
      assertRing(ring);
    }
  }
}

function hasValidCoordinates(longitude: number, latitude: number): boolean {
  return (
    Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
}

export function clipCandidatesToBoundary(
  candidates: readonly NormalizedPlaceCandidate[],
  geometry: MultiPolygonGeometry,
): BoundaryClipResult {
  const accepted: NormalizedPlaceCandidate[] = [];
  const rejected: BoundaryClipResult["rejected"][number][] = [];

  for (const candidate of candidates) {
    if (!candidate.coordinates) {
      rejected.push({ candidate, reason: "missing-coordinate" });
      continue;
    }

    const { latitude, longitude } = candidate.coordinates;
    if (!hasValidCoordinates(longitude, latitude)) {
      rejected.push({ candidate, reason: "invalid-coordinate" });
      continue;
    }

    if (!geometryCoversPoint(geometry, [longitude, latitude])) {
      rejected.push({ candidate, reason: "outside-boundary" });
      continue;
    }

    accepted.push(candidate);
  }

  return { accepted, rejected };
}
