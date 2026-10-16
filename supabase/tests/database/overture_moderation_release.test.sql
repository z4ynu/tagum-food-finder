begin;

create extension if not exists pgtap with schema extensions;
select plan(26);

select has_table('catalog', 'moderation_decisions', 'Moderation decisions exist');
select has_table(
  'catalog',
  'catalog_release_moderation_decisions',
  'Catalog releases link to applied moderation decisions'
);
select has_function(
  'public',
  'publish_overture_moderation_release',
  array['uuid', 'jsonb'],
  'Moderation publication entry point exists'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.publish_overture_moderation_release(uuid,jsonb)',
    'execute'
  ),
  'Anonymous callers cannot publish moderation decisions'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.publish_overture_moderation_release(uuid,jsonb)',
    'execute'
  ),
  'Authenticated callers cannot publish moderation decisions'
);
select ok(
  has_function_privilege(
    'service_role',
    'public.publish_overture_moderation_release(uuid,jsonb)',
    'execute'
  ),
  'The service role can publish moderation decisions'
);

create temporary table baseline_stage (result jsonb);
create temporary table baseline_publish (result jsonb);
create temporary table overture_stage (result jsonb);
create temporary table overture_publish (result jsonb);
create temporary table moderation_publish (result jsonb);
create temporary table moderation_repeat (result jsonb);
grant select, insert on
  baseline_stage,
  baseline_publish,
  overture_stage,
  overture_publish,
  moderation_publish,
  moderation_repeat
to service_role;

set local role service_role;
set local request.jwt.claim.role = 'service_role';

insert into baseline_stage
select public.stage_osm_import(
  jsonb_build_object(
    'schemaVersion', 1,
    'adapterVersion', 'osm-geojson-sequence-v1',
    'source', jsonb_build_object(
      'slug', 'openstreetmap',
      'snapshot', 'moderation-test-baseline',
      'checksum', repeat('a', 64),
      'retrievedAt', '2026-10-17T00:00:00.000Z',
      'attributionText', 'OpenStreetMap contributors'
    ),
    'boundary', jsonb_build_object(
      'slug', 'tagum-city',
      'name', 'Tagum City moderation test boundary',
      'sourceVersion', 'moderation-test-boundary-1',
      'checksum', repeat('b', 64),
      'effectiveFrom', '2026-10-17',
      'geometry', jsonb_build_object(
        'type', 'MultiPolygon',
        'coordinates', jsonb_build_array(jsonb_build_array(jsonb_build_array(
          jsonb_build_array(125.7, 7.3),
          jsonb_build_array(125.9, 7.3),
          jsonb_build_array(125.9, 7.6),
          jsonb_build_array(125.7, 7.6),
          jsonb_build_array(125.7, 7.3)
        )))
      )
    ),
    'summary', jsonb_build_object(
      'acceptedBeforeBoundary', 1,
      'recordsRead', 1,
      'insideBoundary', 1,
      'usable', 1,
      'reviewRequired', 0
    ),
    'records', jsonb_build_array(
      jsonb_build_object(
        'externalRecordKey', 'node/moderation-baseline',
        'contentHash', repeat('c', 64),
        'normalizedPayload', jsonb_build_object(
          'name', 'Baseline Place',
          'placeSlug', 'baseline-place-moderation',
          'latitude', 7.44,
          'longitude', 125.80,
          'addressLine', null,
          'displayAddress', 'Tagum City',
          'cuisineLabels', jsonb_build_array(),
          'category', jsonb_build_object(
            'slug', 'restaurant',
            'label', 'Restaurant',
            'usability', 'usable'
          )
        )
      )
    )
  )
);

insert into baseline_publish
select public.publish_osm_import((select (result->>'batchId')::uuid from baseline_stage));

insert into overture_stage
select public.stage_overture_import(
  jsonb_build_object(
    'schemaVersion', 1,
    'adapterVersion', 'overture-places-jsonl-v1',
    'source', jsonb_build_object(
      'slug', 'overture-places',
      'release', '2026-09-23.1-moderation-test',
      'url', 's3://example.test/moderation',
      'checksum', repeat('d', 64),
      'retrievedAt', '2026-10-17T01:00:00.000Z',
      'attributionText', 'Overture Maps Foundation'
    ),
    'boundary', jsonb_build_object(
      'slug', 'tagum-city',
      'checksum', repeat('b', 64)
    ),
    'summary', jsonb_build_object(
      'acceptedBeforeBoundary', 2,
      'autoPublishEligible', 0,
      'recordsRead', 2,
      'insideBoundary', 2,
      'usable', 2,
      'reviewRequired', 0,
      'unmapped', 0
    ),
    'records', jsonb_build_array(
      jsonb_build_object(
        'externalRecordKey', 'held-approve',
        'contentHash', repeat('e', 64),
        'normalizedPayload', jsonb_build_object(
          'name', 'Held Cafe',
          'placeSlug', 'held-cafe-source',
          'latitude', 7.46,
          'longitude', 125.82,
          'displayAddress', 'Old address',
          'confidence', 0.77,
          'operatingStatus', 'open',
          'sourceUpdatedAt', null,
          'cuisineLabels', jsonb_build_array('Cafe'),
          'category', jsonb_build_object('slug', 'cafe', 'label', 'Cafe', 'usability', 'usable')
        )
      ),
      jsonb_build_object(
        'externalRecordKey', 'held-reject',
        'contentHash', repeat('f', 64),
        'normalizedPayload', jsonb_build_object(
          'name', 'Closed Branch',
          'placeSlug', 'closed-branch-source',
          'latitude', 7.47,
          'longitude', 125.83,
          'displayAddress', 'Tagum City',
          'confidence', 0.77,
          'operatingStatus', 'open',
          'sourceUpdatedAt', null,
          'cuisineLabels', jsonb_build_array(),
          'category', jsonb_build_object('slug', 'fast-food', 'label', 'Fast Food', 'usability', 'usable')
        )
      )
    )
  )
);

