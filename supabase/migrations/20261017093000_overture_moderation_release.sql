create table catalog.moderation_decisions (
  id uuid primary key default extensions.gen_random_uuid(),
  origin_batch_id uuid not null references catalog.import_batches(id),
  source_record_id uuid not null references catalog.source_records(id),
  outcome text not null check (outcome in ('approve_create', 'reject')),
  reason_code text not null check (reason_code ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  rationale text not null check (char_length(rationale) between 1 and 500),
  accepted_fields jsonb not null default '{}'::jsonb check (jsonb_typeof(accepted_fields) = 'object'),
  evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence) = 'array'),
  actor_type text not null default 'project_operator' check (actor_type = 'project_operator'),
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz not null default now(),
  superseded_by_id uuid references catalog.moderation_decisions(id),
  constraint moderation_decisions_not_self_superseded
    check (superseded_by_id is null or superseded_by_id <> id)
);

create unique index moderation_decisions_one_current_per_record
  on catalog.moderation_decisions (origin_batch_id, source_record_id)
  where superseded_by_id is null;

create table catalog.catalog_release_moderation_decisions (
  release_id uuid not null references catalog.catalog_releases(id) on delete cascade,
  moderation_decision_id uuid not null references catalog.moderation_decisions(id),
  primary key (release_id, moderation_decision_id),
  unique (moderation_decision_id)
);

alter table catalog.field_provenance
  add column moderation_decision_id uuid references catalog.moderation_decisions(id);

comment on table catalog.moderation_decisions is
  'Immutable operator decisions for source records held out of automatic catalog publication.';

comment on table catalog.catalog_release_moderation_decisions is
  'Moderation decisions applied by an immutable catalog release.';

