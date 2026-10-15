import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

import type { BoundaryFixture } from "../../src/modules/catalog/audit/boundary";
import {
  buildOsmCatalogImport,
  type OsmExtractionManifest,
} from "../../src/modules/catalog/import/osm-import-payload";
import { parseDeploymentIdentity } from "../../src/platform/config/deployment-identity";

type Command = "prepare" | "publish" | "stage";

const defaultSnapshot = "validation/snapshots/osm-tagum-food-places.geojsonseq";
const defaultManifest = "validation/snapshots/osm-tagum-food-places.manifest.json";
const defaultBoundary = "validation/fixtures/tagum-boundary-osm-15986415-v8.json";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function usage(): never {
  throw new Error(
    "Usage: npm run catalog:osm -- prepare|stage [snapshot manifest boundary] OR publish <batch-uuid>",
  );
}

function loadLocalEnvironment(): void {
  const path = resolve(".env.local");
  if (existsSync(path)) process.loadEnvFile(path);
}

function adminClient() {
  loadLocalEnvironment();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const appEnvironment = process.env.APP_ENVIRONMENT?.trim();
  const projectRef = process.env.SUPABASE_PROJECT_REF?.trim();

  if (!url || !secretKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for stage or publish.",
    );
  }
  parseDeploymentIdentity({
    APP_ENVIRONMENT: appEnvironment,
    SUPABASE_PROJECT_REF: projectRef,
    supabaseUrl: url,
  });

  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function payloadFromFiles(arguments_: readonly string[]) {
  const [
    snapshotArgument = defaultSnapshot,
    manifestArgument = defaultManifest,
    boundaryArgument = defaultBoundary,
  ] = arguments_;
  const snapshotPath = resolve(snapshotArgument);
  const [snapshot, manifestText, boundaryText] = await Promise.all([
    readFile(snapshotPath),
    readFile(resolve(manifestArgument), "utf8"),
    readFile(resolve(boundaryArgument), "utf8"),
  ]);

  return buildOsmCatalogImport({
    boundary: JSON.parse(boundaryText) as BoundaryFixture,
    manifest: JSON.parse(manifestText) as OsmExtractionManifest,
    snapshot,
    snapshotFileName: snapshotPath,
  });
}

const [commandValue, ...arguments_] = process.argv.slice(2);
if (!commandValue || !["prepare", "publish", "stage"].includes(commandValue)) usage();
const command = commandValue as Command;

if (command === "publish") {
  const [batchId] = arguments_;
  if (!batchId || !uuidPattern.test(batchId)) usage();

  const { data, error } = await adminClient().rpc("publish_osm_import", { p_batch_id: batchId });
  if (error) throw new Error(`Catalog publication failed: ${error.message}`);
  console.log(JSON.stringify(data, null, 2));
} else {
  const payload = await payloadFromFiles(arguments_);
  console.log(
    JSON.stringify(
      {
        adapterVersion: payload.adapterVersion,
        boundary: payload.boundary.slug,
        schemaVersion: payload.schemaVersion,
        sourceChecksum: payload.source.checksum,
        sourceSnapshot: payload.source.snapshot,
        summary: payload.summary,
      },
      null,
      2,
    ),
  );

  if (command === "stage") {
    const { data, error } = await adminClient().rpc("stage_osm_import", { p_payload: payload });
    if (error) throw new Error(`Catalog staging failed: ${error.message}`);
    console.log(JSON.stringify(data, null, 2));
  }
}
