create or replace function app_private.stage_overture_import(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch catalog.import_batches%rowtype;
  v_boundary_id uuid;
  v_existing_hash text;
  v_existing_place_id uuid;
  v_record jsonb;
  v_source_id uuid;
  v_source_record_id uuid;
  v_action text;
  v_changed boolean;
  v_validation_errors jsonb;
  v_create_count integer := 0;
  v_moderate_count integer := 0;
  v_unchanged_count integer := 0;
begin
  perform app_private.require_service_role();

  if jsonb_typeof(p_payload) <> 'object'
     or coalesce((p_payload->>'schemaVersion')::integer, 0) <> 1
     or coalesce(p_payload->>'adapterVersion', '') <> 'overture-places-jsonl-v1'
     or coalesce(p_payload#>>'{source,slug}', '') <> 'overture-places'
     or coalesce(p_payload#>>'{source,checksum}', '') !~ '^[0-9a-f]{64}$'
     or coalesce(p_payload#>>'{source,release}', '') = ''
     or coalesce(p_payload#>>'{source,retrievedAt}', '') = ''
     or coalesce(p_payload#>>'{boundary,checksum}', '') !~ '^[0-9a-f]{64}$'
     or coalesce(p_payload#>>'{boundary,slug}', '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
     or coalesce(jsonb_typeof(p_payload->'records'), '') <> 'array'
     or jsonb_array_length(coalesce(p_payload->'records', '[]'::jsonb)) > 10000 then
    raise exception 'The Overture import payload is invalid.' using errcode = '22023';
  end if;

  insert into catalog.sources (
    slug,
    display_name,
    source_type,
    homepage_url,
    license_url,
    attribution_text,
    collection_allowed,
    storage_allowed,
    display_allowed,
    modification_allowed,
    redistribution_allowed,
    raw_payload_retention_days,
    terms_reviewed_at,
    next_terms_review_due_at,
    is_active
  )
  values (
    'overture-places',
    'Overture Maps Foundation',
    'provider',
    'https://overturemaps.org',
    'https://docs.overturemaps.org/attribution/',
    p_payload#>>'{source,attributionText}',
    true,
    true,
    true,
    true,
    true,
    null,
    current_date,
    current_date + 365,
    true
  )
  on conflict (slug) do update
  set attribution_text = excluded.attribution_text,
      is_active = true,
      updated_at = now()
  returning id into v_source_id;

  select id
  into v_boundary_id
  from catalog.city_boundaries
  where slug = p_payload#>>'{boundary,slug}'
    and source_checksum = p_payload#>>'{boundary,checksum}'
    and is_current;

  if v_boundary_id is null then
    raise exception 'The approved current boundary does not match the Overture payload.'
      using errcode = '23514';
  end if;

  select *
  into v_batch
  from catalog.import_batches
  where source_id = v_source_id
    and source_checksum = p_payload#>>'{source,checksum}'
    and adapter_version = p_payload->>'adapterVersion'
    and schema_version = (p_payload->>'schemaVersion')::integer;

  if found then
    return jsonb_build_object(
      'batchId', v_batch.id,
      'status', v_batch.status,
      'idempotent', true,
      'created', v_batch.created_count,
      'moderated', v_batch.rejected_count,
      'unchanged', v_batch.unchanged_count
    );
  end if;

  insert into catalog.import_batches (
    source_id,
    trigger_type,
    status,
    source_snapshot,
    source_checksum,
    boundary_id,
    adapter_version,
    schema_version,
    started_at,
    fetched_count,
    normalized_count,
    validation_summary
  )
  values (
    v_source_id,
    'manual',
    'normalizing',
    p_payload#>>'{source,release}',
    p_payload#>>'{source,checksum}',
    v_boundary_id,
    p_payload->>'adapterVersion',
    (p_payload->>'schemaVersion')::integer,
    now(),
    (p_payload#>>'{summary,recordsRead}')::integer,
    jsonb_array_length(p_payload->'records'),
    p_payload->'summary'
  )
  returning * into v_batch;

  for v_record in select value from jsonb_array_elements(p_payload->'records')
  loop
    if coalesce(v_record->>'externalRecordKey', '') = ''
       or coalesce(v_record->>'contentHash', '') !~ '^[0-9a-f]{64}$'
       or coalesce(jsonb_typeof(v_record->'normalizedPayload'), '') <> 'object'
       or coalesce(v_record#>>'{normalizedPayload,name}', '') = ''
       or coalesce(v_record#>>'{normalizedPayload,placeSlug}', '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
       or v_record#>>'{normalizedPayload,latitude}' is null
       or (v_record#>>'{normalizedPayload,latitude}')::double precision not between -90 and 90
       or v_record#>>'{normalizedPayload,longitude}' is null
       or (v_record#>>'{normalizedPayload,longitude}')::double precision not between -180 and 180
       or coalesce(v_record#>>'{normalizedPayload,category,usability}', '') not in ('usable', 'review-required', 'unmapped')
       or (
         v_record#>>'{normalizedPayload,category,usability}' = 'usable'
         and coalesce(v_record#>>'{normalizedPayload,category,slug}', '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
       )
       or (
         v_record#>>'{normalizedPayload,confidence}' is not null
         and (v_record#>>'{normalizedPayload,confidence}')::double precision not between 0 and 1
       ) then
      raise exception 'An Overture import record is invalid.' using errcode = '22023';
    end if;

    select content_hash
    into v_existing_hash
    from catalog.source_records
    where source_id = v_source_id
      and external_record_key = v_record->>'externalRecordKey'
    order by retrieved_at desc, created_at desc
    limit 1;

    select entity_id
    into v_existing_place_id
    from catalog.external_identifiers
    where source_id = v_source_id
      and entity_type = 'place'
      and external_key = v_record->>'externalRecordKey';

    v_changed := v_existing_hash is distinct from v_record->>'contentHash';
    v_validation_errors := '[]'::jsonb;

    if v_record#>>'{normalizedPayload,category,usability}' <> 'usable' then
      v_action := 'moderate';
      v_validation_errors := jsonb_build_array('category-review-required');
    elsif coalesce((v_record#>>'{normalizedPayload,confidence}')::double precision, 0) < 0.8 then
      v_action := 'moderate';
      v_validation_errors := jsonb_build_array('confidence-below-auto-publish-threshold');
    elsif coalesce(v_record#>>'{normalizedPayload,operatingStatus}', '') = 'permanently_closed' then
      v_action := 'moderate';
      v_validation_errors := jsonb_build_array('source-reports-permanently-closed');
    elsif v_existing_place_id is not null and not v_changed then
      v_action := 'unchanged';
    elsif v_existing_place_id is not null then
      v_action := 'moderate';
      v_validation_errors := jsonb_build_array('linked-record-changed');
    elsif exists (
      select 1
      from catalog.places as place
      join catalog.place_locations as location
        on location.place_id = place.id
       and location.is_current
      where place.lifecycle_status = 'active'
        and regexp_replace(lower(place.canonical_name), '[^a-z0-9]+', '', 'g') =
            regexp_replace(lower(v_record#>>'{normalizedPayload,name}'), '[^a-z0-9]+', '', 'g')
        and extensions.st_dwithin(
          location.point,
          extensions.st_setsrid(
            extensions.st_makepoint(
              (v_record#>>'{normalizedPayload,longitude}')::double precision,
              (v_record#>>'{normalizedPayload,latitude}')::double precision
            ),
            4326
          )::extensions.geography,
          100
        )
    ) then
      v_action := 'moderate';
      v_validation_errors := jsonb_build_array('possible-existing-place-match');
    else
      v_action := 'create';
    end if;

    if v_action = 'create' then
      v_create_count := v_create_count + 1;
    elsif v_action = 'unchanged' then
      v_unchanged_count := v_unchanged_count + 1;
    else
      v_moderate_count := v_moderate_count + 1;
    end if;

    insert into catalog.source_records (
      source_id,
      external_record_key,
      normalized_payload,
      payload_schema_version,
      retrieved_at,
      source_updated_at,
      content_hash,
      licensing_classification,
      latest_seen_batch_id
    )
    values (
      v_source_id,
      v_record->>'externalRecordKey',
      v_record->'normalizedPayload',
      (p_payload->>'schemaVersion')::integer,
      (p_payload#>>'{source,retrievedAt}')::timestamptz,
      nullif(v_record#>>'{normalizedPayload,sourceUpdatedAt}', '')::timestamptz,
      v_record->>'contentHash',
      'cdla-permissive-2.0',
      v_batch.id
    )
    on conflict (source_id, external_record_key, content_hash) do update
    set normalized_payload = excluded.normalized_payload,
        payload_schema_version = excluded.payload_schema_version,
        retrieved_at = excluded.retrieved_at,
        source_updated_at = excluded.source_updated_at,
        latest_seen_batch_id = excluded.latest_seen_batch_id,
        updated_at = now()
    returning id into v_source_record_id;

    insert into catalog.import_batch_records (
      batch_id,
      source_record_id,
      normalization_state,
      boundary_result,
      validation_errors,
      content_changed,
      proposed_action
    )
    values (
      v_batch.id,
      v_source_record_id,
      'accepted',
      'inside',
      v_validation_errors,
      v_changed,
      v_action
    );
  end loop;

  update catalog.import_batches
  set status = 'awaiting_review',
      created_count = v_create_count,
      unchanged_count = v_unchanged_count,
      rejected_count = v_moderate_count,
      validation_summary = validation_summary || jsonb_build_object(
        'proposedCreates', v_create_count,
        'moderationQueue', v_moderate_count,
        'unchanged', v_unchanged_count
      )
  where id = v_batch.id;

  return jsonb_build_object(
    'batchId', v_batch.id,
    'status', 'awaiting_review',
    'idempotent', false,
    'created', v_create_count,
    'moderated', v_moderate_count,
    'unchanged', v_unchanged_count
  );
end;
$$;

create or replace function app_private.publish_overture_import(p_batch_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch catalog.import_batches%rowtype;
  v_previous_release_id uuid;
  v_release_id uuid;
  v_existing_release_id uuid;
  v_place_id uuid;
  v_record record;
  v_created integer := 0;
begin
  perform app_private.require_service_role();
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('tagum-food-finder-catalog-publication'));

  select batch.* into v_batch
  from catalog.import_batches as batch
  join catalog.sources as source on source.id = batch.source_id
  where batch.id = p_batch_id
    and source.slug = 'overture-places'
  for update of batch;

  if not found then
    raise exception 'Overture import batch was not found.' using errcode = 'P0002';
  end if;

  if v_batch.status = 'published' then
    select release_id into v_existing_release_id
    from catalog.catalog_release_batches
    where batch_id = p_batch_id;
    return jsonb_build_object(
      'batchId', p_batch_id,
      'releaseId', v_existing_release_id,
      'status', 'published',
      'idempotent', true,
      'created', v_batch.created_count
    );
  end if;

  if v_batch.status <> 'awaiting_review' then
    raise exception 'Only an awaiting-review batch can be published.' using errcode = '55000';
  end if;

  update catalog.import_batches set status = 'validating' where id = p_batch_id;

  for v_record in
    select
      source_record.id as source_record_id,
      source_record.source_id,
      source_record.external_record_key,
      source_record.normalized_payload
    from catalog.import_batch_records as batch_record
    join catalog.source_records as source_record on source_record.id = batch_record.source_record_id
    where batch_record.batch_id = p_batch_id
      and batch_record.proposed_action = 'create'
      and source_record.normalized_payload#>>'{category,usability}' = 'usable'
      and (source_record.normalized_payload->>'confidence')::double precision >= 0.8
      and coalesce(source_record.normalized_payload->>'operatingStatus', '') <> 'permanently_closed'
    order by source_record.external_record_key
  loop
    if exists (
      select 1
      from catalog.places as place
      join catalog.place_locations as location
        on location.place_id = place.id
       and location.is_current
      where place.lifecycle_status = 'active'
        and regexp_replace(lower(place.canonical_name), '[^a-z0-9]+', '', 'g') =
            regexp_replace(lower(v_record.normalized_payload->>'name'), '[^a-z0-9]+', '', 'g')
        and extensions.st_dwithin(
          location.point,
          extensions.st_setsrid(
            extensions.st_makepoint(
              (v_record.normalized_payload->>'longitude')::double precision,
              (v_record.normalized_payload->>'latitude')::double precision
            ),
            4326
          )::extensions.geography,
          100
        )
    ) then
      raise exception 'A proposed Overture create now matches an existing nearby place.'
        using errcode = '23505';
    end if;

    insert into catalog.places (
      canonical_name,
      search_name,
      lifecycle_status,
      verification_state,
      primary_category_id,
      activated_at
    )
    select
      v_record.normalized_payload->>'name',
      lower(v_record.normalized_payload->>'name'),
      'active',
      'source_supported',
      taxonomy.id,
      now()
    from catalog.taxonomies as taxonomy
    where taxonomy.taxonomy_type = 'place_category'
      and taxonomy.slug = v_record.normalized_payload#>>'{category,slug}'
      and taxonomy.is_active
    returning id into v_place_id;

    if v_place_id is null then
      raise exception 'A staged category is not publishable.' using errcode = '23514';
    end if;

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
      extensions.st_setsrid(
        extensions.st_makepoint(
          (v_record.normalized_payload->>'longitude')::double precision,
          (v_record.normalized_payload->>'latitude')::double precision
        ),
        4326
      )::extensions.geography,
      nullif(v_record.normalized_payload->>'displayAddress', ''),
      nullif(v_record.normalized_payload->>'addressLine', ''),
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
      v_record.source_id,
      'place',
      v_place_id,
      v_record.external_record_key,
      v_record.source_record_id
    );

    insert into catalog.field_provenance (
      entity_type,
      entity_id,
      field_path,
      source_record_id,
      accepted_value_hash,
      confidence,
      verification_state
    )
    values
      (
        'place', v_place_id, 'canonical_name', v_record.source_record_id,
        encode(extensions.digest(convert_to(v_record.normalized_payload->>'name', 'UTF8'), 'sha256'), 'hex'),
        'medium', 'source_supported'
      ),
      (
        'place', v_place_id, 'primary_category', v_record.source_record_id,
        encode(extensions.digest(convert_to(v_record.normalized_payload#>>'{category,slug}', 'UTF8'), 'sha256'), 'hex'),
        'medium', 'source_supported'
      ),
      (
        'place', v_place_id, 'location', v_record.source_record_id,
        encode(extensions.digest(convert_to(
          concat(v_record.normalized_payload->>'longitude', ',', v_record.normalized_payload->>'latitude'),
          'UTF8'
        ), 'sha256'), 'hex'),
        'medium', 'source_supported'
      );

    if nullif(v_record.normalized_payload->>'displayAddress', '') is not null then
      insert into catalog.field_provenance (
        entity_type,
        entity_id,
        field_path,
        source_record_id,
        accepted_value_hash,
        confidence,
        verification_state
      )
      values (
        'place',
        v_place_id,
        'display_address',
        v_record.source_record_id,
        encode(extensions.digest(convert_to(v_record.normalized_payload->>'displayAddress', 'UTF8'), 'sha256'), 'hex'),
        'low',
        'source_supported'
      );
    end if;

    v_created := v_created + 1;
  end loop;

  select id into v_previous_release_id
  from catalog.catalog_releases
  where is_active
  for update;

  insert into catalog.catalog_releases (
    validation_result,
    previous_release_id,
    rollback_target_id
  )
  values (
    jsonb_build_object(
      'batchId', p_batch_id,
      'created', v_created,
      'moderationQueue', v_batch.rejected_count,
      'sourceChecksum', v_batch.source_checksum
    ),
    v_previous_release_id,
    v_previous_release_id
  )
  returning id into v_release_id;

  if v_previous_release_id is not null then
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
  select
    v_release_id,
    place.id,
    source_record.normalized_payload->>'placeSlug',
    place.canonical_name,
    taxonomy.slug,
    taxonomy.label,
    location.point,
    location.display_address,
    coalesce(
      array(select jsonb_array_elements_text(source_record.normalized_payload->'cuisineLabels')),
      '{}'::text[]
    ),
    place.verification_state,
    source.display_name,
    source.attribution_text
  from catalog.import_batch_records as batch_record
  join catalog.source_records as source_record on source_record.id = batch_record.source_record_id
  join catalog.external_identifiers as identifier
    on identifier.source_record_id = source_record.id
   and identifier.entity_type = 'place'
  join catalog.places as place on place.id = identifier.entity_id
  join catalog.taxonomies as taxonomy on taxonomy.id = place.primary_category_id
  join catalog.place_locations as location on location.place_id = place.id and location.is_current
  join catalog.sources as source on source.id = source_record.source_id
  where batch_record.batch_id = p_batch_id
    and batch_record.proposed_action = 'create';

  if v_previous_release_id is not null then
    update catalog.catalog_releases set is_active = false where id = v_previous_release_id;
  end if;

  update catalog.catalog_releases
  set is_active = true,
      published_at = now(),
      published_by = auth.uid()
  where id = v_release_id;

  insert into catalog.catalog_release_batches (release_id, batch_id)
  values (v_release_id, p_batch_id);

  update catalog.import_batches
  set status = 'published',
      created_count = v_created,
      finished_at = now(),
      validation_summary = validation_summary || jsonb_build_object(
        'publishedCreates', v_created,
        'releaseId', v_release_id
      )
  where id = p_batch_id;

  return jsonb_build_object(
    'batchId', p_batch_id,
    'releaseId', v_release_id,
    'status', 'published',
    'idempotent', false,
    'created', v_created,
    'moderated', v_batch.rejected_count
  );
end;
$$;

create or replace function public.stage_overture_import(p_payload jsonb)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select app_private.stage_overture_import(p_payload);
$$;

create or replace function public.publish_overture_import(p_batch_id uuid)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select app_private.publish_overture_import(p_batch_id);
$$;

revoke all on function app_private.stage_overture_import(jsonb) from public, anon, authenticated;
revoke all on function app_private.publish_overture_import(uuid) from public, anon, authenticated;
revoke all on function public.stage_overture_import(jsonb) from public, anon, authenticated;
revoke all on function public.publish_overture_import(uuid) from public, anon, authenticated;

grant execute on function app_private.stage_overture_import(jsonb) to service_role;
grant execute on function app_private.publish_overture_import(uuid) to service_role;
grant execute on function public.stage_overture_import(jsonb) to service_role;
grant execute on function public.publish_overture_import(uuid) to service_role;

comment on function public.stage_overture_import(jsonb) is
  'Service-role-only entry point for staging a checksummed, normalized Overture Places snapshot.';

comment on function public.publish_overture_import(uuid) is
  'Service-role-only transaction that publishes approved Overture creates as one immutable catalog release.';
