import type { NormalizedPlaceCandidate } from "./candidate";

export type AuditPlaceCategory =
  | "bakery"
  | "bar-with-food"
  | "cafe"
  | "dessert"
  | "fast-food"
  | "food-court"
  | "food-stall"
  | "prepared-food-shop"
  | "restaurant";

export type SourceCategoryAssessment = Readonly<{
  category: AuditPlaceCategory | null;
  matchedLabel: string | null;
  usability: "review-required" | "unmapped" | "usable";
}>;

type MappingRule = Readonly<{
  category: AuditPlaceCategory;
  label: string;
  usability: "review-required" | "usable";
}>;

const osmRules: readonly MappingRule[] = [
  { category: "restaurant", label: "amenity:restaurant", usability: "usable" },
  { category: "fast-food", label: "amenity:fast_food", usability: "usable" },
  { category: "cafe", label: "amenity:cafe", usability: "usable" },
  { category: "food-court", label: "amenity:food_court", usability: "usable" },
  { category: "dessert", label: "amenity:ice_cream", usability: "usable" },
  { category: "bakery", label: "shop:bakery", usability: "usable" },
  { category: "bakery", label: "shop:pastry", usability: "usable" },
  { category: "dessert", label: "shop:ice_cream", usability: "usable" },
  { category: "dessert", label: "shop:confectionery", usability: "review-required" },
  { category: "prepared-food-shop", label: "shop:deli", usability: "review-required" },
  { category: "prepared-food-shop", label: "shop:coffee", usability: "review-required" },
  { category: "prepared-food-shop", label: "shop:tea", usability: "review-required" },
  { category: "bar-with-food", label: "amenity:bar", usability: "usable" },
  { category: "bar-with-food", label: "amenity:biergarten", usability: "usable" },
  { category: "bar-with-food", label: "amenity:pub", usability: "usable" },
];

const foursquareRules: readonly Readonly<{
  category: AuditPlaceCategory;
  pattern: RegExp;
  usability: "review-required" | "usable";
}>[] = [
  { category: "fast-food", pattern: /(?:^| > )fast food(?:$| > )/i, usability: "usable" },
  { category: "food-court", pattern: /(?:^| > )food court(?:$| > )/i, usability: "usable" },
  { category: "bakery", pattern: /(?:^| > )bakery(?:$| > )/i, usability: "usable" },
  { category: "cafe", pattern: /(?:^| > )(?:café|cafe)(?:$| > )/i, usability: "usable" },
  {
    category: "dessert",
    pattern: /(?:^| > )(?:dessert shop|ice cream parlor)(?:$| > )/i,
    usability: "usable",
  },
  { category: "restaurant", pattern: /(?:^| > )restaurant(?:$| > )/i, usability: "usable" },
  {
    category: "prepared-food-shop",
    pattern: /(?:^| > )(?:deli|specialty food store)(?:$| > )/i,
    usability: "review-required",
  },
  {
    category: "bar-with-food",
    pattern: /(?:^| > )(?:bar|pub)(?:$| > )/i,
    usability: "review-required",
  },
];

const overtureRules: readonly MappingRule[] = [
  { category: "fast-food", label: "taxonomy:fast_food_restaurant", usability: "usable" },
  { category: "food-stall", label: "taxonomy:food_truck_stand", usability: "usable" },
  { category: "bakery", label: "taxonomy:bakery", usability: "usable" },
  { category: "cafe", label: "taxonomy:cafe", usability: "usable" },
  { category: "cafe", label: "taxonomy:coffee_shop", usability: "usable" },
  { category: "cafe", label: "taxonomy:bubble_tea_shop", usability: "usable" },
  { category: "cafe", label: "taxonomy:tea_room", usability: "usable" },
  { category: "cafe", label: "taxonomy:smoothie_juice_bar", usability: "usable" },
  { category: "dessert", label: "taxonomy:dessert_shop", usability: "usable" },
  { category: "dessert", label: "taxonomy:ice_cream_shop", usability: "usable" },
  { category: "dessert", label: "taxonomy:frozen_yogurt_shop", usability: "usable" },
  { category: "dessert", label: "taxonomy:cupcake_shop", usability: "usable" },
  { category: "dessert", label: "taxonomy:donut_shop", usability: "usable" },
  {
    category: "bar-with-food",
    label: "taxonomy:bar_and_grill_restaurant",
    usability: "usable",
  },
  {
    category: "prepared-food-shop",
    label: "taxonomy:delicatessen",
    usability: "review-required",
  },
  { category: "dessert", label: "taxonomy:candy_store", usability: "review-required" },
  { category: "bar-with-food", label: "taxonomy:bar", usability: "review-required" },
  { category: "bar-with-food", label: "taxonomy:brewery", usability: "review-required" },
  { category: "bar-with-food", label: "taxonomy:wine_bar", usability: "review-required" },
  { category: "bar-with-food", label: "taxonomy:winery", usability: "review-required" },
];

function mapOsmLabels(labels: readonly string[]): SourceCategoryAssessment {
  for (const rule of osmRules) {
    if (labels.includes(rule.label)) {
      return { category: rule.category, matchedLabel: rule.label, usability: rule.usability };
    }
  }

  return { category: null, matchedLabel: null, usability: "unmapped" };
}

function mapFoursquareLabels(labels: readonly string[]): SourceCategoryAssessment {
  for (const rule of foursquareRules) {
    const matchedLabel = labels.find((label) => rule.pattern.test(label));
    if (matchedLabel) {
      return { category: rule.category, matchedLabel, usability: rule.usability };
    }
  }

  return { category: null, matchedLabel: null, usability: "unmapped" };
}

function mapOvertureLabels(labels: readonly string[]): SourceCategoryAssessment {
  for (const rule of overtureRules) {
    if (labels.includes(rule.label)) {
      return { category: rule.category, matchedLabel: rule.label, usability: rule.usability };
    }
  }

  const restaurantLabel = labels.find(
    (label) => label === "taxonomy:restaurant" || label.endsWith("_restaurant"),
  );
  return restaurantLabel
    ? { category: "restaurant", matchedLabel: restaurantLabel, usability: "usable" }
    : { category: null, matchedLabel: null, usability: "unmapped" };
}

export function assessSourceCategory(
  candidate: NormalizedPlaceCandidate,
): SourceCategoryAssessment {
  if (candidate.source.slug === "openstreetmap") {
    return mapOsmLabels(candidate.sourceCategoryLabels);
  }

  if (candidate.source.slug === "foursquare-os-places") {
    return mapFoursquareLabels(candidate.sourceCategoryLabels);
  }

  if (candidate.source.slug === "overture-places") {
    return mapOvertureLabels(candidate.sourceCategoryLabels);
  }

  return { category: null, matchedLabel: null, usability: "unmapped" };
}
