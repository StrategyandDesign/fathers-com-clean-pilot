-- secure_export_enabled defaults OFF (env SECURE_EXPORT_ENABLED).
-- Destination metadata and local push-intent audit only.
-- This migration does not send participant data to any outside host.
-- Down path: select internal.rollback_secure_export();

do $$
begin
  create type public.export_destination_kind as enum (
    'https_url',
    's3_uri',
    'webhook',
    'ehr',
    'local_feed',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.export_push_event_kind as enum (
    'intent_recorded',
    'not_enabled',
    'not_configured'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.export_packet_kind as enum (
    'qi_packet',
    'completion_feed'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.org_export_destinations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  label text not null,
  destination_kind public.export_destination_kind not null,
  endpoint_hint text,
  feed_token_hash text,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint org_export_destinations_label_check
    check (char_length(label) >= 2 and char_length(label) <= 80),
  constraint org_export_destinations_hint_short
    check (endpoint_hint is null or char_length(endpoint_hint) <= 300),
  constraint org_export_destinations_notes_short
    check (notes is null or char_length(notes) <= 280)
);

comment on table public.org_export_destinations is
  'Customer-managed export destination metadata only. endpoint_hint is never used to push files. secure_export_enabled defaults OFF.';

comment on column public.org_export_destinations.endpoint_hint is
  'Optional URL or URI the customer may use later. Not a live transport target in this product.';

comment on column public.org_export_destinations.feed_token_hash is
  'SHA-256 of a local read-only completion feed token. Null unless destination_kind is local_feed.';

create index if not exists org_export_destinations_group_idx
  on public.org_export_destinations (group_id, created_at desc);

create unique index if not exists org_export_destinations_feed_hash_uidx
  on public.org_export_destinations (feed_token_hash)
  where feed_token_hash is not null;

create table if not exists public.export_push_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  destination_id uuid references public.org_export_destinations (id) on delete set null,
  event_kind public.export_push_event_kind not null,
  packet_kind public.export_packet_kind not null default 'qi_packet',
  actor_id uuid references public.profiles (id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  constraint export_push_events_note_short
    check (note is null or char_length(note) <= 280)
);

comment on table public.export_push_events is
  'Local audit of confirm-first send intent. Rows record intent, not-configured, or not-enabled. No outbound payload is stored or transmitted.';

create index if not exists export_push_events_group_idx
  on public.export_push_events (group_id, created_at desc);

alter table public.org_export_destinations enable row level security;
alter table public.org_export_destinations force row level security;
alter table public.export_push_events enable row level security;
alter table public.export_push_events force row level security;

grant select, insert, update, delete on public.org_export_destinations to authenticated, service_role;
grant select, insert on public.export_push_events to authenticated, service_role;
revoke all on public.org_export_destinations from anon;
revoke all on public.export_push_events from anon;

drop policy if exists org_export_destinations_select on public.org_export_destinations;
drop policy if exists org_export_destinations_write on public.org_export_destinations;
drop policy if exists org_export_destinations_update on public.org_export_destinations;
drop policy if exists export_push_events_select on public.export_push_events;
drop policy if exists export_push_events_write on public.export_push_events;

create policy org_export_destinations_select
on public.org_export_destinations
for select
to authenticated
using (
  (select public.is_manager_of_group(group_id))
  or (select public.is_reviewer_of_group(group_id))
  or (select public.is_super_admin())
);

create policy org_export_destinations_write
on public.org_export_destinations
for insert
to authenticated
with check (
  (
    (select public.is_manager_of_group(group_id))
    or (select public.is_super_admin())
  )
  and created_by = (select auth.uid())
);

create policy org_export_destinations_update
on public.org_export_destinations
for update
to authenticated
using (
  (select public.is_manager_of_group(group_id))
  or (select public.is_super_admin())
)
with check (
  (select public.is_manager_of_group(group_id))
  or (select public.is_super_admin())
);

create policy export_push_events_select
on public.export_push_events
for select
to authenticated
using (
  (select public.is_manager_of_group(group_id))
  or (select public.is_reviewer_of_group(group_id))
  or (select public.is_super_admin())
);

create policy export_push_events_write
on public.export_push_events
for insert
to authenticated
with check (
  (
    (select public.is_manager_of_group(group_id))
    or (select public.is_super_admin())
  )
  and actor_id = (select auth.uid())
);

create or replace function public.lookup_export_feed(token_hash text)
returns table (
  destination_id uuid,
  group_id uuid,
  label text
)
language sql
stable
security definer
set search_path = public
as $$
  select id, org_export_destinations.group_id, org_export_destinations.label
  from public.org_export_destinations
  where destination_kind = 'local_feed'
    and feed_token_hash is not null
    and feed_token_hash = lookup_export_feed.token_hash
  limit 1;
$$;

comment on function public.lookup_export_feed(text) is
  'Resolves a hashed local completion-feed token. Does not return endpoint_hint or participant rows.';

create or replace function public.export_completion_feed_for_token(token_hash text)
returns table (
  participant_id uuid,
  training_id uuid,
  training_title text,
  completion_status text,
  sessions_completed integer,
  sessions_total integer,
  completed_at timestamptz,
  certificate_serial text,
  organization text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    certificates.father_id,
    certificates.training_id,
    trainings.title,
    'completed'::text,
    coalesce(trainings.session_count, 0),
    coalesce(trainings.session_count, 0),
    certificates.issued_at,
    certificates.serial_number,
    groups.name
  from public.org_export_destinations as destinations
  join public.groups
    on groups.id = destinations.group_id
  join public.group_members
    on group_members.group_id = destinations.group_id
  join public.certificates
    on certificates.father_id = group_members.father_id
  join public.trainings
    on trainings.id = certificates.training_id
  where destinations.destination_kind = 'local_feed'
    and destinations.feed_token_hash is not null
    and destinations.feed_token_hash = export_completion_feed_for_token.token_hash
  order by certificates.issued_at desc;
$$;

comment on function public.export_completion_feed_for_token(text) is
  'Issued completion serials for a valid local feed token. No answer text, diagnosis codes, medication, or clinical outcomes.';

revoke all on function public.lookup_export_feed(text) from public;
revoke all on function public.export_completion_feed_for_token(text) from public;
grant execute on function public.lookup_export_feed(text) to anon, authenticated, service_role;
grant execute on function public.export_completion_feed_for_token(text) to anon, authenticated, service_role;

create or replace function internal.rollback_secure_export()
returns void
language plpgsql
set search_path = ''
as $$
begin
  drop function if exists public.export_completion_feed_for_token(text);
  drop function if exists public.lookup_export_feed(text);
  drop policy if exists export_push_events_write on public.export_push_events;
  drop policy if exists export_push_events_select on public.export_push_events;
  drop policy if exists org_export_destinations_update on public.org_export_destinations;
  drop policy if exists org_export_destinations_write on public.org_export_destinations;
  drop policy if exists org_export_destinations_select on public.org_export_destinations;
  drop table if exists public.export_push_events;
  drop table if exists public.org_export_destinations;
  drop type if exists public.export_packet_kind;
  drop type if exists public.export_push_event_kind;
  drop type if exists public.export_destination_kind;
end;
$$;

revoke all on function internal.rollback_secure_export()
  from public, anon, authenticated;
grant execute on function internal.rollback_secure_export() to service_role;
