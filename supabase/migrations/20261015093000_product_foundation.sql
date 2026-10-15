create extension if not exists pgcrypto with schema extensions;
create extension if not exists postgis with schema extensions;

create schema if not exists catalog;
create schema if not exists app_private;

revoke all on schema catalog from public, anon, authenticated;
revoke all on schema app_private from public, anon, authenticated;

create type catalog.place_lifecycle_status as enum (
  'draft',
  'active',
  'temporarily_closed',
  'permanently_closed',
  'moved',
  'merged',
  'archived'
);

create type catalog.verification_state as enum (
  'unverified',
  'source_supported',
  'community_supported',
  'owner_confirmed',
  'review_required'
);

create type catalog.import_status as enum (
  'queued',
  'acquiring',
  'normalizing',
  'matching',
  'awaiting_review',
  'validating',
  'published',
  'rejected',
  'failed'
);

create type catalog.price_tier as enum (
  'budget',
  'affordable',
  'moderate',
  'upper_mid_range',
  'premium'
);

create table catalog.sources (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  display_name text not null check (char_length(display_name) between 1 and 120),
  source_type text not null check (source_type in ('provider', 'official', 'community', 'owner', 'system')),
  homepage_url text,
  license_url text,
  attribution_text text,
  collection_allowed boolean not null default false,
  storage_allowed boolean not null default false,
  display_allowed boolean not null default false,
  modification_allowed boolean not null default false,
  redistribution_allowed boolean not null default false,
  raw_payload_retention_days integer check (raw_payload_retention_days between 0 and 3650),
  terms_reviewed_at date,
  next_terms_review_due_at date,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table catalog.city_boundaries (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null,
  name text not null,
  boundary extensions.geometry(multipolygon, 4326) not null,
  source_id uuid not null references catalog.sources(id),
  source_version text not null,
  effective_from date not null,
  effective_to date,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  constraint city_boundaries_valid_geometry check (extensions.st_isvalid(boundary)),
  constraint city_boundaries_effective_range check (effective_to is null or effective_to > effective_from)
);

create unique index city_boundaries_one_current_per_slug
  on catalog.city_boundaries (slug)
  where is_current;

create index city_boundaries_boundary_gist
  on catalog.city_boundaries
  using gist (boundary);

create table catalog.taxonomies (
  id uuid primary key default extensions.gen_random_uuid(),
  taxonomy_type text not null check (taxonomy_type in ('place_category', 'cuisine', 'craving', 'occasion')),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  label text not null check (char_length(label) between 1 and 80),
  description text,
  parent_id uuid references catalog.taxonomies(id),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (taxonomy_type, slug),
  constraint taxonomies_not_self_parented check (parent_id is null or parent_id <> id)
);

create table catalog.places (
  id uuid primary key default extensions.gen_random_uuid(),
  canonical_name text not null check (char_length(canonical_name) between 1 and 160),
  search_name text not null check (char_length(search_name) between 1 and 200),
  lifecycle_status catalog.place_lifecycle_status not null default 'draft',
  verification_state catalog.verification_state not null default 'unverified',
  primary_category_id uuid references catalog.taxonomies(id),
  merged_into_place_id uuid references catalog.places(id),
  public_notes text check (public_notes is null or char_length(public_notes) <= 500),
  activated_at timestamptz,
  closed_at timestamptz,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint places_not_merged_into_self check (merged_into_place_id is null or merged_into_place_id <> id),
  constraint places_merged_target_required check (
    (lifecycle_status = 'merged' and merged_into_place_id is not null)
    or (lifecycle_status <> 'merged' and merged_into_place_id is null)
  ),
  constraint places_active_fields_required check (
    lifecycle_status <> 'active'
    or (primary_category_id is not null and activated_at is not null)
  )
);

create index places_search_name_idx on catalog.places (search_name);
create index places_lifecycle_status_idx on catalog.places (lifecycle_status);

create table catalog.place_locations (
  id uuid primary key default extensions.gen_random_uuid(),
  place_id uuid not null references catalog.places(id) on delete cascade,
  point extensions.geography(point, 4326) not null,
  display_address text check (display_address is null or char_length(display_address) <= 300),
  address_line text check (address_line is null or char_length(address_line) <= 240),
  location_precision text not null check (location_precision in ('rooftop', 'entrance', 'parcel', 'approximate')),
  public_pickup_confirmed boolean not null default false,
  is_current boolean not null default true,
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  created_at timestamptz not null default now(),
  constraint place_locations_valid_range check (valid_to is null or valid_to > valid_from)
);

create unique index place_locations_one_current_per_place
  on catalog.place_locations (place_id)
  where is_current;

create index place_locations_point_gist
  on catalog.place_locations
  using gist (point);

create table catalog.source_records (
  id uuid primary key default extensions.gen_random_uuid(),
  source_id uuid not null references catalog.sources(id),
  external_record_key text not null,
  normalized_payload jsonb not null check (jsonb_typeof(normalized_payload) = 'object'),
  payload_schema_version integer not null check (payload_schema_version > 0),
  retrieved_at timestamptz not null,
  source_updated_at timestamptz,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  licensing_classification text not null,
  raw_payload_expires_at timestamptz,
  latest_seen_batch_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, external_record_key)
);