insert into overture_publish
select public.publish_overture_import((select (result->>'batchId')::uuid from overture_stage));

reset role;

select is((select (result->>'moderated')::integer from overture_stage), 2, 'Both records require moderation');
select is((select count(*)::integer from public.place_discovery), 1, 'Publishing the origin batch keeps held records private');

set local role service_role;
set local request.jwt.claim.role = 'service_role';

insert into moderation_publish
select public.publish_overture_moderation_release(
  (select (result->>'batchId')::uuid from overture_stage),
  jsonb_build_object(
    'schemaVersion', 1,
    'decisions', jsonb_build_array(
      jsonb_build_object(
        'externalRecordKey', 'held-approve',
        'outcome', 'approve_create',
        'reasonCode', 'operator-confirmed-active',
        'rationale', 'The project operator confirmed the active branch and corrected location.',
        'acceptedFields', jsonb_build_object(
          'canonicalName', 'Reviewed Cafe',
          'placeSlug', 'reviewed-cafe',
          'displayAddress', 'Corrected address, Tagum City',
          'latitude', 7.45,
          'longitude', 125.81
        ),
        'evidence', jsonb_build_array(jsonb_build_object('type', 'operator-confirmation', 'date', '2026-10-17'))
      ),
      jsonb_build_object(
        'externalRecordKey', 'held-reject',
        'outcome', 'reject',
        'reasonCode', 'operator-confirmed-closed',
        'rationale', 'The project operator confirmed that this branch is closed.',
        'acceptedFields', jsonb_build_object(),
        'evidence', jsonb_build_array(jsonb_build_object('type', 'operator-confirmation', 'date', '2026-10-17'))
      )
    )
  )
);

reset role;

select is((select result->>'status' from moderation_publish), 'published', 'Moderation publication succeeds');
select is((select (result->>'approved')::integer from moderation_publish), 1, 'One held record is approved');
select is((select (result->>'rejected')::integer from moderation_publish), 1, 'One held record is rejected');
select is((select count(*)::integer from public.place_discovery), 2, 'The new release carries forward the baseline and adds one place');
select ok(
  exists(select 1 from public.place_discovery where place_slug = 'reviewed-cafe'),
  'The operator-approved place is public'
);
select ok(
  not exists(select 1 from public.place_discovery where canonical_name = 'Closed Branch'),
  'The rejected record remains private'
);
select is(
  (select round(latitude::numeric, 2) from public.place_discovery where place_slug = 'reviewed-cafe'),
  7.45::numeric,
  'The accepted latitude override is published'
);
select is(
  (select round(longitude::numeric, 2) from public.place_discovery where place_slug = 'reviewed-cafe'),
  125.81::numeric,
  'The accepted longitude override is published'
);
select is(
  (select display_address from public.place_discovery where place_slug = 'reviewed-cafe'),
  'Corrected address, Tagum City',
  'The accepted address override is published'
);
select is((select count(*)::integer from catalog.moderation_decisions), 2, 'Both decisions are recorded');
select is(
  (select count(*)::integer from catalog.catalog_release_moderation_decisions),
  2,
  'The release links both decisions'
);
select is(
  (
    select count(*)::integer
    from catalog.field_provenance
    where moderation_decision_id is not null
  ),
  4,
  'Published fields link to the approval decision'
);
select is(
  (select source_label from public.place_discovery where place_slug = 'reviewed-cafe'),
  'Overture Maps Foundation + local review',
  'The public source label discloses local review'
);
select is(
  (select count(*)::integer from catalog.catalog_releases where is_active),
  1,
  'Exactly one release remains active'
);
select is((select count(*)::integer from catalog.catalog_releases), 3, 'The immutable moderation release is added');

set local role service_role;
set local request.jwt.claim.role = 'service_role';

insert into moderation_repeat
select public.publish_overture_moderation_release(
  (select (result->>'batchId')::uuid from overture_stage),
  jsonb_build_object(
    'schemaVersion', 1,
    'decisions', jsonb_build_array(
      jsonb_build_object(
        'externalRecordKey', 'held-approve',
        'outcome', 'approve_create',
        'reasonCode', 'operator-confirmed-active',
        'rationale', 'The project operator confirmed the active branch and corrected location.',
        'acceptedFields', jsonb_build_object(
          'canonicalName', 'Reviewed Cafe',
          'placeSlug', 'reviewed-cafe',
          'displayAddress', 'Corrected address, Tagum City',
          'latitude', 7.45,
          'longitude', 125.81
        ),
        'evidence', jsonb_build_array(jsonb_build_object('type', 'operator-confirmation', 'date', '2026-10-17'))
      ),
      jsonb_build_object(
        'externalRecordKey', 'held-reject',
        'outcome', 'reject',
        'reasonCode', 'operator-confirmed-closed',
        'rationale', 'The project operator confirmed that this branch is closed.',
        'acceptedFields', jsonb_build_object(),
        'evidence', jsonb_build_array(jsonb_build_object('type', 'operator-confirmation', 'date', '2026-10-17'))
      )
    )
  )
);

reset role;

select ok((select (result->>'idempotent')::boolean from moderation_repeat), 'Repeating the same review is idempotent');
select is((select count(*)::integer from catalog.catalog_releases), 3, 'Idempotent replay creates no release');
select is((select count(*)::integer from catalog.moderation_decisions), 2, 'Idempotent replay creates no decisions');

select * from finish();
rollback;
