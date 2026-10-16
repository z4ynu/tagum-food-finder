begin;

create extension if not exists pgtap with schema extensions;
select plan(19);

select has_function('public', 'stage_overture_import', array['jsonb'], 'Overture staging entry point exists');
select has_function('public', 'publish_overture_import', array['uuid'], 'Overture publication entry point exists');
select ok(
  not has_function_privilege('anon', 'public.stage_overture_import(jsonb)', 'execute'),
  'Anonymous callers cannot stage Overture imports'
);
select ok(
  not has_function_privilege('authenticated', 'public.publish_overture_import(uuid)', 'execute'),
  'Authenticated callers cannot publish Overture imports'
);
select ok(
  has_function_privilege('service_role', 'public.stage_overture_import(jsonb)', 'execute'),
  'The service role can stage Overture imports'
);

create temporary table baseline_stage (result jsonb);
create temporary table baseline_publish (result jsonb);
create temporary table overture_stage (result jsonb);
create temporary table overture_publish (result jsonb);
grant select, insert on baseline_stage, baseline_publish, overture_stage, overture_publish to service_role;

set local role service_role;
set local request.jwt.claim.role = 'service_role';

insert into baseline_stage
select public.stage_osm_import(
  jsonb_build_object(
    'schemaVersion', 1,
    'adapterVersion', 'osm-geojson-sequence-v1',
    'source', jsonb_build_object(
      'slug', 'openstreetmap',
      'snapshot', 'overture-test-baseline',
      'checksum', repeat('1', 64),
      'retrievedAt', '2026-10-16T00:00:00.000Z',
      'attributionText', 'OpenStreetMap contributors'
    ),
    'boundary', jsonb_build_object(
      'slug', 'tagum-city',
      'name', 'Tagum City test boundary',
      'sourceVersion', 'overture-test-boundary-1',
      'checksum', repeat('2', 64),
      'effectiveFrom', '2026-10-16',
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
        'externalRecordKey', 'node/200',
        'contentHash', repeat('3', 64),
        'normalizedPayload', jsonb_build_object(
          'name', 'Existing Cafe',
          'placeSlug', 'existing-cafe-200',
          'latitude', 7.447,
          'longitude', 125.807,
          'addressLine', null,
          'displayAddress', 'Tagum City',
          'cuisineLabels', jsonb_build_array(),
          'category', jsonb_build_object(
            'slug', 'cafe',
            'label', 'Cafe',
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
      'release', '2026-09-23.1',
      'url', 's3://overturemaps-us-west-2/release/2026-09-23.1/theme=places/type=place/*',
      'checksum', repeat('4', 64),
      'retrievedAt', '2026-10-16T01:00:00.000Z',
      'attributionText', 'Overture Maps Foundation'
    ),
    'boundary', jsonb_build_object(
      'slug', 'tagum-city',
      'checksum', repeat('2', 64)
    ),
    'summary', jsonb_build_object(
      'acceptedBeforeBoundary', 4,
      'autoPublishEligible', 2,
      'recordsRead', 4,
      'insideBoundary', 4,
      'usable', 3,
      'reviewRequired', 1,
      'unmapped', 0
    ),
    'records', jsonb_build_array(
      jsonb_build_object(
        'externalRecordKey', 'gers-duplicate',
        'contentHash', repeat('5', 64),
        'normalizedPayload', jsonb_build_object(
          'name', 'Existing Cafe',
          'placeSlug', 'existing-cafe-gers-duplicate',
          'latitude', 7.4471,
          'longitude', 125.8071,
          'addressLine', null,
          'displayAddress', 'Tagum City',
          'confidence', 0.95,
          'operatingStatus', 'open',
          'sourceUpdatedAt', '2026-09-01T00:00:00.000Z',
          'cuisineLabels', jsonb_build_array(),
          'category', jsonb_build_object('slug', 'cafe', 'label', 'Cafe', 'usability', 'usable')
        )
      ),
      jsonb_build_object(
        'externalRecordKey', 'gers-new',
        'contentHash', repeat('6', 64),
        'normalizedPayload', jsonb_build_object(
          'name', 'New Tagum Kitchen',
          'placeSlug', 'new-tagum-kitchen-gers-new',
          'latitude', 7.46,
          'longitude', 125.82,
          'addressLine', null,
          'displayAddress', 'Tagum City',
          'confidence', 0.91,
          'operatingStatus', 'open',
          'sourceUpdatedAt', '2026-09-02T00:00:00.000Z',
          'cuisineLabels', jsonb_build_array('Filipino'),
          'category', jsonb_build_object('slug', 'restaurant', 'label', 'Restaurant', 'usability', 'usable')
        )
      ),
      jsonb_build_object(
        'externalRecordKey', 'gers-low-confidence',
        'contentHash', repeat('7', 64),
        'normalizedPayload', jsonb_build_object(
          'name', 'Uncertain Cafe',
          'placeSlug', 'uncertain-cafe-gers-low',
          'latitude', 7.47,
          'longitude', 125.83,
          'addressLine', null,
          'displayAddress', null,
          'confidence', 0.4,
          'operatingStatus', 'open',
          'sourceUpdatedAt', null,
          'cuisineLabels', jsonb_build_array(),
          'category', jsonb_build_object('slug', 'cafe', 'label', 'Cafe', 'usability', 'usable')
        )
      ),
      jsonb_build_object(
        'externalRecordKey', 'gers-bar',
        'contentHash', repeat('8', 64),
        'normalizedPayload', jsonb_build_object(
          'name', 'Review Bar',
          'placeSlug', 'review-bar-gers-bar',
          'latitude', 7.48,
          'longitude', 125.84,
          'addressLine', null,
          'displayAddress', null,
          'confidence', 0.9,
          'operatingStatus', 'open',
          'sourceUpdatedAt', null,
          'cuisineLabels', jsonb_build_array(),
          'category', jsonb_build_object('slug', 'bar-with-food', 'label', 'Bar With Food', 'usability', 'review-required')
        )
      )
    )
  )
);

reset role;

select is((select result->>'status' from overture_stage), 'awaiting_review', 'Overture staging awaits review');
select is((select (result->>'created')::integer from overture_stage), 1, 'Only one Overture record is proposed');
select is((select (result->>'moderated')::integer from overture_stage), 3, 'Three Overture records require moderation');
select is(
  (select validation_errors->>0
   from catalog.import_batch_records as batch_record
   join catalog.source_records as source_record on source_record.id = batch_record.source_record_id
   where source_record.external_record_key = 'gers-duplicate'),
  'possible-existing-place-match',
  'A same-name nearby place is held as a possible duplicate'
);
select is(
  (select validation_errors->>0
   from catalog.import_batch_records as batch_record
   join catalog.source_records as source_record on source_record.id = batch_record.source_record_id
   where source_record.external_record_key = 'gers-low-confidence'),
  'confidence-below-auto-publish-threshold',
  'A low-confidence place is held for review'
);
select is(
  (select licensing_classification from catalog.source_records where external_record_key = 'gers-new'),
  'cdla-permissive-2.0',
  'Overture source records preserve their licensing classification'
);
select is((select count(*)::integer from public.place_discovery), 1, 'Staging does not change the public catalog');

set local role service_role;
set local request.jwt.claim.role = 'service_role';

insert into overture_publish
select public.publish_overture_import((select (result->>'batchId')::uuid from overture_stage));

reset role;

select is((select result->>'status' from overture_publish), 'published', 'Overture publication succeeds');
select is((select (result->>'created')::integer from overture_publish), 1, 'Publication creates one place');
select is((select count(*)::integer from public.place_discovery), 2, 'The new release retains the baseline and adds the approved place');
select ok(
  exists(select 1 from public.place_discovery where canonical_name = 'New Tagum Kitchen'),
  'The approved Overture place is public'
);
select ok(
  not exists(select 1 from public.place_discovery where canonical_name = 'Uncertain Cafe'),
  'Moderated Overture places remain private'
);
select is(
  (select source_label from public.place_discovery where canonical_name = 'New Tagum Kitchen'),
  'Overture Maps Foundation',
  'The published place carries its source label'
);

set local role service_role;
set local request.jwt.claim.role = 'service_role';
do $$
begin
  perform public.publish_overture_import((select (result->>'batchId')::uuid from overture_stage));
end;
$$;
reset role;

select is((select count(*)::integer from catalog.catalog_releases), 2, 'Republishing is idempotent');

select * from finish();
rollback;
