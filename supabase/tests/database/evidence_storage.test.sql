begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

select results_eq(
  $$select public from storage.buckets where id = 'correction-evidence-quarantine'$$,
  array[false],
  'Quarantine evidence bucket is private'
);
select results_eq(
  $$select public from storage.buckets where id = 'correction-evidence'$$,
  array[false],
  'Accepted evidence bucket is private'
);
select results_eq(
  $$select file_size_limit from storage.buckets where id = 'correction-evidence-quarantine'$$,
  array[5242880::bigint],
  'Quarantine evidence files are limited to 5 MiB'
);
select results_eq(
  $$select file_size_limit from storage.buckets where id = 'correction-evidence'$$,
  array[5242880::bigint],
  'Accepted evidence files are limited to 5 MiB'
);
select is(
  (select allowed_mime_types from storage.buckets where id = 'correction-evidence-quarantine'),
  array['image/jpeg', 'image/png', 'image/webp']::text[],
  'Quarantine accepts only the approved raster image MIME types'
);
select is(
  (select allowed_mime_types from storage.buckets where id = 'correction-evidence'),
  array['image/jpeg', 'image/png', 'image/webp']::text[],
  'Accepted evidence permits only the approved raster image MIME types'
);
select policies_are(
  'storage',
  'objects',
  array[
    'correction_evidence_quarantine_delete_own_draft',
    'correction_evidence_quarantine_insert_own_draft'
  ],
  'Storage objects expose only quarantine upload and draft deletion policies'
);
select results_eq(
  $$select cmd from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'correction_evidence_quarantine_insert_own_draft'$$,
  array['INSERT'],
  'Quarantine upload policy grants only inserts'
);
select results_eq(
  $$select cmd from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'correction_evidence_quarantine_delete_own_draft'$$,
  array['DELETE'],
  'Quarantine cleanup policy grants only deletes'
);
select is_empty(
  $$select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and cmd = 'SELECT'$$,
  'Authenticated users have no policy for reading quarantine or accepted evidence objects'
);
select ok(
  has_function_privilege(
    'authenticated',
    'app_private.can_upload_quarantined_evidence(uuid, text)',
    'execute'
  ),
  'Authenticated Storage policy can execute only the bounded evidence upload helper'
);
select ok(
  not has_function_privilege(
    'anon',
    'app_private.can_upload_quarantined_evidence(uuid, text)',
    'execute'
  ),
  'Anonymous users cannot invoke the evidence upload helper'
);

select * from finish();
rollback;
