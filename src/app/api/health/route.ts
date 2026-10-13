import { createHealthResponse } from "@/platform/health/health-response";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(createHealthResponse());
}
