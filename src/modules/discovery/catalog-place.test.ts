import { describe, expect, it } from "vitest";

import type { Database } from "@/platform/supabase/database.types";

import { discoveryPlaceFromRow } from "./catalog-place";

type PlaceDiscoveryRow = Database["public"]["Views"]["place_discovery"]["Row"];

const ROW: PlaceDiscoveryRow = {
  canonical_name: "Tagum Cafe",
  category_label: "Cafe",
  category_slug: "cafe",
  craving_slugs: ["coffee"],
  cuisine_labels: ["Coffee shop"],
  display_address: "Quezon Street",
  latitude: 7.448,
  longitude: 125.807,
  maximum_centavos: 28_500,
  minimum_centavos: 12_500,
  occasion_slugs: ["solo-meal"],
  place_id: "1b7e32e4-875b-4aad-8e90-d9fd02ca447c",
  place_slug: "tagum-cafe-10",
  price_confidence: "medium",
  price_current_through: "2026-12-31",
  price_tier: "moderate",
  published_at: "2026-10-15T00:00:00.000Z",
  source_attribution: "© OpenStreetMap contributors",
  source_label: "OpenStreetMap",
  verification_state: "source_supported",
};

describe("discoveryPlaceFromRow", () => {
  it("maps a published catalog row without recomputing its canonical slug", () => {
    expect(discoveryPlaceFromRow(ROW)).toEqual({
      address: "Quezon Street",
      category: "Cafe",
      coordinates: { latitude: 7.448, longitude: 125.807 },
      cravings: { level: "source", values: ["Coffee"] },
      cuisines: ["Coffee shop"],
      id: "1b7e32e4-875b-4aad-8e90-d9fd02ca447c",
      name: "Tagum Cafe",
      occasions: { level: "source", values: ["Solo meal"] },
      price: { level: "source", maximumPerPersonPhp: 285, minimumPerPersonPhp: 125 },
      profileSlug: "tagum-cafe-10",
      sourceLabel: "OpenStreetMap",
    });
  });

  it("keeps missing evidence explicitly unknown", () => {
    const place = discoveryPlaceFromRow({
      ...ROW,
      craving_slugs: [],
      maximum_centavos: null,
      minimum_centavos: null,
      occasion_slugs: [],
      price_confidence: null,
      price_current_through: null,
      price_tier: null,
    });

    expect(place.cravings).toEqual({ level: "unknown", values: [] });
    expect(place.occasions).toEqual({ level: "unknown", values: [] });
    expect(place.price).toEqual({
      level: "unknown",
      maximumPerPersonPhp: null,
      minimumPerPersonPhp: null,
    });
  });

  it("rejects a row that cannot safely render as a place", () => {
    expect(() => discoveryPlaceFromRow({ ...ROW, latitude: null })).toThrow(
      "Catalog row is missing required public fields.",
    );
  });
});
