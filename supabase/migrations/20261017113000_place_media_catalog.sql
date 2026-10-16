begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'place-media',
  'place-media',
  true,
  2097152,
  array['image/jpeg', 'image/webp']
);

create table catalog.place_media (
  id uuid primary key default extensions.gen_random_uuid(),
  place_id uuid not null references catalog.places(id),
  bucket_id text not null default 'place-media' check (bucket_id = 'place-media'),
  object_path text not null unique check (char_length(object_path) between 40 and 160),
  media_type text not null check (media_type in ('image/jpeg', 'image/webp')),
  width integer not null check (width between 320 and 2560),
  height integer not null check (height between 240 and 2560),
  byte_size integer not null check (byte_size between 1 and 2097152),
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  rights_basis text not null check (
    rights_basis in ('business_provided', 'community_provided', 'project_owned', 'open_license')
  ),
  rights_reference text not null check (char_length(rights_reference) between 1 and 200),
  source_url text check (source_url is null or source_url ~ '^https://'),
  license_name text check (license_name is null or char_length(license_name) between 1 and 100),
  license_url text check (license_url is null or license_url ~ '^https://'),
  attribution_text text check (attribution_text is null or char_length(attribution_text) between 1 and 300),
  alt_text text not null check (char_length(alt_text) between 3 and 300),
  sort_order integer not null default 0 check (sort_order between 0 and 20),
  publication_state text not null default 'published' check (
    publication_state in ('published', 'withdrawn')
  ),
  rights_confirmed_at timestamptz not null,
  published_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  withdrawal_reason text check (
    withdrawal_reason is null or char_length(withdrawal_reason) between 1 and 300
  ),
  created_at timestamptz not null default now(),
  constraint place_media_open_license_metadata check (
    rights_basis <> 'open_license'
    or (
      source_url is not null
      and license_name is not null
      and license_url is not null
      and attribution_text is not null
    )
  ),
  constraint place_media_withdrawal_state check (
    (publication_state = 'published' and withdrawn_at is null and withdrawal_reason is null)
    or (publication_state = 'withdrawn' and withdrawn_at is not null and withdrawal_reason is not null)
  )
);

create unique index place_media_one_published_sort_order
  on catalog.place_media (place_id, sort_order)
  where publication_state = 'published';

create index place_media_published_place_idx
  on catalog.place_media (place_id, publication_state, sort_order);

create or replace view public.place_media
with (security_invoker = true)
as
select
  media.id as media_id,
  release_place.place_id,
  release_place.place_slug,
  media.bucket_id,
  media.object_path,
  media.media_type,
  media.width,
  media.height,
  media.attribution_text,
  media.source_url,
  media.license_name,
  media.license_url,
  media.alt_text,
  media.sort_order,
  media.published_at
from catalog.place_media as media
join catalog.catalog_releases as release on release.is_active
join catalog.catalog_release_places as release_place
  on release_place.release_id = release.id
 and release_place.place_id = media.place_id
where media.publication_state = 'published';

create or replace function app_private.publish_place_media(
  p_place_slug text,
  p_object_path text,
  p_media_type text,
  p_width integer,
  p_height integer,
  p_byte_size integer,
  p_content_sha256 text,
  p_rights_basis text,
  p_rights_reference text,
  p_source_url text,
  p_license_name text,
  p_license_url text,
  p_attribution_text text,
  p_alt_text text,
  p_sort_order integer,
  p_rights_confirmed_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_place_id uuid;
  v_storage_metadata jsonb;
  v_media_id uuid;
begin
  perform app_private.require_service_role();

  select release_place.place_id into v_place_id
  from catalog.catalog_releases as release
  join catalog.catalog_release_places as release_place on release_place.release_id = release.id
  where release.is_active
    and release_place.place_slug = p_place_slug;

  if v_place_id is null then
    raise exception 'The active place was not found.' using errcode = 'P0002';
  end if;

  if p_object_path !~ (
    '^' || v_place_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|webp)$'
  )
     or p_media_type not in ('image/jpeg', 'image/webp')
     or p_width not between 320 and 2560
     or p_height not between 240 and 2560
     or p_byte_size not between 1 and 2097152
     or coalesce(p_content_sha256, '') !~ '^[0-9a-f]{64}$'
     or p_rights_basis not in ('business_provided', 'community_provided', 'project_owned', 'open_license')
     or char_length(coalesce(p_rights_reference, '')) not between 1 and 200
     or (p_source_url is not null and p_source_url !~ '^https://')
     or (p_license_url is not null and p_license_url !~ '^https://')
     or char_length(coalesce(p_alt_text, '')) not between 3 and 300
     or p_sort_order not between 0 and 20
     or p_rights_confirmed_at is null
     or p_rights_confirmed_at > now() then
    raise exception 'The public media metadata is invalid.' using errcode = '22023';
  end if;

  if p_rights_basis = 'open_license'
     and (
       p_source_url is null
       or nullif(p_license_name, '') is null
       or p_license_url is null
       or nullif(p_attribution_text, '') is null
     ) then
    raise exception 'Open-license media requires source, license, and attribution metadata.'
      using errcode = '23514';
  end if;

  select object.metadata into v_storage_metadata
  from storage.objects as object
  where object.bucket_id = 'place-media'
    and object.name = p_object_path
    and object.archived_at is null
    and not object.is_delete_marker;

  if v_storage_metadata is null then
    raise exception 'The processed public media object was not found.' using errcode = 'P0002';
  end if;

  if coalesce(v_storage_metadata->>'mimetype', '') <> p_media_type
     or coalesce((v_storage_metadata->>'size')::integer, -1) <> p_byte_size then
    raise exception 'The public media object does not match the reviewed metadata.' using errcode = '23514';
  end if;

  insert into catalog.place_media (
    place_id,
    object_path,
    media_type,
    width,
    height,
    byte_size,
    content_sha256,
    rights_basis,
    rights_reference,
    source_url,
    license_name,
    license_url,
    attribution_text,
    alt_text,
    sort_order,
    rights_confirmed_at
  )
  values (
    v_place_id,
    p_object_path,
    p_media_type,
    p_width,
    p_height,
    p_byte_size,
    p_content_sha256,
    p_rights_basis,
    p_rights_reference,
    p_source_url,
    nullif(p_license_name, ''),
    p_license_url,
    nullif(p_attribution_text, ''),
    p_alt_text,
    p_sort_order,
    p_rights_confirmed_at
  )
  returning id into v_media_id;

  return v_media_id;
