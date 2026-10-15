begin;

create extension if not exists pgtap with schema extensions;
select plan(15);

select has_function('public', 'stage_osm_import', array['jsonb'], 'OSM staging entry point exists');
select has_function('public', 'publish_osm_import', array['uuid'], 'OSM publication entry point exists');
select ok(
  not has_function_privilege('anon', 'public.stage_osm_import(jsonb)', 'execute'),
  'Anonymous callers cannot stage imports'
);
select ok(
  not has_function_privilege('authenticated', 'public.publish_osm_import(uuid)', 'execute'),
  'Authenticated callers cannot publish imports'
);
select ok(
  has_function_privilege('service_role', 'public.stage_osm_import(jsonb)', 'execute'),
  'The service role can stage imports'
);

create temporary table staged_result (result jsonb);
create temporary table published_result (result jsonb);
grant select, insert on staged_result, published_result to service_role;

set local role service_role;
set local request.jwt.claim.role = 'service_role';

insert into staged_result
select public.stage_osm_import(
  jsonb_build_object(
    'schemaVersion', 1,
    'adapterVersion', 'osm-geojson-sequence-v1',
    'source', jsonb_build_object(
      'slug', 'openstreetmap',
      'snapshot', 'test-snapshot-1',
      'checksum', repeat('a', 64),
      'retrievedAt', '2026-10-15T00:00:00.000Z',
      'attributionText', 'OpenStreetMap contributors'
    ),
    'boundary', jsonb_build_object(
      'slug', 'tagum-city',
      'name', 'Tagum City test boundary',
      'sourceVersion', 'test-boundary-1',
      'checksum', repeat('b', 64),
      'effectiveFrom', '2026-10-15',
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
      'acceptedBeforeBoundary', 2,
      'recordsRead', 2,
      'insideBoundary', 2,
      'usable', 1,
      'reviewRequired', 1
    ),
    'records', jsonb_build_array(
      jsonb_build_object(
        'externalRecordKey', 'node/100',
        'contentHash', repeat('c', 64),
        'normalizedPayload', jsonb_build_object(
          'name', 'Test Cafe',
          'placeSlug', 'test-cafe-100',
          'latitude', 7.447,
          'longitude', 125.807,
          'addressLine', null,
          'displayAddress', 'Tagum City',
          'cuisineLabels', jsonb_build_array('coffee'),
          'category', jsonb_build_object(
            'slug', 'cafe',
            'label', 'Cafe',
            'usability', 'usable'
          )
        )
      ),
      jsonb_build_object(
        'externalRecordKey', 'node/101',
        'contentHash', repeat('d', 64),
        'normalizedPayload', jsonb_build_object(
          'name', 'Review Deli',
          'placeSlug', 'review-deli-101',
          'latitude', 7.448,
          'longitude', 125.808,
          'addressLine', null,
          'displayAddress', null,
          'cuisineLabels', jsonb_build_array(),
          'category', jsonb_build_object(
            'slug', 'prepared-food-shop',
            'label', 'Prepared Food Shop',
            'usability', 'review-required'
          )
        )
      )
    )
  )
);

reset role;

select is((select result->>'status' from staged_result), 'awaiting_review', 'Staging awaits review');
select is((select (result->>'created')::integer from staged_result), 1, 'One usable record is proposed');
select is((select (result->>'moderated')::integer from staged_result), 1, 'One ambiguous record is moderated');
select is((select count(*)::integer from public.place_discovery), 0, 'Staging does not publish places');

set local role service_role;
set local request.jwt.claim.role = 'service_role';

insert into published_result
select public.publish_osm_import((select (result->>'batchId')::uuid from staged_result));

reset role;

select is((select result->>'status' from published_result), 'published', 'Publication succeeds');
select is((select count(*)::integer from public.place_discovery), 1, 'Only the usable record is public');
select is((select canonical_name from public.place_discovery), 'Test Cafe', 'Published place is correct');
select is((select count(*)::integer from catalog.catalog_releases where is_active), 1, 'One release is active');
select is(
  (select proposed_action from catalog.import_batch_records as batch_record
   join catalog.source_records as source_record on source_record.id = batch_record.source_record_id
   where source_record.external_record_key = 'node/101'),
  'moderate',
  'Review-required source data remains in moderation'
);

set local role service_role;
set local request.jwt.claim.role = 'service_role';
do $$
begin
  perform public.publish_osm_import((select (result->>'batchId')::uuid from staged_result));
end;
$$;
reset role;

select is((select count(*)::integer from catalog.catalog_releases), 1, 'Republishing is idempotent');

select * from finish();
rollback;
