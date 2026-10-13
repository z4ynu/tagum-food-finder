export type HealthResponse = Readonly<{
  service: "tagum-food-finder";
  status: "ok";
}>;

export function createHealthResponse(): HealthResponse {
  return {
    service: "tagum-food-finder",
    status: "ok",
  };
}