create table catalog.import_batches (
  id uuid primary key default extensions.gen_random_uuid(),
  source_id uuid not null references catalog.sources(id),
  trigger_type text not null check (trigger_type in ('scheduled', 'manual')),
  status catalog.import_status not null default 'queued',
  source_snapshot text not null,
  source_checksum text not null check (source_checksum ~ '^[0-9a-f]{64}$'),
  boundary_id uuid not null references catalog.city_boundaries(id),
  adapter_version text not null,
  schema_version integer not null check (schema_version > 0),
  started_at timestamptz,
  finished_at timestamptz,
  fetched_count integer not null default 0 check (fetched_count >= 0),
  normalized_count integer not null default 0 check (normalized_count >= 0),
  created_count integer not null default 0 check (created_count >= 0),
  updated_count integer not null default 0 check (updated_count >= 0),
  unchanged_count integer not null default 0 check (unchanged_count >= 0),
  rejected_count integer not null default 0 check (rejected_count >= 0),
  validation_summary jsonb not null default '{}'::jsonb check (jsonb_typeof(validation_summary) = 'object'),
  failure_classification text,
  created_at timestamptz not null default now(),
  constraint import_batches_time_range check (finished_at is null or started_at is null or finished_at >= started_at)
);

alter table catalog.source_records
  add constraint source_records_latest_seen_batch_fk
  foreign key (latest_seen_batch_id) references catalog.import_batches(id);

create table catalog.import_batch_records (
  batch_id uuid not null references catalog.import_batches(id) on delete cascade,
  source_record_id uuid not null references catalog.source_records(id),
  normalization_state text not null check (normalization_state in ('accepted', 'rejected')),
  boundary_result text not null check (boundary_result in ('inside', 'outside', 'invalid')),
  validation_errors jsonb not null default '[]'::jsonb check (jsonb_typeof(validation_errors) = 'array'),
  content_changed boolean not null,
  proposed_action text not null check (
    proposed_action in ('unchanged', 'create', 'update', 'revalidate', 'moderate', 'reject')
  ),
  created_at timestamptz not null default now(),
  primary key (batch_id, source_record_id)
);

create table catalog.external_identifiers (
  id uuid primary key default extensions.gen_random_uuid(),
  source_id uuid not null references catalog.sources(id),
  entity_type text not null check (entity_type = 'place'),
  entity_id uuid not null references catalog.places(id),
  external_key text not null,
  source_record_id uuid references catalog.source_records(id),
  created_at timestamptz not null default now(),
  unique (source_id, entity_type, external_key)
);

create table catalog.field_provenance (
  id uuid primary key default extensions.gen_random_uuid(),
  entity_type text not null check (entity_type = 'place'),
  entity_id uuid not null references catalog.places(id),
  field_path text not null check (
    field_path in (
      'canonical_name',
      'primary_category',
      'location',
      'display_address',
      'cuisines',
      'price_summary',
      'lifecycle_status'
    )
  ),
  source_record_id uuid references catalog.source_records(id),
  accepted_value_hash text not null check (accepted_value_hash ~ '^[0-9a-f]{64}$'),
  accepted_at timestamptz not null default now(),
  accepted_by uuid references auth.users(id) on delete set null,
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  verification_state catalog.verification_state not null,
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  review_due_at timestamptz,
  superseded_by_id uuid references catalog.field_provenance(id),
  constraint field_provenance_has_evidence check (source_record_id is not null),
  constraint field_provenance_valid_range check (valid_to is null or valid_to > valid_from),
  constraint field_provenance_not_self_superseded check (superseded_by_id is null or superseded_by_id <> id)
);

