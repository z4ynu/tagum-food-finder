create type public.account_status as enum ('active', 'deletion_requested', 'disabled', 'deleted');
create type public.submission_status as enum (
  'draft',
  'submitted',
  'in_review',
  'needs_information',
  'partially_approved',
  'approved',
  'rejected',
  'withdrawn'
);

create type public.submission_review_state as enum (
  'pending',
  'accepted',
  'rejected',
  'needs_information'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  account_status public.account_status not null default 'active',
  theme_preference text not null default 'system' check (theme_preference in ('system', 'light', 'dark')),
  navigation_provider text not null default 'ask' check (navigation_provider in ('ask', 'google_maps', 'waze')),
  locale text not null default 'en-PH' check (char_length(locale) between 2 and 20),
  privacy_notice_version text,
  privacy_notice_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deletion_completed_at timestamptz,
  constraint profiles_deleted_state_consistent check (
    (account_status = 'deleted' and deletion_completed_at is not null)
    or (account_status <> 'deleted' and deletion_completed_at is null)
  )
);

create table public.favorites (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  place_id uuid not null references catalog.places(id),
  created_at timestamptz not null default now(),
  primary key (profile_id, place_id)
);

create table public.wheel_lists (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  sort_position integer not null default 0 check (sort_position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index wheel_lists_owner_order_idx
  on public.wheel_lists (profile_id, sort_position, created_at);

create table public.wheel_entries (
  id uuid primary key default extensions.gen_random_uuid(),
  wheel_list_id uuid not null references public.wheel_lists(id) on delete cascade,
  position integer not null check (position between 0 and 49),
  place_id uuid references catalog.places(id),
  label_snapshot text not null check (char_length(label_snapshot) between 1 and 160),
  entry_kind text not null check (entry_kind in ('place', 'custom')),
  duplicate_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (wheel_list_id, position),
  constraint wheel_entries_kind_consistent check (
    (entry_kind = 'place' and place_id is not null)
    or (entry_kind = 'custom' and place_id is null)
  )
);

create table public.submissions (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  place_id uuid references catalog.places(id),
  issue_type text not null check (
    issue_type in (
      'missing_place',
      'wrong_details',
      'wrong_location',
      'price_information',
      'opening_hours',
      'closed_or_moved',
      'duplicate_place',
      'other'
    )
  ),
  public_reference text not null unique check (public_reference ~ '^TFF-[A-Z0-9]{10}$'),
  status public.submission_status not null default 'draft',
  user_summary text check (user_summary is null or char_length(user_summary) <= 1000),
  policy_version text not null,
  rights_confirmed_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint submissions_submission_fields check (
    status = 'draft'
    or (submitted_at is not null and rights_confirmed_at is not null)
  )
);

create index submissions_owner_created_idx
  on public.submissions (profile_id, created_at desc);

create index submissions_moderation_queue_idx
  on public.submissions (status, submitted_at)
  where status in ('submitted', 'in_review', 'needs_information');

create table public.submission_changes (
  id uuid primary key default extensions.gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  change_type text not null check (
    change_type in (
      'create_place',
      'name',
      'location',
      'category',
      'cuisine',
      'price_range',
      'opening_hours',
      'lifecycle_status',
      'contact',
      'other'
    )
  ),
  schema_version integer not null check (schema_version > 0),
  validated_payload jsonb not null check (jsonb_typeof(validated_payload) = 'object'),
  target_field text not null,
  proposed_value_hash text not null check (proposed_value_hash ~ '^[0-9a-f]{64}$'),
  review_state public.submission_review_state not null default 'pending',
  accepted_provenance_id uuid references catalog.field_provenance(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint submission_changes_acceptance_consistent check (
    (review_state = 'accepted' and accepted_provenance_id is not null)
    or (review_state <> 'accepted' and accepted_provenance_id is null)
  )
);

create table public.evidence_attachments (
  id uuid primary key default extensions.gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  object_key text not null unique,
  safe_filename text not null check (char_length(safe_filename) between 1 and 180),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  byte_size integer not null check (byte_size between 1 and 5242880),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  width_pixels integer check (width_pixels > 0),
  height_pixels integer check (height_pixels > 0),
  upload_state text not null check (upload_state in ('quarantined', 'validating', 'accepted', 'rejected', 'deleted')),
  scan_state text not null default 'not_required' check (scan_state in ('not_required', 'pending', 'clear', 'failed')),
  exif_removed boolean not null default false,
  rights_confirmed_at timestamptz not null,
  retention_class text not null check (retention_class in ('draft', 'pending_review', 'accepted', 'rejected')),
  delete_due_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint evidence_attachments_dimensions_complete check (
    (width_pixels is null and height_pixels is null)
    or (width_pixels is not null and height_pixels is not null and width_pixels * height_pixels <= 20000000)
  )
);

create index evidence_attachments_retention_idx
  on public.evidence_attachments (delete_due_at)
  where upload_state <> 'deleted';

create table public.submission_status_events (
  id uuid primary key default extensions.gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  from_status public.submission_status,
  to_status public.submission_status not null,
  public_message text check (public_message is null or char_length(public_message) <= 500),
  created_at timestamptz not null default now()
);

create table public.account_deletion_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('requested', 'confirmed', 'processing', 'completed', 'failed')),
  requested_at timestamptz not null default now(),
  confirmed_at timestamptz,
  completed_at timestamptz,
  failure_code text,
  updated_at timestamptz not null default now()
);

create unique index account_deletion_requests_one_open
  on public.account_deletion_requests (profile_id)
  where status in ('requested', 'confirmed', 'processing');

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function app_private.set_updated_at();

create trigger wheel_lists_set_updated_at
before update on public.wheel_lists
for each row execute function app_private.set_updated_at();

create trigger wheel_entries_set_updated_at
before update on public.wheel_entries
for each row execute function app_private.set_updated_at();

create trigger submissions_set_updated_at
before update on public.submissions
for each row execute function app_private.set_updated_at();

create trigger submission_changes_set_updated_at
before update on public.submission_changes
for each row execute function app_private.set_updated_at();

create trigger evidence_attachments_set_updated_at
before update on public.evidence_attachments
for each row execute function app_private.set_updated_at();

create trigger account_deletion_requests_set_updated_at
before update on public.account_deletion_requests
for each row execute function app_private.set_updated_at();

create or replace function app_private.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger create_profile_after_auth_user
after insert on auth.users
for each row execute function app_private.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.favorites enable row level security;
alter table public.wheel_lists enable row level security;
alter table public.wheel_entries enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_changes enable row level security;
alter table public.evidence_attachments enable row level security;
alter table public.submission_status_events enable row level security;
alter table public.account_deletion_requests enable row level security;

create policy profiles_select_own
on public.profiles for select
to authenticated
using (id = (select auth.uid()));

create policy profiles_update_own
on public.profiles for update
to authenticated
using (id = (select auth.uid()) and account_status = 'active')
with check (id = (select auth.uid()) and account_status = 'active');

create policy favorites_select_own
on public.favorites for select
to authenticated
using (profile_id = (select auth.uid()));

create policy favorites_insert_own
on public.favorites for insert
to authenticated
with check (profile_id = (select auth.uid()));

create policy favorites_delete_own
on public.favorites for delete
to authenticated
using (profile_id = (select auth.uid()));

create policy wheel_lists_select_own
on public.wheel_lists for select
to authenticated
using (profile_id = (select auth.uid()));

create policy wheel_lists_insert_own
on public.wheel_lists for insert
to authenticated
with check (profile_id = (select auth.uid()));

create policy wheel_lists_update_own
on public.wheel_lists for update
to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));

