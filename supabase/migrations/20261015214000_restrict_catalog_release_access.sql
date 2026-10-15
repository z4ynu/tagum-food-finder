begin;

revoke all on table catalog.catalog_releases from anon, authenticated;
revoke all on table catalog.catalog_release_places from anon, authenticated;

grant select (id, is_active)
  on table catalog.catalog_releases
  to anon, authenticated;

grant select (
  release_id,
  place_id,
  place_slug,
  canonical_name,
  category_slug,
  category_label,
  point,
  display_address,
  cuisine_labels,
  craving_slugs,
  occasion_slugs,
  minimum_centavos,
  maximum_centavos,
  price_tier,
  price_confidence,
  price_current_through,
  verification_state,
  source_label,
  source_attribution,
  published_at
)
  on table catalog.catalog_release_places
  to anon, authenticated;

comment on table catalog.catalog_releases is
  'Internal release metadata. Public roles receive only the id and active-state columns needed by security-invoker discovery views.';

commit;