end;
$$;

create or replace function app_private.withdraw_place_media(
  p_media_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_media catalog.place_media%rowtype;
begin
  perform app_private.require_service_role();

  if char_length(coalesce(p_reason, '')) not between 1 and 300 then
    raise exception 'A withdrawal reason is required.' using errcode = '22023';
  end if;

  select * into v_media
  from catalog.place_media
  where id = p_media_id
  for update;

  if not found then
    raise exception 'The media record was not found.' using errcode = 'P0002';
  end if;

  if v_media.publication_state = 'withdrawn' then
    return;
  end if;

  if exists (
    select 1
    from storage.objects as object
    where object.bucket_id = v_media.bucket_id
      and object.name = v_media.object_path
      and object.archived_at is null
      and not object.is_delete_marker
  ) then
    raise exception 'Remove the public Storage object before recording withdrawal.'
      using errcode = '55000';
  end if;

  update catalog.place_media
  set publication_state = 'withdrawn',
      withdrawn_at = now(),
      withdrawal_reason = p_reason
  where id = p_media_id;
end;
$$;

create or replace function public.publish_place_media(
  p_place_slug text,
  p_object_path text,
  p_media_type text,
  p_width integer,
  p_height integer,
  p_byte_size integer,
  p_content_sha256 text,
  p_rights_basis text,
  p_rights_reference text,
  p_source_url text,
  p_license_name text,
  p_license_url text,
  p_attribution_text text,
  p_alt_text text,
  p_sort_order integer,
  p_rights_confirmed_at timestamptz
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select app_private.publish_place_media(
    p_place_slug,
    p_object_path,
    p_media_type,
    p_width,
    p_height,
    p_byte_size,
    p_content_sha256,
    p_rights_basis,
    p_rights_reference,
    p_source_url,
    p_license_name,
    p_license_url,
    p_attribution_text,
    p_alt_text,
    p_sort_order,
    p_rights_confirmed_at
  );
$$;

create or replace function public.withdraw_place_media(p_media_id uuid, p_reason text)
returns void
language sql
security invoker
set search_path = ''
as $$
  select app_private.withdraw_place_media(p_media_id, p_reason);
$$;

revoke all on table catalog.place_media from public, anon, authenticated;
grant select (
  id,
  place_id,
  bucket_id,
  object_path,
  media_type,
  width,
  height,
  attribution_text,
  source_url,
  license_name,
  license_url,
  alt_text,
  sort_order,
  publication_state,
  published_at
) on table catalog.place_media to anon, authenticated;

revoke all on function app_private.publish_place_media(
  text, text, text, integer, integer, integer, text, text, text, text, text, text, text, text, integer, timestamptz
) from public, anon, authenticated;
revoke all on function app_private.withdraw_place_media(uuid, text) from public, anon, authenticated;
revoke all on function public.publish_place_media(
  text, text, text, integer, integer, integer, text, text, text, text, text, text, text, text, integer, timestamptz
) from public, anon, authenticated;
revoke all on function public.withdraw_place_media(uuid, text) from public, anon, authenticated;

grant execute on function app_private.publish_place_media(
  text, text, text, integer, integer, integer, text, text, text, text, text, text, text, text, integer, timestamptz
) to service_role;
grant execute on function app_private.withdraw_place_media(uuid, text) to service_role;
grant execute on function public.publish_place_media(
  text, text, text, integer, integer, integer, text, text, text, text, text, text, text, text, integer, timestamptz
) to service_role;
grant execute on function public.withdraw_place_media(uuid, text) to service_role;

grant select on public.place_media to anon, authenticated;

comment on table catalog.place_media is
  'Rights-reviewed public place media metadata. Public objects are processed variants, not correction evidence originals.';

comment on view public.place_media is
  'Published media metadata for places in the active catalog release.';

comment on function public.publish_place_media(
  text, text, text, integer, integer, integer, text, text, text, text, text, text, text, text, integer, timestamptz
) is 'Service-role-only publication boundary for a processed, rights-reviewed place image.';

comment on function public.withdraw_place_media(uuid, text) is
  'Service-role-only takedown record written after the public Storage object is removed.';

commit;
