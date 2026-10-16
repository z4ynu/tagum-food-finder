begin;

create extension if not exists pgtap with schema extensions;
select plan(24);

select has_table('storage', 'buckets', 'Storage buckets exist');
select is(
  (select public from storage.buckets where id = 'place-media'),
  true,
  'Published place media uses a public bucket'
);
select is(
  (select file_size_limit from storage.buckets where id = 'place-media'),
  2097152::bigint,
  'Published variants are limited to 2 MiB'
);
select is(
  (select allowed_mime_types from storage.buckets where id = 'place-media'),
  array['image/jpeg', 'image/webp']::text[],
  'Published variants allow only JPEG and WebP'
);
select has_table('catalog', 'place_media', 'Rights-reviewed place media metadata exists');
select has_view('public', 'place_media', 'Published place media view exists');
select has_function(
  'public',
  'publish_place_media',
  array[
    'text', 'text', 'text', 'integer', 'integer', 'integer', 'text', 'text',
    'text', 'text', 'text', 'text', 'text', 'text', 'integer', 'timestamp with time zone'
  ],
  'Place media publication entry point exists'
);
select has_function(
  'public',
  'withdraw_place_media',
  array['uuid', 'text'],
  'Place media withdrawal entry point exists'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.publish_place_media(text,text,text,integer,integer,integer,text,text,text,text,text,text,text,text,integer,timestamptz)',
    'execute'
  ),
  'Anonymous callers cannot publish place media'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.publish_place_media(text,text,text,integer,integer,integer,text,text,text,text,text,text,text,text,integer,timestamptz)',
    'execute'
  ),
  'Authenticated callers cannot publish place media'
);
select ok(
  has_function_privilege(
    'service_role',
    'public.publish_place_media(text,text,text,integer,integer,integer,text,text,text,text,text,text,text,text,integer,timestamptz)',
    'execute'
  ),
  'The service role can publish place media'
);
select ok(
  has_table_privilege('anon', 'public.place_media', 'select'),
  'Anonymous discovery can read published media metadata'
);
select ok(
  not has_table_privilege('anon', 'catalog.place_media', 'select'),
  'Anonymous discovery cannot read the complete media rights record'
);

create temporary table baseline_stage (result jsonb);
create temporary table baseline_publish (result jsonb);
create temporary table media_publish (media_id uuid);
create temporary table media_place (place_id uuid, object_path text);
grant select, insert on baseline_stage, baseline_publish, media_publish, media_place to service_role;

set local role service_role;
set local request.jwt.claim.role = 'service_role';

insert into baseline_stage
select public.stage_osm_import(
  jsonb_build_object(
    'schemaVersion', 1,
    'adapterVersion', 'osm-geojson-sequence-v1',
    'source', jsonb_build_object(
      'slug', 'openstreetmap',
      'snapshot', 'media-test-baseline',
      'checksum', repeat('1', 64),
      'retrievedAt', '2026-10-17T02:00:00.000Z',
      'attributionText', 'OpenStreetMap contributors'
    ),
    'boundary', jsonb_build_object(
      'slug', 'tagum-city',
      'name', 'Tagum City media test boundary',
      'sourceVersion', 'media-test-boundary-1',
      'checksum', repeat('2', 64),
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
        'externalRecordKey', 'node/media-place',
        'contentHash', repeat('3', 64),
        'normalizedPayload', jsonb_build_object(
          'name', 'Media Test Cafe',
          'placeSlug', 'media-test-cafe',
          'latitude', 7.45,
          'longitude', 125.81,
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

reset role;

insert into media_place
select
  place_id,
  place_id::text || '/11111111-1111-4111-8111-111111111111.webp'
from public.place_discovery
where place_slug = 'media-test-cafe';

insert into storage.objects (bucket_id, name, metadata)
select
  'place-media',
  object_path,
  jsonb_build_object('mimetype', 'image/webp', 'size', 12345)
from media_place;

set local role service_role;
set local request.jwt.claim.role = 'service_role';

insert into media_publish
select public.publish_place_media(
  'media-test-cafe',
  (select object_path from media_place),
  'image/webp',
  1280,
  853,
  12345,
  repeat('4', 64),
  'project_owned',
  'project-photo:2026-10-17',
  null,
  null,
  null,
  null,
  'Front of Media Test Cafe in Tagum City',
  0,
  '2026-10-16T02:30:00.000Z'
);

reset role;

select ok((select media_id is not null from media_publish), 'A processed image can be published');
select is((select count(*)::integer from public.place_media), 1, 'The public view exposes the image');
select is((select place_slug from public.place_media), 'media-test-cafe', 'The image is linked to the active place');
select is(
  (select publication_state from catalog.place_media where id = (select media_id from media_publish)),
  'published',
  'The rights record is published'
);
select is(
  (select rights_basis from catalog.place_media where id = (select media_id from media_publish)),
  'project_owned',
  'The rights basis is retained privately'
);

set local role service_role;
set local request.jwt.claim.role = 'service_role';

select throws_ok(
  $$
    select public.publish_place_media(
      'media-test-cafe',
      (select place_id::text || '/22222222-2222-4222-8222-222222222222.webp' from media_place),
      'image/webp', 1280, 853, 12345, repeat('5', 64), 'project_owned',
      'project-photo:missing', null, null, null, null, 'Missing processed image', 1,
      '2026-10-16T02:30:00.000Z'
    )
  $$,
  'P0002',
  'The processed public media object was not found.',
  'Publication rejects missing Storage objects'
);

select throws_ok(
  format(
    'select public.withdraw_place_media(%L::uuid, %L)',
    (select media_id from media_publish),
    'Rights withdrawn'
  ),
  '55000',
  'Remove the public Storage object before recording withdrawal.',
  'Withdrawal is blocked while the public object remains current'
);

reset role;

update storage.objects
set archived_at = now(),
    is_delete_marker = true
where bucket_id = 'place-media'
  and name = (select object_path from catalog.place_media where id = (select media_id from media_publish));

set local role service_role;
set local request.jwt.claim.role = 'service_role';
select public.withdraw_place_media((select media_id from media_publish), 'Rights withdrawn');
select public.withdraw_place_media((select media_id from media_publish), 'Rights withdrawn');
reset role;

select is((select count(*)::integer from public.place_media), 0, 'Withdrawn media leaves the public view');
select is(
  (select publication_state from catalog.place_media where id = (select media_id from media_publish)),
  'withdrawn',
  'The immutable rights record carries the withdrawal state'
);
select is(
  (select withdrawal_reason from catalog.place_media where id = (select media_id from media_publish)),
  'Rights withdrawn',
  'The takedown reason is recorded'
);
select ok(
  (select withdrawn_at is not null from catalog.place_media where id = (select media_id from media_publish)),
  'The takedown time is recorded and repeated withdrawal is safe'
);

select * from finish();
rollback;
