-- When a father joins (or an existing member loads), assign every training
-- the organization has included. Same unique (father_id, training_id) as
-- manager assign. Fathers still cannot write assignments directly.

create or replace function internal.sync_included_training_assignments(p_father_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
  inserted integer := 0;
begin
  uid := (select auth.uid());

  if uid is null then
    raise exception 'Not signed in';
  end if;

  if p_father_id is null then
    return 0;
  end if;

  if uid <> p_father_id
    and not coalesce((select public.manages_father(p_father_id)), false)
  then
    raise exception 'Not allowed';
  end if;

  insert into public.training_assignments (father_id, training_id, assigned_by)
  select
    p_father_id,
    trainings.id,
    coalesce(reviews.decided_by, groups.manager_id, p_father_id)
  from public.group_members as members
  join public.groups on groups.id = members.group_id
  join public.trainings on trainings.published is not false
  left join public.organization_training_reviews as reviews
    on reviews.group_id = members.group_id
    and reviews.training_id = trainings.id
  where members.father_id = p_father_id
    and (
      (trainings.released_at is not null and reviews.status = 'accepted')
      or (
        trainings.released_at is null
        and trainings.first_released_at is null
        and trainings.first_published_at is not null
        and coalesce(reviews.status, '') <> 'declined'
      )
    )
  on conflict (father_id, training_id) do nothing;

  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

create or replace function public.sync_included_training_assignments(p_father_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  return internal.sync_included_training_assignments(
    coalesce(p_father_id, (select auth.uid()))
  );
end;
$$;

revoke all on function internal.sync_included_training_assignments(uuid) from public, anon;
grant execute on function internal.sync_included_training_assignments(uuid)
  to authenticated, service_role;

revoke all on function public.sync_included_training_assignments(uuid) from public, anon;
grant execute on function public.sync_included_training_assignments(uuid)
  to authenticated, service_role;

comment on function public.sync_included_training_assignments(uuid) is
  'Assign included or legacy-catalog trainings to a father in his organization. Self or managing leader only. Skips rows that already exist.';

create or replace function internal.join_group_with_invite_code(invite_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized text;
  uid uuid;
  found_group_id uuid;
begin
  normalized := nullif(trim(invite_code), '');
  uid := (select auth.uid());

  if uid is null then
    raise exception 'Not signed in';
  end if;

  if normalized is null then
    raise exception 'Invalid invite code';
  end if;

  select groups.id
    into found_group_id
  from public.groups
  where groups.invite_code = normalized;

  if found_group_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.group_members (group_id, father_id)
  values (found_group_id, uid)
  on conflict (group_id, father_id) do nothing;

  perform internal.ensure_participant_claim(uid);
  perform internal.sync_included_training_assignments(uid);

  return found_group_id;
end;
$$;