create or replace function app_private.publish_overture_moderation_release(
  p_origin_batch_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_origin_batch catalog.import_batches%rowtype;
  v_previous_release_id uuid;
  v_release_id uuid;
  v_existing_release_id uuid;
  v_payload_checksum text;
  v_decision jsonb;
  v_source_record catalog.source_records%rowtype;
  v_decision_id uuid;
  v_place_id uuid;
  v_name text;
  v_place_slug text;
  v_category_slug text;
  v_category_label text;
  v_display_address text;
  v_latitude double precision;
  v_longitude double precision;
  v_point extensions.geography(point, 4326);
  v_approved integer := 0;
  v_rejected integer := 0;
begin
  perform app_private.require_service_role();
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('tagum-food-finder-catalog-publication'));

  if jsonb_typeof(p_payload) <> 'object'
     or coalesce((p_payload->>'schemaVersion')::integer, 0) <> 1
     or jsonb_typeof(p_payload->'decisions') <> 'array'
     or jsonb_array_length(p_payload->'decisions') not between 1 and 100 then
    raise exception 'The moderation payload is invalid.' using errcode = '22023';
  end if;

  select batch.* into v_origin_batch
  from catalog.import_batches as batch
  join catalog.sources as source on source.id = batch.source_id
  where batch.id = p_origin_batch_id
    and batch.status = 'published'
    and source.slug = 'overture-places';

  if not found then
    raise exception 'The published Overture origin batch was not found.' using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_payload->'decisions') as decision
    group by decision->>'externalRecordKey'
    having count(*) > 1
  ) then
    raise exception 'A source record appears more than once in the moderation payload.'
      using errcode = '22023';
  end if;

  for v_decision in select value from jsonb_array_elements(p_payload->'decisions')
  loop
    if coalesce(v_decision->>'externalRecordKey', '') = ''
       or coalesce(v_decision->>'outcome', '') not in ('approve_create', 'reject')
       or coalesce(v_decision->>'reasonCode', '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
       or char_length(coalesce(v_decision->>'rationale', '')) not between 1 and 500
       or coalesce(jsonb_typeof(v_decision->'acceptedFields'), 'object') <> 'object'
       or coalesce(jsonb_typeof(v_decision->'evidence'), 'array') <> 'array' then
      raise exception 'A moderation decision is invalid.' using errcode = '22023';
    end if;

    select source_record.* into v_source_record
    from catalog.import_batch_records as batch_record
    join catalog.source_records as source_record on source_record.id = batch_record.source_record_id
    where batch_record.batch_id = p_origin_batch_id
      and batch_record.proposed_action = 'moderate'
      and source_record.external_record_key = v_decision->>'externalRecordKey';

    if not found then
      raise exception 'A moderation decision does not target a held record in the origin batch.'
        using errcode = '23503';
    end if;
  end loop;

  v_payload_checksum := encode(
    extensions.digest(convert_to(p_payload::text, 'UTF8'), 'sha256'),
    'hex'
  );

  select release.id into v_existing_release_id
  from catalog.catalog_releases as release
  where release.validation_result->>'moderationChecksum' = v_payload_checksum
    and release.validation_result->>'originBatchId' = p_origin_batch_id::text;

  if v_existing_release_id is not null then
    return jsonb_build_object(
      'originBatchId', p_origin_batch_id,
      'releaseId', v_existing_release_id,
      'status', 'published',
      'idempotent', true,
      'approved', (
        select count(*)
        from catalog.catalog_release_moderation_decisions as link
        join catalog.moderation_decisions as decision on decision.id = link.moderation_decision_id
        where link.release_id = v_existing_release_id and decision.outcome = 'approve_create'
      ),
      'rejected', (
        select count(*)
        from catalog.catalog_release_moderation_decisions as link
        join catalog.moderation_decisions as decision on decision.id = link.moderation_decision_id
        where link.release_id = v_existing_release_id and decision.outcome = 'reject'
      )
    );
  end if;

  select id into v_previous_release_id
  from catalog.catalog_releases
  where is_active
  for update;

  if v_previous_release_id is null then
    raise exception 'An active catalog release is required.' using errcode = '55000';
  end if;

  insert into catalog.catalog_releases (
    validation_result,
    previous_release_id,
    rollback_target_id
  )
  values (
    jsonb_build_object(
      'workflow', 'overture-operator-moderation-v1',
      'originBatchId', p_origin_batch_id,
      'moderationChecksum', v_payload_checksum,
      'decisionCount', jsonb_array_length(p_payload->'decisions')
    ),
    v_previous_release_id,
    v_previous_release_id
  )
  returning id into v_release_id;

  insert into catalog.catalog_release_places (
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
  select
    v_release_id,
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
  from catalog.catalog_release_places
  where release_id = v_previous_release_id;

  for v_decision in select value from jsonb_array_elements(p_payload->'decisions')
  loop
    select source_record.* into strict v_source_record
    from catalog.import_batch_records as batch_record
    join catalog.source_records as source_record on source_record.id = batch_record.source_record_id
    where batch_record.batch_id = p_origin_batch_id
      and batch_record.proposed_action = 'moderate'
      and source_record.external_record_key = v_decision->>'externalRecordKey';

    insert into catalog.moderation_decisions (
      origin_batch_id,
      source_record_id,
      outcome,
      reason_code,
      rationale,
      accepted_fields,
      evidence,
      decided_by
    )
    values (
      p_origin_batch_id,
      v_source_record.id,
      v_decision->>'outcome',
      v_decision->>'reasonCode',
      v_decision->>'rationale',
      coalesce(v_decision->'acceptedFields', '{}'::jsonb),
      coalesce(v_decision->'evidence', '[]'::jsonb),
      auth.uid()
    )
    returning id into v_decision_id;

    insert into catalog.catalog_release_moderation_decisions (release_id, moderation_decision_id)
    values (v_release_id, v_decision_id);

    if v_decision->>'outcome' = 'reject' then
      v_rejected := v_rejected + 1;
      continue;
    end if;

    v_name := coalesce(
      nullif(v_decision#>>'{acceptedFields,canonicalName}', ''),
      v_source_record.normalized_payload->>'name'
    );
    v_place_slug := coalesce(
      nullif(v_decision#>>'{acceptedFields,placeSlug}', ''),
      v_source_record.normalized_payload->>'placeSlug'
    );
    v_category_slug := coalesce(
      nullif(v_decision#>>'{acceptedFields,categorySlug}', ''),
      v_source_record.normalized_payload#>>'{category,slug}'
    );
    v_display_address := coalesce(
      nullif(v_decision#>>'{acceptedFields,displayAddress}', ''),
      nullif(v_source_record.normalized_payload->>'displayAddress', '')
    );
    v_latitude := coalesce(
      nullif(v_decision#>>'{acceptedFields,latitude}', '')::double precision,
      (v_source_record.normalized_payload->>'latitude')::double precision
    );
    v_longitude := coalesce(
      nullif(v_decision#>>'{acceptedFields,longitude}', '')::double precision,
      (v_source_record.normalized_payload->>'longitude')::double precision
    );

    if char_length(coalesce(v_name, '')) not between 1 and 160
       or coalesce(v_place_slug, '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
       or v_latitude not between -90 and 90
       or v_longitude not between -180 and 180 then
      raise exception 'Approved fields are invalid.' using errcode = '22023';
    end if;

    select taxonomy.label into v_category_label
    from catalog.taxonomies as taxonomy
    where taxonomy.taxonomy_type = 'place_category'
      and taxonomy.slug = v_category_slug
      and taxonomy.is_active;

    if v_category_label is null then
      raise exception 'The approved category is not publishable.' using errcode = '23514';
    end if;

    v_point := extensions.st_setsrid(
      extensions.st_makepoint(v_longitude, v_latitude),
      4326
    )::extensions.geography;

    if not exists (
      select 1
      from catalog.city_boundaries as boundary
      where boundary.id = v_origin_batch.boundary_id
        and extensions.st_covers(boundary.boundary, v_point::extensions.geometry)
    ) then
      raise exception 'An approved place is outside the origin batch boundary.' using errcode = '23514';
    end if;

    if exists (
      select 1
      from catalog.external_identifiers as identifier
      where identifier.source_id = v_source_record.source_id
        and identifier.entity_type = 'place'
        and identifier.external_key = v_source_record.external_record_key
    ) then
      raise exception 'An approved source record is already linked to a place.' using errcode = '23505';
    end if;

    if exists (
      select 1
      from catalog.catalog_release_places as release_place
      where release_place.release_id = v_release_id
        and (
          release_place.place_slug = v_place_slug
          or (
            regexp_replace(lower(release_place.canonical_name), '[^a-z0-9]+', '', 'g') =
              regexp_replace(lower(v_name), '[^a-z0-9]+', '', 'g')
            and extensions.st_dwithin(release_place.point, v_point, 100)
          )
        )
    ) then
      raise exception 'An approved place matches an existing active-release place.' using errcode = '23505';
    end if;

    insert into catalog.places (
      canonical_name,
      search_name,
      lifecycle_status,
      verification_state,
      primary_category_id,
      activated_at,
      last_reviewed_at
    )
    select
      v_name,
      lower(v_name),
      'active',
      'community_supported',
      taxonomy.id,
      now(),
      now()
    from catalog.taxonomies as taxonomy
    where taxonomy.taxonomy_type = 'place_category'
      and taxonomy.slug = v_category_slug
      and taxonomy.is_active
    returning id into v_place_id;

    insert into catalog.place_locations (
      place_id,
      point,
      display_address,
      address_line,
      location_precision,
      public_pickup_confirmed
    )
    values (
      v_place_id,
      v_point,
      v_display_address,
      null,
      'approximate',
      false
    );

    insert into catalog.external_identifiers (
      source_id,
      entity_type,
      entity_id,
      external_key,
      source_record_id
    )
    values (
      v_source_record.source_id,
      'place',
      v_place_id,
      v_source_record.external_record_key,
      v_source_record.id
    );

    insert into catalog.field_provenance (
      entity_type,
      entity_id,
      field_path,
      source_record_id,
      moderation_decision_id,
      accepted_value_hash,
      confidence,
      verification_state
    )
    values
      (
        'place', v_place_id, 'canonical_name', v_source_record.id, v_decision_id,
        encode(extensions.digest(convert_to(v_name, 'UTF8'), 'sha256'), 'hex'),
        'medium', 'community_supported'
      ),
      (
        'place', v_place_id, 'primary_category', v_source_record.id, v_decision_id,
        encode(extensions.digest(convert_to(v_category_slug, 'UTF8'), 'sha256'), 'hex'),
        'medium', 'community_supported'
      ),
      (
        'place', v_place_id, 'location', v_source_record.id, v_decision_id,
        encode(extensions.digest(convert_to(concat(v_longitude, ',', v_latitude), 'UTF8'), 'sha256'), 'hex'),
        'medium', 'community_supported'
      );

    if v_display_address is not null then
      insert into catalog.field_provenance (
        entity_type,
        entity_id,
        field_path,
        source_record_id,
        moderation_decision_id,
        accepted_value_hash,
        confidence,
        verification_state
      )
      values (
        'place', v_place_id, 'display_address', v_source_record.id, v_decision_id,
        encode(extensions.digest(convert_to(v_display_address, 'UTF8'), 'sha256'), 'hex'),
        'medium', 'community_supported'
      );
    end if;

    insert into catalog.catalog_release_places (
      release_id,
      place_id,
      place_slug,
      canonical_name,
      category_slug,
      category_label,
      point,
      display_address,
      cuisine_labels,
      verification_state,
      source_label,
      source_attribution
    )
    values (
      v_release_id,
      v_place_id,
      v_place_slug,
      v_name,
      v_category_slug,
      v_category_label,
      v_point,
      v_display_address,
      coalesce(
        array(select jsonb_array_elements_text(v_source_record.normalized_payload->'cuisineLabels')),
        '{}'::text[]
      ),
      'community_supported',
      'Overture Maps Foundation + local review',
      '© Overture Maps Foundation, licensed CDLA Permissive 2.0; locally reviewed on 2026-10-17.'
    );

    v_approved := v_approved + 1;
  end loop;

  update catalog.catalog_releases set is_active = false where id = v_previous_release_id;

  update catalog.catalog_releases
  set is_active = true,
      published_at = now(),
      published_by = auth.uid(),
      validation_result = validation_result || jsonb_build_object(
        'approvedCreates', v_approved,
        'rejected', v_rejected
      )
  where id = v_release_id;

  return jsonb_build_object(
    'originBatchId', p_origin_batch_id,
    'releaseId', v_release_id,
    'status', 'published',
    'idempotent', false,
    'approved', v_approved,
    'rejected', v_rejected
  );
end;
$$;

create or replace function public.publish_overture_moderation_release(
  p_origin_batch_id uuid,
  p_payload jsonb
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select app_private.publish_overture_moderation_release(p_origin_batch_id, p_payload);
$$;

revoke all on table catalog.moderation_decisions from public, anon, authenticated;
revoke all on table catalog.catalog_release_moderation_decisions from public, anon, authenticated;
revoke all on function app_private.publish_overture_moderation_release(uuid, jsonb)
  from public, anon, authenticated;
revoke all on function public.publish_overture_moderation_release(uuid, jsonb)
  from public, anon, authenticated;

grant execute on function app_private.publish_overture_moderation_release(uuid, jsonb) to service_role;
grant execute on function public.publish_overture_moderation_release(uuid, jsonb) to service_role;

comment on function public.publish_overture_moderation_release(uuid, jsonb) is
  'Service-role-only transaction that records held Overture decisions and publishes approved creates in a new immutable catalog release.';
