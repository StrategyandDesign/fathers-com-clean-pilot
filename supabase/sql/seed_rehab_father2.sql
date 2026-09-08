-- Idempotent REHAB starting-out father seat for the Pilot project.
-- Auth user father2@rehab must already exist (password 12345).
-- This script only wires organization, role, and unstarted assignments.
--
-- Login: father2@rehab / 12345
-- Organization: REHAB (same desk as manager@rehab and father1@rehab)
-- Progress: none. Same four training assignments as father1@rehab.

do $$
declare
  v_org uuid;
  v_manager uuid;
  v_father1 uuid;
  v_father2 uuid;
begin
  select id into v_org
  from public.groups
  where name = 'REHAB'
  limit 1;

  if v_org is null then
    raise exception 'REHAB is missing. Create the organization first.';
  end if;

  select u.id into v_manager from auth.users u where u.email = 'manager@rehab';
  select u.id into v_father1 from auth.users u where u.email = 'father1@rehab';
  select u.id into v_father2 from auth.users u where u.email = 'father2@rehab';

  if v_manager is null or v_father1 is null or v_father2 is null then
    raise exception 'One or more REHAB logins are missing. Create father2@rehab in Auth first.';
  end if;

  update public.profiles
  set role = 'father',
      full_name = coalesce(nullif(full_name, ''), 'REHAB Father 2'),
      locale = coalesce(locale, 'en'),
      home_group_id = v_org,
      onboarding_step = coalesce(onboarding_step, 'done'),
      onboarding_completed_at = coalesce(onboarding_completed_at, now()),
      setup_answers = case
        when setup_answers is null or setup_answers = '{}'::jsonb
          then jsonb_build_object(
            'when', 'evening',
            'skill', 'listening',
            'children', '2',
            'reminder', 'skipped'
          )
        else setup_answers
      end
  where id = v_father2;

  update auth.users
  set raw_app_meta_data =
    coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"father"}'::jsonb
  where id = v_father2;

  insert into public.group_members (group_id, father_id)
  values (v_org, v_father2)
  on conflict (group_id, father_id) do nothing;

  insert into public.training_assignments (father_id, training_id, assigned_by)
  select v_father2, ta.training_id, coalesce(v_manager, ta.assigned_by)
  from public.training_assignments ta
  where ta.father_id = v_father1
  on conflict (father_id, training_id) do nothing;

  perform internal.ensure_participant_claim(v_father2);
end
$$;
