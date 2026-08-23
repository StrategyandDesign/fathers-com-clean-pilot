-- sso_enabled defaults OFF per organization.
-- Super-admin may turn it on and attach one OpenID Connect or SAML 2.0
-- identity provider. Fathers stay invite-code + email. Super-admin
-- break-glass stays email and password.

create table if not exists public.group_sso (
  group_id uuid primary key references public.groups (id) on delete cascade,
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

comment on table public.group_sso is
  'Organization single sign-on flag. enabled defaults false (sso_enabled OFF).';

comment on column public.group_sso.enabled is
  'sso_enabled. Default false. When true, staff may sign in through the linked identity provider.';

create table if not exists public.org_identity_providers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null unique references public.groups (id) on delete cascade,
  protocol text not null check (protocol in ('oidc', 'saml')),
  issuer text not null,
  client_id text,
  client_secret_ref text,
  metadata_url text,
  email_domains text[] not null default '{}'::text[],
  role_claim_map jsonb not null default '{"claim":"role","values":{"leader":"manager","manager":"manager","reviewer":"reviewer"}}'::jsonb,
  display_name text,
  supabase_provider_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  constraint org_identity_providers_issuer_check
    check (char_length(trim(issuer)) >= 3 and char_length(issuer) <= 400)
);

comment on table public.org_identity_providers is
  'One OpenID Connect or SAML 2.0 identity provider per organization. Client secrets stay in Auth, not here.';

create table if not exists public.org_staff_provision_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null check (action in ('provision', 'deprovision', 'role_change')),
  created_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb
);

comment on table public.org_staff_provision_events is
  'Append-only provision, deprovision, and role_change log for organization staff. Last deprovision is the drill hook.';

create index if not exists org_staff_provision_events_group_created_idx
  on public.org_staff_provision_events (group_id, created_at desc);
create index if not exists org_staff_provision_events_profile_idx
  on public.org_staff_provision_events (profile_id, created_at desc);
create index if not exists org_identity_providers_domains_idx
  on public.org_identity_providers using gin (email_domains);

alter table public.organization_staff
  add column if not exists disabled_at timestamptz,
  add column if not exists disabled_by uuid references public.profiles (id) on delete set null;

comment on column public.organization_staff.disabled_at is
  'When set, this seat is revoked. Desk helpers and session refresh treat the row as inactive.';

