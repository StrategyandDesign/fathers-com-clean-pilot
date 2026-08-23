-- Idempotent Hebrew Pilot Group (code IL) satellite seed for the Pilot project.
-- Organization locale is Hebrew. English organizations are not touched.
-- Display name is neutral. Invite code and @il logins stay the same.
--
-- Logins (password 12345):
--   manager@il   Manager
--   reviewer@il  Reviewer (scoped via profiles.home_group_id)
--   father1@il   Father
--   father2@il   Father

do $$
declare
  v_org uuid;
  v_manager uuid;
  v_reviewer uuid;
  v_father1 uuid;
  v_father2 uuid;
begin
  select id into v_org
  from public.groups
  where code = 'IL' or name in ('Hebrew Pilot Group', 'Unit 8200')
  limit 1;
  if v_org is null then
    raise exception 'Hebrew Pilot Group is missing. Create the organization and four auth users first.';
  end if;

  update public.groups
  set name = 'Hebrew Pilot Group',
      code = 'IL',
      locale = 'he',
      invite_code = coalesce(nullif(invite_code, ''), 'il')
  where id = v_org;

  select u.id into v_manager from auth.users u where u.email = 'manager@il';
  select u.id into v_reviewer from auth.users u where u.email = 'reviewer@il';
  select u.id into v_father1 from auth.users u where u.email = 'father1@il';
  select u.id into v_father2 from auth.users u where u.email = 'father2@il';

  if v_manager is null or v_reviewer is null or v_father1 is null or v_father2 is null then
    raise exception 'One or more Hebrew Pilot Group logins are missing.';
  end if;

  update public.groups set manager_id = v_manager where id = v_org;

  update public.profiles
  set role = 'manager',
      full_name = case
        when full_name is null or btrim(full_name) = '' or full_name ilike '%Unit 8200%'
          then 'Hebrew Pilot Group Leader'
        else full_name
      end,
      home_group_id = v_org
  where id = v_manager;

  update public.profiles
  set role = 'reviewer',
      full_name = case
        when full_name is null or btrim(full_name) = '' or full_name ilike '%Unit 8200%'
          then 'Hebrew Pilot Group Reviewer'
        else full_name
      end,
      locale = 'he',
      home_group_id = v_org
  where id = v_reviewer;

  update public.profiles
  set role = 'father',
      full_name = case
        when full_name is null or btrim(full_name) = '' or full_name ilike '%Unit 8200%'
          then 'Hebrew Pilot Group Father 1'
        else full_name
      end,
      home_group_id = v_org
  where id = v_father1;

  update public.profiles
  set role = 'father',
      full_name = case
        when full_name is null or btrim(full_name) = '' or full_name ilike '%Unit 8200%'
          then 'Hebrew Pilot Group Father 2'
        else full_name
      end,
      home_group_id = v_org
  where id = v_father2;

  insert into public.group_members (group_id, father_id)
  values (v_org, v_father1), (v_org, v_father2)
  on conflict (group_id, father_id) do nothing;

  delete from public.group_members
  where father_id in (v_father1, v_father2)
    and group_id <> v_org;
end
$$;
