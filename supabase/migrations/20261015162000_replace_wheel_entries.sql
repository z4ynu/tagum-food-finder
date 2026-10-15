create or replace function public.replace_wheel_entries(
  p_wheel_list_id uuid,
  p_entries jsonb
)
returns setof public.wheel_entries
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if jsonb_typeof(p_entries) <> 'array' then
    raise exception 'Wheel entries must be a JSON array.' using errcode = '22023';
  end if;

  if jsonb_array_length(p_entries) > 50 then
    raise exception 'A wheel can contain at most 50 entries.' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.wheel_lists as owned_list
    where owned_list.id = p_wheel_list_id
      and owned_list.profile_id = (select auth.uid())
  ) then
    raise exception 'Wheel list not found.' using errcode = '42501';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_entries) as entry(value)
    where jsonb_typeof(entry.value) <> 'object'
      or entry.value ->> 'entry_kind' not in ('place', 'custom')
      or nullif(btrim(entry.value ->> 'label_snapshot'), '') is null
      or char_length(btrim(entry.value ->> 'label_snapshot')) > 80
      or (
        entry.value ->> 'entry_kind' = 'place'
        and (
          entry.value ->> 'place_id' is null
          or not exists (
            select 1
            from public.place_discovery as active_place
            where active_place.place_id = (entry.value ->> 'place_id')::uuid
          )
        )
      )
      or (
        entry.value ->> 'entry_kind' = 'custom'
        and entry.value ->> 'place_id' is not null
      )
  ) then
    raise exception 'Wheel entry payload is invalid.' using errcode = '22023';
  end if;

  delete from public.wheel_entries
  where wheel_list_id = p_wheel_list_id;

  insert into public.wheel_entries (
    wheel_list_id,
    position,
    place_id,
    label_snapshot,
    entry_kind,
    duplicate_confirmed
  )
  select
    p_wheel_list_id,
    entry.ordinality - 1,
    case
      when entry.value ->> 'entry_kind' = 'place'
        then (entry.value ->> 'place_id')::uuid
      else null
    end,
    btrim(entry.value ->> 'label_snapshot'),
    entry.value ->> 'entry_kind',
    false
  from jsonb_array_elements(p_entries) with ordinality as entry(value, ordinality)
  order by entry.ordinality;

  return query
  select saved_entry.*
  from public.wheel_entries as saved_entry
  where saved_entry.wheel_list_id = p_wheel_list_id
  order by saved_entry.position;
end;
$$;

revoke all on function public.replace_wheel_entries(uuid, jsonb) from public, anon;
grant execute on function public.replace_wheel_entries(uuid, jsonb) to authenticated;

comment on function public.replace_wheel_entries(uuid, jsonb) is
  'Atomically replaces an authenticated owner''s ordered wheel entries under RLS.';