create policy wheel_lists_delete_own
on public.wheel_lists for delete
to authenticated
using (profile_id = (select auth.uid()));

create policy wheel_entries_select_own
on public.wheel_entries for select
to authenticated
using (
  exists (
    select 1
    from public.wheel_lists as owned_list
    where owned_list.id = wheel_entries.wheel_list_id
      and owned_list.profile_id = (select auth.uid())
  )
);

create policy wheel_entries_insert_own
on public.wheel_entries for insert
to authenticated
with check (
  exists (
    select 1
    from public.wheel_lists as owned_list
    where owned_list.id = wheel_entries.wheel_list_id
      and owned_list.profile_id = (select auth.uid())
  )
);

create policy wheel_entries_update_own
on public.wheel_entries for update
to authenticated
using (
  exists (
    select 1
    from public.wheel_lists as owned_list
    where owned_list.id = wheel_entries.wheel_list_id
      and owned_list.profile_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.wheel_lists as owned_list
    where owned_list.id = wheel_entries.wheel_list_id
      and owned_list.profile_id = (select auth.uid())
  )
);

create policy wheel_entries_delete_own
on public.wheel_entries for delete
to authenticated
using (
  exists (
    select 1
    from public.wheel_lists as owned_list
    where owned_list.id = wheel_entries.wheel_list_id
      and owned_list.profile_id = (select auth.uid())
  )
);

create policy submissions_select_own
on public.submissions for select
to authenticated
using (profile_id = (select auth.uid()));

create policy submission_changes_select_own
on public.submission_changes for select
to authenticated
using (
  exists (
    select 1
    from public.submissions as owned_submission
    where owned_submission.id = submission_changes.submission_id
      and owned_submission.profile_id = (select auth.uid())
  )
);

create policy evidence_attachments_select_own
on public.evidence_attachments for select
to authenticated
using (
  exists (
    select 1
    from public.submissions as owned_submission
    where owned_submission.id = evidence_attachments.submission_id
      and owned_submission.profile_id = (select auth.uid())
  )
);

create policy submission_status_events_select_own
on public.submission_status_events for select
to authenticated
using (
  exists (
    select 1
    from public.submissions as owned_submission
    where owned_submission.id = submission_status_events.submission_id
      and owned_submission.profile_id = (select auth.uid())
  )
);

create policy account_deletion_requests_select_own
on public.account_deletion_requests for select
to authenticated
using (profile_id = (select auth.uid()));

revoke all on public.profiles from anon, authenticated;
revoke all on public.favorites from anon, authenticated;
revoke all on public.wheel_lists from anon, authenticated;
revoke all on public.wheel_entries from anon, authenticated;
revoke all on public.submissions from anon, authenticated;
revoke all on public.submission_changes from anon, authenticated;
revoke all on public.evidence_attachments from anon, authenticated;
revoke all on public.submission_status_events from anon, authenticated;
revoke all on public.account_deletion_requests from anon, authenticated;

grant select, update (theme_preference, navigation_provider, locale, privacy_notice_version, privacy_notice_accepted_at)
on public.profiles to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select, insert, update (name, sort_position), delete on public.wheel_lists to authenticated;
grant select, insert, update (position, label_snapshot, duplicate_confirmed), delete on public.wheel_entries to authenticated;
grant select on public.submissions, public.submission_changes, public.evidence_attachments,
  public.submission_status_events, public.account_deletion_requests to authenticated;

revoke all on all functions in schema app_private from public, anon, authenticated;

comment on schema app_private is
  'Unexposed trigger and transactional workflow functions.';

comment on table public.submissions is
  'Account-owned correction envelopes; writes occur only through protected server workflows.';

comment on table public.evidence_attachments is
  'Private evidence metadata only; object bytes remain in private Storage.';
