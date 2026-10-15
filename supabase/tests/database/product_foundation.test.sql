begin;

create extension if not exists pgtap with schema extensions;
select plan(32);

select has_schema('catalog', 'Canonical catalog schema exists');
select has_schema('app_private', 'Private workflow schema exists');
select hasnt_schema('stage0_geo', 'Disposable Stage 0 schema is absent from the product database');

select has_table('catalog', 'sources', 'Source registry exists');
select has_table('catalog', 'city_boundaries', 'Reviewed boundaries exist');
select has_table('catalog', 'places', 'Canonical places exist');
select has_table('catalog', 'place_locations', 'Place location history exists');
select has_table('catalog', 'source_records', 'Normalized source records exist');
select has_table('catalog', 'import_batches', 'Import batches exist');
select has_table('catalog', 'field_provenance', 'Field provenance exists');
select has_table('catalog', 'catalog_releases', 'Catalog releases exist');
select has_table('catalog', 'catalog_release_places', 'Immutable release places exist');

select has_view('public', 'place_markers', 'Restricted marker view exists');
select has_view('public', 'place_discovery', 'Restricted discovery view exists');

select has_table('public', 'profiles', 'Minimal profiles exist');
select has_table('public', 'favorites', 'Cloud favorites exist');
select has_table('public', 'wheel_lists', 'Saved wheel lists exist');
select has_table('public', 'wheel_entries', 'Saved wheel entries exist');
select has_table('public', 'submissions', 'Correction submissions exist');
select has_table('public', 'submission_changes', 'Typed submission changes exist');
select has_table('public', 'evidence_attachments', 'Private evidence metadata exists');
select has_table('public', 'submission_status_events', 'Submission status history exists');
select has_table('public', 'account_deletion_requests', 'Account deletion workflow exists');

select is(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  true,
  'Profiles enforce RLS'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.favorites'::regclass),
  true,
  'Favorites enforce RLS'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.wheel_lists'::regclass),
  true,
  'Wheel lists enforce RLS'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.wheel_entries'::regclass),
  true,
  'Wheel entries enforce RLS'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.submissions'::regclass),
  true,
  'Submissions enforce RLS'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.evidence_attachments'::regclass),
  true,
  'Evidence metadata enforces RLS'
);

select policies_are(
  'public',
  'profiles',
  array['profiles_select_own', 'profiles_update_own'],
  'Profiles expose only owner policies'
);

select policies_are(
  'public',
  'favorites',
  array['favorites_delete_own', 'favorites_insert_own', 'favorites_select_own'],
  'Favorites expose only owner policies'
);

select policies_are(
  'public',
  'submissions',
  array['submissions_select_own'],
  'Corrections are read-only to their owner until server workflows are added'
);

select * from finish();
rollback;
