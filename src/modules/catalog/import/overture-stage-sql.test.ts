import { describe, expect, it } from "vitest";

import type { OvertureCatalogImportPayload } from "./overture-import-payload";
import { buildOvertureStageSql } from "./overture-stage-sql";

describe("buildOvertureStageSql", () => {
  it("wraps the normalized payload in a transaction-local service-role call", () => {
    const payload = {
      adapterVersion: "overture-places-jsonl-v1",
      boundary: { checksum: "a".repeat(64), slug: "tagum-city" },
      records: [],
      schemaVersion: 1,
      source: {
        attributionText: "Overture Maps Foundation",
        checksum: "b".repeat(64),
        release: "2026-09-23.1",
        retrievedAt: "2026-10-16T00:00:00.000Z",
        slug: "overture-places",
        url: "s3://example.test/release",
      },
      summary: {
        acceptedBeforeBoundary: 0,
        autoPublishEligible: 0,
        insideBoundary: 0,
        readerRejected: 0,
        recordsRead: 0,
        reviewRequired: 0,
        unmapped: 0,
        usable: 0,
      },
    } satisfies OvertureCatalogImportPayload;

    const sql = buildOvertureStageSql(payload);
    expect(sql).toContain("begin;");
    expect(sql).toContain("set_config('request.jwt.claim.role', 'service_role', true)");
    expect(sql).toContain("public.stage_overture_import");
    expect(sql).toContain(Buffer.from(JSON.stringify(payload), "utf8").toString("base64"));
    expect(sql).toMatch(/commit;\n$/);
    expect(sql).not.toContain(payload.source.url);
  });
});
