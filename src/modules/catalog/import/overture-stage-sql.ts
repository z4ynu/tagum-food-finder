import type { OvertureCatalogImportPayload } from "./overture-import-payload";

export function buildOvertureStageSql(payload: OvertureCatalogImportPayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
  return [
    "begin;",
    "select set_config('request.jwt.claim.role', 'service_role', true);",
    "select public.stage_overture_import(",
    `  convert_from(decode('${encodedPayload}', 'base64'), 'UTF8')::jsonb`,
    ");",
    "commit;",
    "",
  ].join("\n");
}
