begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'correction-evidence-quarantine',
    'correction-evidence-quarantine',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'correction-evidence',
    'correction-evidence',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  );

create or replace function app_private.can_upload_quarantined_evidence(
  p_profile_id uuid,
  p_submission_id text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_profile_id is not null
    and p_profile_id = auth.uid()
    and exists (
      select 1
      from public.submissions as owned_submission
      where owned_submission.id::text = p_submission_id
        and owned_submission.profile_id = p_profile_id
        and owned_submission.status = 'draft'
    )
    and (
      select count(*)
      from storage.objects as existing_object
      where existing_object.bucket_id = 'correction-evidence-quarantine'
        and existing_object.owner_id = p_profile_id::text
        and (storage.foldername(existing_object.name))[2] = p_submission_id
    ) < 5;
$$;

revoke all on function app_private.can_upload_quarantined_evidence(uuid, text)
from public, anon, authenticated;
grant usage on schema app_private to authenticated;
grant execute on function app_private.can_upload_quarantined_evidence(uuid, text)
to authenticated;

create policy correction_evidence_quarantine_insert_own_draft
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'correction-evidence-quarantine'
  and owner_id = (select auth.uid()::text)
  and cardinality(storage.foldername(name)) = 2
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and storage.filename(name) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and app_private.can_upload_quarantined_evidence(
    (select auth.uid()),
    (storage.foldername(name))[2]
  )
);

create policy correction_evidence_quarantine_delete_own_draft
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'correction-evidence-quarantine'
  and owner_id = (select auth.uid()::text)
  and cardinality(storage.foldername(name)) = 2
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.submissions as owned_submission
    where owned_submission.id::text = (storage.foldername(name))[2]
      and owned_submission.profile_id = (select auth.uid())
      and owned_submission.status = 'draft'
  )
);

comment on policy correction_evidence_quarantine_insert_own_draft on storage.objects is
  'Allows a signed-in user to add at most five UUID-named images to the private quarantine prefix for an owned draft submission.';

comment on policy correction_evidence_quarantine_delete_own_draft on storage.objects is
  'Allows a signed-in user to remove only their own quarantine objects while the associated submission remains a draft.';

comment on function app_private.can_upload_quarantined_evidence(uuid, text) is
  'RLS helper that validates draft ownership and enforces the five-object evidence limit without recursive Storage policies.';

commit;
