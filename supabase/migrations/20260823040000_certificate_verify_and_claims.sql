-- Public serial check plus optional claim enrollment for Pilot certificates.
-- Flag certificates_require_claim (CERTIFICATES_REQUIRE_CLAIM) defaults off.
-- Down path:
--   drop function if exists public.verify_certificate_serial(text);
--   drop function if exists public.ensure_participant_claim(uuid);
--   drop function if exists internal.verify_certificate_serial(text);
--   drop function if exists internal.ensure_participant_claim(uuid);
--   alter table public.certificates drop column if exists claim_id;

-- ---------- participant claims (pilot-era; dual-era safe) ----------
create table if not exists public.participant_claims (
  id uuid primary key default gen_random_uuid(),
  father_id uuid references public.profiles (id) on delete cascade,
  group_id uuid references public.groups (id) on delete cascade,
  claimed_by uuid references public.profiles (id) on delete set null,
  participant_email text,
  user_id uuid,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  released_at timestamptz
);

alter table public.participant_claims
  add column if not exists father_id uuid references public.profiles (id) on delete cascade;
alter table public.participant_claims
  add column if not exists group_id uuid references public.groups (id) on delete cascade;
alter table public.participant_claims
  add column if not exists claimed_by uuid references public.profiles (id) on delete set null;
alter table public.participant_claims
  add column if not exists participant_email text;
alter table public.participant_claims
  add column if not exists user_id uuid;
alter table public.participant_claims
  add column if not exists status text;
alter table public.participant_claims
  alter column status set default 'active';
alter table public.participant_claims
  add column if not exists created_at timestamptz;
alter table public.participant_claims
  add column if not exists released_at timestamptz;

update public.participant_claims
set status = 'active'
where status is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'participant_claims_status_check'
      and conrelid = 'public.participant_claims'::regclass
  ) then
    alter table public.participant_claims
      add constraint participant_claims_status_check
      check (status in ('active', 'released'));
  end if;
end $$;

create unique index if not exists participant_claims_father_group_active_uidx
  on public.participant_claims (father_id, group_id)
  where status = 'active' and father_id is not null and group_id is not null;

create index if not exists participant_claims_father_id_idx
  on public.participant_claims (father_id)
  where status = 'active';

alter table public.participant_claims enable row level security;
alter table public.participant_claims force row level security;

drop policy if exists participant_claims_select on public.participant_claims;
create policy participant_claims_select
on public.participant_claims
for select
to authenticated
using (
  father_id = (select auth.uid())
  or user_id = (select auth.uid())
  or (select public.manages_father(father_id))
  or (select public.current_user_role()) = 'admin'::public.user_role
);

drop policy if exists participant_claims_insert on public.participant_claims;
create policy participant_claims_insert
on public.participant_claims
for insert
to authenticated
with check (
  (select public.manages_father(father_id))
  or (select public.current_user_role()) = 'admin'::public.user_role
);

drop policy if exists participant_claims_update on public.participant_claims;
create policy participant_claims_update
on public.participant_claims
for update
to authenticated
using (
  (select public.manages_father(father_id))
  or (select public.current_user_role()) = 'admin'::public.user_role
)
with check (
  (select public.manages_father(father_id))
  or (select public.current_user_role()) = 'admin'::public.user_role
);

comment on table public.participant_claims is
  'Claimed seat for a father in a group. Certificate mint may require one when certificates_require_claim is on.';

-- ---------- certificates.claim_id ----------
alter table public.certificates
  add column if not exists claim_id uuid references public.participant_claims (id) on delete set null;

create index if not exists certificates_claim_id_idx
  on public.certificates (claim_id);

comment on column public.certificates.claim_id is
  'Optional participant claim that enrolled this serial. Required only when certificates_require_claim is on.';

-- ---------- ensure a claim from group membership ----------
create or replace function internal.ensure_participant_claim(p_father_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  found_group_id uuid;
  found_claim_id uuid;
  leader_id uuid;
begin
  if p_father_id is null then
    return null;
  end if;

  select group_members.group_id
    into found_group_id
  from public.group_members
  where group_members.father_id = p_father_id
  order by group_members.joined_at
  limit 1;

  if found_group_id is null then
    return null;
  end if;

  select participant_claims.id
    into found_claim_id
  from public.participant_claims
  where participant_claims.father_id = p_father_id
    and participant_claims.group_id = found_group_id
    and participant_claims.status = 'active'
  limit 1;

  if found_claim_id is not null then
    return found_claim_id;
  end if;

  select groups.manager_id
    into leader_id
  from public.groups
  where groups.id = found_group_id;

  insert into public.participant_claims (
    father_id,
    group_id,
    claimed_by,
    user_id,
    status
  )
  values (
    p_father_id,
    found_group_id,
    leader_id,
    p_father_id,
    'active'
  )
  on conflict do nothing
  returning participant_claims.id into found_claim_id;

  if found_claim_id is not null then
    return found_claim_id;
  end if;

  select participant_claims.id
    into found_claim_id
  from public.participant_claims
  where participant_claims.father_id = p_father_id
    and participant_claims.group_id = found_group_id
    and participant_claims.status = 'active'
  limit 1;

  return found_claim_id;
end;
$$;

create or replace function public.ensure_participant_claim(p_father_id uuid)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select internal.ensure_participant_claim($1);
$$;

revoke all on function internal.ensure_participant_claim(uuid) from public, anon;
grant execute on function internal.ensure_participant_claim(uuid) to authenticated, service_role;
revoke all on function public.ensure_participant_claim(uuid) from public, anon;
grant execute on function public.ensure_participant_claim(uuid) to authenticated, service_role;

-- Backfill claimed seats from current group membership.
insert into public.participant_claims (father_id, group_id, claimed_by, user_id, status)
select
  group_members.father_id,
  group_members.group_id,
  groups.manager_id,
  group_members.father_id,
  'active'
from public.group_members
join public.groups on groups.id = group_members.group_id
where not exists (
  select 1
  from public.participant_claims
  where participant_claims.father_id = group_members.father_id
    and participant_claims.group_id = group_members.group_id
    and participant_claims.status = 'active'
);

-- Create a claim when a father joins by invite code.
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

  return found_group_id;
end;
$$;

-- ---------- public serial check (allow-listed fields only) ----------
create or replace function internal.verify_certificate_serial(p_serial text)
returns table (
  serial_number text,
  training_title text,
  issued_at timestamptz,
  issuer_name text,
  recipient_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    certificates.serial_number,
    trainings.title,
    certificates.issued_at,
    certificates.issuer_name,
    profiles.full_name
  from public.certificates
  join public.trainings on trainings.id = certificates.training_id
  join public.profiles on profiles.id = certificates.father_id
  where upper(trim(certificates.serial_number)) = upper(trim(p_serial))
    and char_length(trim(p_serial)) between 8 and 32
  limit 1;
$$;

create or replace function public.verify_certificate_serial(p_serial text)
returns table (
  serial_number text,
  training_title text,
  issued_at timestamptz,
  issuer_name text,
  recipient_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select * from internal.verify_certificate_serial($1);
$$;

revoke all on function internal.verify_certificate_serial(text) from public, anon;
grant execute on function internal.verify_certificate_serial(text) to authenticated, service_role;
revoke all on function public.verify_certificate_serial(text) from public;
grant execute on function public.verify_certificate_serial(text) to anon, authenticated, service_role;

comment on function public.verify_certificate_serial(text) is
  'Public serial check. Returns allow-listed certificate fields only. Rate-limit in the app.';