create table catalog.catalog_releases (
  id uuid primary key default extensions.gen_random_uuid(),
  release_number bigint generated always as identity unique,
  validation_result jsonb not null check (jsonb_typeof(validation_result) = 'object'),
  published_at timestamptz,
  published_by uuid references auth.users(id) on delete set null,
  previous_release_id uuid references catalog.catalog_releases(id),
  rollback_target_id uuid references catalog.catalog_releases(id),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  constraint catalog_releases_active_published check (not is_active or published_at is not null),
  constraint catalog_releases_previous_distinct check (previous_release_id is null or previous_release_id <> id),
  constraint catalog_releases_rollback_distinct check (rollback_target_id is null or rollback_target_id <> id)
);

create unique index catalog_releases_one_active
  on catalog.catalog_releases ((is_active))
  where is_active;

create table catalog.catalog_release_batches (
  release_id uuid not null references catalog.catalog_releases(id) on delete cascade,
  batch_id uuid not null references catalog.import_batches(id),
  primary key (release_id, batch_id),
  unique (batch_id)
);

create table catalog.catalog_release_places (
  release_id uuid not null references catalog.catalog_releases(id) on delete cascade,
  place_id uuid not null references catalog.places(id),
  place_slug text not null check (place_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  canonical_name text not null,
  category_slug text not null,
  category_label text not null,
  point extensions.geography(point, 4326) not null,
  display_address text,
  cuisine_labels text[] not null default '{}',
  craving_slugs text[] not null default '{}',
  occasion_slugs text[] not null default '{}',
  minimum_centavos integer check (minimum_centavos >= 0),
  maximum_centavos integer check (maximum_centavos >= minimum_centavos),
  price_tier catalog.price_tier,
  price_confidence text check (price_confidence in ('low', 'medium', 'high')),
  price_current_through date,
  verification_state catalog.verification_state not null,
  source_label text not null,
  source_attribution text,
  published_at timestamptz not null default now(),
  primary key (release_id, place_id),
  unique (release_id, place_slug),
  constraint catalog_release_places_price_complete check (
    (minimum_centavos is null and maximum_centavos is null and price_tier is null and price_confidence is null)
    or (minimum_centavos is not null and maximum_centavos is not null and price_tier is not null and price_confidence is not null)
  )
);

create index catalog_release_places_point_gist
  on catalog.catalog_release_places
  using gist (point);

create index catalog_release_places_name_idx
  on catalog.catalog_release_places (release_id, canonical_name);

create or replace view public.place_markers
with (security_invoker = true)
as
select
  release_place.place_id,
  release_place.place_slug,
  release_place.canonical_name,
  release_place.category_slug,
  release_place.category_label,
  extensions.st_y(release_place.point::extensions.geometry) as latitude,
  extensions.st_x(release_place.point::extensions.geometry) as longitude,
  release_place.price_tier,
  release_place.verification_state
from catalog.catalog_release_places as release_place
join catalog.catalog_releases as release
  on release.id = release_place.release_id
where release.is_active;

create or replace view public.place_discovery
with (security_invoker = true)
as
select
  release_place.place_id,
  release_place.place_slug,
  release_place.canonical_name,
  release_place.category_slug,
  release_place.category_label,
  extensions.st_y(release_place.point::extensions.geometry) as latitude,
  extensions.st_x(release_place.point::extensions.geometry) as longitude,
  release_place.display_address,
  release_place.cuisine_labels,
  release_place.craving_slugs,
  release_place.occasion_slugs,
  release_place.minimum_centavos,
  release_place.maximum_centavos,
  release_place.price_tier,
  release_place.price_confidence,
  release_place.price_current_through,
  release_place.verification_state,
  release_place.source_label,
  release_place.source_attribution,
  release_place.published_at
from catalog.catalog_release_places as release_place
join catalog.catalog_releases as release
  on release.id = release_place.release_id
where release.is_active;

revoke all on all tables in schema catalog from public, anon, authenticated;
revoke all on all functions in schema catalog from public, anon, authenticated;

grant usage on schema catalog to anon, authenticated;
grant select on catalog.catalog_releases, catalog.catalog_release_places to anon, authenticated;
grant select on public.place_markers, public.place_discovery to anon, authenticated;

comment on schema catalog is
  'Unexposed canonical, provenance, import, and immutable public-release data.';

comment on table catalog.catalog_release_places is
  'Immutable public projection for one catalog release; activating a release switches discovery atomically.';

comment on view public.place_markers is
  'Restricted public marker fields from the single active catalog release.';

comment on view public.place_discovery is
  'Restricted public discovery fields from the single active catalog release.';