create or replace function internal.record_org_staff_provision_event(
  p_group_id uuid,
  p_profile_id uuid,
  p_actor_id uuid,
  p_action text,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_group_id is null or p_profile_id is null then
    return null;
  end if;
  if p_action not in ('provision', 'deprovision', 'role_change') then
    return null;
  end if;
  insert into public.org_staff_provision_events (
    group_id, profile_id, actor_id, action, payload
  )
  values (
    p_group_id,
    p_profile_id,
    p_actor_id,
    p_action,
    coalesce(p_payload, '{}'::jsonb)
  )
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function internal.active_manager_count(group_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.organization_staff as staff
  where staff.group_id = $1
    and staff.staff_role = 'manager'::public.organization_staff_role
    and staff.disabled_at is null;
$$;

create or replace function internal.is_manager_of_group(group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.organization_staff as staff
      join public.profiles on profiles.id = staff.profile_id
      where staff.group_id = $1
        and staff.profile_id = (select auth.uid())
        and staff.staff_role = 'manager'::public.organization_staff_role
        and staff.disabled_at is null
        and profiles.role = 'manager'::public.user_role
        and profiles.deactivated_at is null
    )
    or (
      exists (
        select 1
        from public.groups
        join public.profiles on profiles.id = groups.manager_id
        where groups.id = $1
          and groups.manager_id = (select auth.uid())
          and profiles.role = 'manager'::public.user_role
          and profiles.deactivated_at is null
      )
      and not exists (
        select 1
        from public.organization_staff as staff
        where staff.group_id = $1
          and staff.profile_id = (select auth.uid())
          and staff.disabled_at is not null
      )
    );
$$;

create or replace function internal.is_reviewer_of_group(group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.organization_staff as staff
      join public.profiles on profiles.id = staff.profile_id
      where staff.group_id = $1
        and staff.profile_id = (select auth.uid())
        and staff.staff_role = 'reviewer'::public.organization_staff_role
        and staff.disabled_at is null
        and profiles.role = 'reviewer'::public.user_role
        and profiles.deactivated_at is null
    )
    or (
      exists (
        select 1
        from public.profiles
        where profiles.id = (select auth.uid())
          and profiles.role = 'reviewer'::public.user_role
          and profiles.deactivated_at is null
          and profiles.home_group_id = $1
      )
      and not exists (
        select 1
        from public.organization_staff as staff
        where staff.group_id = $1
          and staff.profile_id = (select auth.uid())
          and staff.disabled_at is not null
      )
    );
$$;

create or replace function internal.reviewer_scoped_group_ids()
returns table (group_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select staff.group_id
  from public.organization_staff as staff
  join public.profiles on profiles.id = staff.profile_id
  where staff.profile_id = (select auth.uid())
    and staff.staff_role = 'reviewer'::public.organization_staff_role
    and staff.disabled_at is null
    and profiles.role = 'reviewer'::public.user_role
  union
  select profiles.home_group_id
  from public.profiles
  where profiles.id = (select auth.uid())
    and profiles.role = 'reviewer'::public.user_role
    and profiles.home_group_id is not null
    and not exists (
      select 1
      from public.organization_staff as staff
      where staff.group_id = profiles.home_group_id
        and staff.profile_id = profiles.id
        and staff.disabled_at is not null
    );
$$;

create or replace function internal.staff_has_active_desk(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.profiles
      where profiles.id = $1
        and profiles.role = 'admin'::public.user_role
        and profiles.deactivated_at is null
    )
    or exists (
      select 1
      from public.organization_staff as staff
      join public.profiles on profiles.id = staff.profile_id
      where staff.profile_id = $1
        and staff.disabled_at is null
        and profiles.deactivated_at is null
    )
    or exists (
      select 1
      from public.groups
      join public.profiles on profiles.id = groups.manager_id
      where groups.manager_id = $1
        and profiles.role = 'manager'::public.user_role
        and profiles.deactivated_at is null
        and not exists (
          select 1
          from public.organization_staff as staff
          where staff.group_id = groups.id
            and staff.profile_id = $1
            and staff.disabled_at is not null
        )
    )
    or exists (
      select 1
      from public.profiles
      where profiles.id = $1
        and profiles.role = 'reviewer'::public.user_role
        and profiles.deactivated_at is null
        and profiles.home_group_id is not null
        and not exists (
          select 1
          from public.organization_staff as staff
          where staff.group_id = profiles.home_group_id
            and staff.profile_id = $1
            and staff.disabled_at is not null
        )
    );
$$;

create or replace function public.staff_has_active_desk(profile_id uuid default (select auth.uid()))
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select internal.staff_has_active_desk($1);
$$;

create or replace function internal.revoke_organization_staff(
  p_group_id uuid,
  p_profile_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.organization_staff_role;
  v_disabled timestamptz;
  v_manager_count integer;
  v_other uuid;
begin
  if not (
    internal.is_super_admin()
    or internal.is_manager_of_group(p_group_id)
  ) then
    raise exception 'Not authorized';
  end if;

  select staff.staff_role, staff.disabled_at
    into v_role, v_disabled
  from public.organization_staff as staff
  where staff.group_id = p_group_id
    and staff.profile_id = p_profile_id;

  if not found then
    raise exception 'They are not on this organization';
  end if;

  if v_disabled is not null then
    return;
  end if;

  if v_role = 'manager'::public.organization_staff_role then
    select internal.active_manager_count(p_group_id) - 1
      into v_manager_count;
    if coalesce(v_manager_count, 0) < 1 then
      raise exception 'Keep at least one leader on the organization';
    end if;
  end if;

  update public.organization_staff
  set disabled_at = now(),
      disabled_by = (select auth.uid())
  where group_id = p_group_id
    and profile_id = p_profile_id;

  if exists (
    select 1
    from public.groups
    where groups.id = p_group_id
      and groups.manager_id = p_profile_id
  ) then
    select staff.profile_id
      into v_other
    from public.organization_staff as staff
    where staff.group_id = p_group_id
      and staff.staff_role = 'manager'::public.organization_staff_role
      and staff.disabled_at is null
      and staff.profile_id is distinct from p_profile_id
    order by staff.added_at
    limit 1;

    if v_other is not null then
      update public.groups
      set manager_id = v_other
      where groups.id = p_group_id;
    end if;
  end if;

  delete from auth.sessions
  where user_id = p_profile_id;

  perform internal.record_org_staff_provision_event(
    p_group_id,
    p_profile_id,
    (select auth.uid()),
    'deprovision',
    jsonb_build_object('staffRole', v_role::text, 'source', 'revoke')
  );
  perform internal.record_organization_activity(
    p_group_id,
    coalesce((select auth.uid()), p_profile_id),
    'staff_removed',
    jsonb_build_object('profileId', p_profile_id, 'staffRole', v_role::text, 'revoked', true)
  );
end;
$$;

create or replace function public.revoke_organization_staff(
  p_group_id uuid,
  p_profile_id uuid
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select internal.revoke_organization_staff($1, $2);
$$;

create or replace function internal.apply_sso_first_login(
  p_group_id uuid,
  p_staff_role public.organization_staff_role
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_current public.user_role;
  v_existing public.organization_staff_role;
  v_disabled timestamptz;
  v_action text;
begin
  v_user := (select auth.uid());
  if v_user is null then
    raise exception 'Not signed in';
  end if;

  if p_staff_role is distinct from 'manager'::public.organization_staff_role
     and p_staff_role is distinct from 'reviewer'::public.organization_staff_role then
    raise exception 'Identity provider can only map Leader or Reviewer';
  end if;

  if not exists (
    select 1
    from public.group_sso
    where group_sso.group_id = p_group_id
      and group_sso.enabled
  ) then
    raise exception 'sso_enabled is off';
  end if;

  select profiles.role
    into v_current
  from public.profiles
  where profiles.id = v_user;

  if v_current = 'admin'::public.user_role then
    return;
  end if;

  select staff.staff_role, staff.disabled_at
    into v_existing, v_disabled
  from public.organization_staff as staff
  where staff.group_id = p_group_id
    and staff.profile_id = v_user;

  if v_disabled is not null then
    raise exception 'This desk access has been revoked';
  end if;

  insert into public.organization_staff (group_id, profile_id, staff_role, added_by)
  values (p_group_id, v_user, p_staff_role, v_user)
  on conflict (group_id, profile_id) do update
    set staff_role = excluded.staff_role
    where organization_staff.disabled_at is null;

  update public.profiles
  set role = p_staff_role::text::public.user_role
  where id = v_user
    and role is distinct from p_staff_role::text::public.user_role;

  update auth.users
  set raw_app_meta_data =
    coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', p_staff_role::text)
  where id = v_user;

  if v_existing is null then
    v_action := 'provision';
  elsif v_existing is distinct from p_staff_role then
    v_action := 'role_change';
  else
    return;
  end if;

  perform internal.record_org_staff_provision_event(
    p_group_id,
    v_user,
    v_user,
    v_action,
    jsonb_build_object('staffRole', p_staff_role::text, 'source', 'sso_first_login')
  );
end;
$$;

create or replace function public.apply_sso_first_login(
  p_group_id uuid,
  p_staff_role text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_staff_role not in ('manager', 'reviewer') then
    raise exception 'Identity provider can only map Leader or Reviewer';
  end if;
  perform internal.apply_sso_first_login($1, $2::public.organization_staff_role);
end;
$$;

create or replace function public.any_sso_ready()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_sso as flags
    join public.org_identity_providers as providers
      on providers.group_id = flags.group_id
    where flags.enabled
      and char_length(trim(providers.issuer)) >= 3
      and cardinality(providers.email_domains) > 0
  );
$$;

create or replace function public.lookup_enabled_sso_provider(p_email text)
returns table (
  group_id uuid,
  protocol text,
  issuer text,
  display_name text,
  supabase_provider_id text,
  email_domain text,
  role_claim_map jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    providers.group_id,
    providers.protocol,
    providers.issuer,
    coalesce(nullif(trim(providers.display_name), ''), providers.issuer),
    providers.supabase_provider_id,
    lower(split_part(trim(p_email), '@', 2)),
    providers.role_claim_map
  from public.org_identity_providers as providers
  join public.group_sso as flags
    on flags.group_id = providers.group_id
   and flags.enabled
  where char_length(trim(p_email)) > 3
    and position('@' in p_email) > 1
    and lower(split_part(trim(p_email), '@', 2)) = any (
      select lower(unnest(providers.email_domains))
    )
  limit 1;
$$;

alter table public.group_sso enable row level security;
alter table public.group_sso force row level security;
alter table public.org_identity_providers enable row level security;
alter table public.org_identity_providers force row level security;
alter table public.org_staff_provision_events enable row level security;
alter table public.org_staff_provision_events force row level security;

grant select on public.group_sso to authenticated, service_role;
grant insert, update, delete on public.group_sso to authenticated, service_role;
grant select on public.org_identity_providers to authenticated, service_role;
grant insert, update, delete on public.org_identity_providers to authenticated, service_role;
grant select, insert on public.org_staff_provision_events to authenticated, service_role;
revoke all on public.group_sso from anon;
revoke all on public.org_identity_providers from anon;
revoke update, delete, truncate on public.org_staff_provision_events from anon, authenticated;

drop policy if exists group_sso_select on public.group_sso;
drop policy if exists group_sso_admin_write on public.group_sso;
drop policy if exists org_identity_providers_select on public.org_identity_providers;
drop policy if exists org_identity_providers_admin_write on public.org_identity_providers;
drop policy if exists org_staff_provision_events_select on public.org_staff_provision_events;
drop policy if exists org_staff_provision_events_admin_insert on public.org_staff_provision_events;

create policy group_sso_select
on public.group_sso
for select
to authenticated
using (
  (select public.is_manager_of_group(group_id))
  or (select public.is_reviewer_of_group(group_id))
  or (select public.is_super_admin())
);

create policy group_sso_admin_write
on public.group_sso
for all
to authenticated
using ((select public.is_super_admin()))
with check ((select public.is_super_admin()));

create policy org_identity_providers_select
on public.org_identity_providers
for select
to authenticated
using (
  (select public.is_manager_of_group(group_id))
  or (select public.is_reviewer_of_group(group_id))
  or (select public.is_super_admin())
);

create policy org_identity_providers_admin_write
on public.org_identity_providers
for all
to authenticated
using ((select public.is_super_admin()))
with check ((select public.is_super_admin()));

create policy org_staff_provision_events_select
on public.org_staff_provision_events
for select
to authenticated
using (
  (select public.is_manager_of_group(group_id))
  or (select public.is_reviewer_of_group(group_id))
  or (select public.is_super_admin())
);

create policy org_staff_provision_events_admin_insert
on public.org_staff_provision_events
for insert
to authenticated
with check ((select public.is_super_admin()));

revoke all on function internal.record_org_staff_provision_event(uuid, uuid, uuid, text, jsonb)
  from public, anon, authenticated;
revoke all on function internal.active_manager_count(uuid) from public, anon;
revoke all on function internal.staff_has_active_desk(uuid) from public, anon;
revoke all on function public.staff_has_active_desk(uuid) from public, anon;
revoke all on function internal.revoke_organization_staff(uuid, uuid) from public, anon;
revoke all on function public.revoke_organization_staff(uuid, uuid) from public, anon;
revoke all on function internal.apply_sso_first_login(uuid, public.organization_staff_role)
  from public, anon;
revoke all on function public.apply_sso_first_login(uuid, text) from public, anon;
revoke all on function public.any_sso_ready() from public;
revoke all on function public.lookup_enabled_sso_provider(text) from public;

grant execute on function internal.record_org_staff_provision_event(uuid, uuid, uuid, text, jsonb)
  to service_role;
grant execute on function public.any_sso_ready() to anon, authenticated, service_role;
grant execute on function public.lookup_enabled_sso_provider(text) to anon, authenticated, service_role;
grant execute on function internal.active_manager_count(uuid) to authenticated, service_role;
grant execute on function internal.staff_has_active_desk(uuid) to authenticated, service_role;
grant execute on function public.staff_has_active_desk(uuid) to authenticated, service_role;
grant execute on function internal.revoke_organization_staff(uuid, uuid) to authenticated, service_role;
grant execute on function public.revoke_organization_staff(uuid, uuid) to authenticated, service_role;
grant execute on function internal.apply_sso_first_login(uuid, public.organization_staff_role)
  to authenticated, service_role;
grant execute on function public.apply_sso_first_login(uuid, text) to authenticated, service_role;
grant update on public.organization_staff to service_role;
