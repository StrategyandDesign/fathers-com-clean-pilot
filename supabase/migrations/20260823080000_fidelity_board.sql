-- fidelity_board_enabled defaults OFF (env FIDELITY_BOARD_ENABLED).
-- Living supervision checklist per cohort run, plus a thin Certified
-- Facilitator registry. Education supervision only. Not a clinical chart.
-- Down path: select internal.rollback_fidelity_board();

create table if not exists public.fidelity_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  source_path text not null,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint fidelity_templates_slug_check
    check (char_length(slug) >= 2 and char_length(slug) <= 80),
  constraint fidelity_templates_title_check
    check (char_length(title) >= 2 and char_length(title) <= 120)
);

comment on table public.fidelity_templates is
  'Checklist definitions for the living fidelity board. Seeded from partner-kit/supervision-checklist.md.';

comment on column public.fidelity_templates.items is
  'JSON array of {key, section, sort, prompt}. Education supervision prompts only.';

create table if not exists public.fidelity_runs (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  training_id uuid references public.trainings (id) on delete cascade,
  template_id uuid not null references public.fidelity_templates (id) on delete restrict,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.fidelity_runs is
  'One living fidelity board per cohort (group) or per cohort training. Created when a Leader opens the board.';

create unique index if not exists fidelity_runs_group_only_uidx
  on public.fidelity_runs (group_id)
  where training_id is null;

create unique index if not exists fidelity_runs_group_training_uidx
  on public.fidelity_runs (group_id, training_id)
  where training_id is not null;

create index if not exists fidelity_runs_group_idx
  on public.fidelity_runs (group_id, created_at desc);

create table if not exists public.fidelity_check_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.fidelity_runs (id) on delete cascade,
  item_key text not null,
  completed_by uuid references public.profiles (id) on delete set null,
  completed_at timestamptz,
  notes text,
  constraint fidelity_check_items_key_check
    check (char_length(item_key) >= 2 and char_length(item_key) <= 80),
  constraint fidelity_check_items_notes_short
    check (notes is null or char_length(notes) <= 280),
  unique (run_id, item_key)
);

comment on table public.fidelity_check_items is
  'Per-run checklist marks. completed_by / completed_at / notes (short). Not clinical chart fields.';

create index if not exists fidelity_check_items_run_idx
  on public.fidelity_check_items (run_id, item_key);

do $$
begin
  create type public.facilitator_credential_status as enum ('training', 'certified', 'suspended');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.facilitator_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  org_id uuid not null references public.groups (id) on delete cascade,
  status public.facilitator_credential_status not null default 'training',
  earned_at timestamptz,
  evidence_path text,
  attested_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint facilitator_credentials_user_org_key unique (user_id, org_id),
  constraint facilitator_credentials_evidence_short
    check (evidence_path is null or char_length(evidence_path) <= 200)
);

comment on table public.facilitator_credentials is
  'Thin Certified Facilitator registry. Status is training, certified, or suspended. Exam may stay offline; this records attestation.';

comment on column public.facilitator_credentials.evidence_path is
  'Short path or offline-exam note. Not a clinical file. Optional.';

create index if not exists facilitator_credentials_org_idx
  on public.facilitator_credentials (org_id, status);

insert into public.fidelity_templates (slug, title, source_path, items)
values (
  'supervised-first-cohort',
  'Supervised first cohort',
  'partner-kit/supervision-checklist.md',
  '[
    {"key":"session_one.greet_by_name","section":"session_one","sort":1,"prompt":"Every man greeted by name at the door."},
    {"key":"session_one.zero_cost_promise","section":"session_one","sort":2,"prompt":"The zero-cost promise said out loud."},
    {"key":"session_one.profile_and_commitment","section":"session_one","sort":3,"prompt":"Every man leaves with a Profile started and one stated commitment."},
    {"key":"session_one.next_session_confirmed","section":"session_one","sort":4,"prompt":"Next session confirmed before dismissal."},
    {"key":"mid_cohort.wins_opened","section":"mid_cohort","sort":5,"prompt":"Wins opened the room; every man reported."},
    {"key":"mid_cohort.practice_over_lecture","section":"mid_cohort","sort":6,"prompt":"Practice time exceeded lecture time."},
    {"key":"mid_cohort.absent_called","section":"mid_cohort","sort":7,"prompt":"Any absent man was called the same day he missed. Ask for the story."},
    {"key":"mid_cohort.attendance_trend","section":"mid_cohort","sort":8,"prompt":"Attendance trend reviewed against session one."},
    {"key":"the_final.finals_read","section":"the_final","sort":9,"prompt":"Finals read personally, feedback given man by man."},
    {"key":"the_final.ceremony_scheduled","section":"the_final","sort":10,"prompt":"Ceremony scheduled before program exit, room and guests arranged."},
    {"key":"the_final.verification_sheet","section":"the_final","sort":11,"prompt":"Verification sheet produced for any requiring coordinator."},
    {"key":"credential.rhythm_holds","section":"credential","sort":12,"prompt":"The supervisor has seen the rhythm hold without prompting."},
    {"key":"credential.coaching_notes","section":"credential","sort":13,"prompt":"One coaching note per session, in writing, kept simple."}
  ]'::jsonb
)
on conflict (slug) do update
  set title = excluded.title,
      source_path = excluded.source_path,
      items = excluded.items;

alter table public.fidelity_templates enable row level security;
alter table public.fidelity_templates force row level security;
alter table public.fidelity_runs enable row level security;
alter table public.fidelity_runs force row level security;
alter table public.fidelity_check_items enable row level security;
alter table public.fidelity_check_items force row level security;
alter table public.facilitator_credentials enable row level security;
alter table public.facilitator_credentials force row level security;

grant select on public.fidelity_templates to authenticated, service_role;
grant insert, update, delete on public.fidelity_templates to service_role;
grant select, insert, update, delete on public.fidelity_runs to authenticated, service_role;
grant select, insert, update, delete on public.fidelity_check_items to authenticated, service_role;
grant select, insert, update, delete on public.facilitator_credentials to authenticated, service_role;
revoke all on public.fidelity_templates from anon;
revoke all on public.fidelity_runs from anon;
revoke all on public.fidelity_check_items from anon;
revoke all on public.facilitator_credentials from anon;

drop policy if exists fidelity_templates_select on public.fidelity_templates;
drop policy if exists fidelity_templates_admin_write on public.fidelity_templates;
drop policy if exists fidelity_runs_select on public.fidelity_runs;
drop policy if exists fidelity_runs_write on public.fidelity_runs;
drop policy if exists fidelity_runs_update on public.fidelity_runs;
drop policy if exists fidelity_check_items_select on public.fidelity_check_items;
drop policy if exists fidelity_check_items_write on public.fidelity_check_items;
drop policy if exists fidelity_check_items_update on public.fidelity_check_items;
drop policy if exists facilitator_credentials_select on public.facilitator_credentials;
drop policy if exists facilitator_credentials_write on public.facilitator_credentials;
drop policy if exists facilitator_credentials_update on public.facilitator_credentials;

create policy fidelity_templates_select
on public.fidelity_templates
for select
to authenticated
using (
  (select public.current_user_role()) in (
    'manager'::public.user_role,
    'reviewer'::public.user_role,
    'admin'::public.user_role
  )
);

create policy fidelity_templates_admin_write
on public.fidelity_templates
for all
to authenticated
using ((select public.is_super_admin()))
with check ((select public.is_super_admin()));

create policy fidelity_runs_select
on public.fidelity_runs
for select
to authenticated
using (
  (select public.is_manager_of_group(group_id))
  or (select public.is_reviewer_of_group(group_id))
  or (select public.is_super_admin())
);

create policy fidelity_runs_write
on public.fidelity_runs
for insert
to authenticated
with check (
  (
    (select public.is_manager_of_group(group_id))
    or (select public.is_super_admin())
  )
  and created_by = (select auth.uid())
);

create policy fidelity_runs_update
on public.fidelity_runs
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

create policy fidelity_check_items_select
on public.fidelity_check_items
for select
to authenticated
using (
  exists (
    select 1
    from public.fidelity_runs as runs
    where runs.id = run_id
      and (
        (select public.is_manager_of_group(runs.group_id))
        or (select public.is_reviewer_of_group(runs.group_id))
        or (select public.is_super_admin())
      )
  )
);

create policy fidelity_check_items_write
on public.fidelity_check_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.fidelity_runs as runs
    where runs.id = run_id
      and (
        (select public.is_manager_of_group(runs.group_id))
        or (select public.is_super_admin())
      )
  )
);

create policy fidelity_check_items_update
on public.fidelity_check_items
for update
to authenticated
using (
  exists (
    select 1
    from public.fidelity_runs as runs
    where runs.id = run_id
      and (
        (select public.is_manager_of_group(runs.group_id))
        or (select public.is_super_admin())
      )
  )
)
with check (
  exists (
    select 1
    from public.fidelity_runs as runs
    where runs.id = run_id
      and (
        (select public.is_manager_of_group(runs.group_id))
        or (select public.is_super_admin())
      )
  )
);

create policy facilitator_credentials_select
on public.facilitator_credentials
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select public.is_manager_of_group(org_id))
  or (select public.is_reviewer_of_group(org_id))
  or (select public.is_super_admin())
);

create policy facilitator_credentials_write
on public.facilitator_credentials
for insert
to authenticated
with check (
  (select public.is_manager_of_group(org_id))
  or (select public.is_super_admin())
);

create policy facilitator_credentials_update
on public.facilitator_credentials
for update
to authenticated
using (
  (select public.is_manager_of_group(org_id))
  or (select public.is_super_admin())
)
with check (
  (select public.is_manager_of_group(org_id))
  or (select public.is_super_admin())
);

create or replace function internal.rollback_fidelity_board()
returns void
language plpgsql
set search_path = ''
as $$
begin
  drop policy if exists facilitator_credentials_update on public.facilitator_credentials;
  drop policy if exists facilitator_credentials_write on public.facilitator_credentials;
  drop policy if exists facilitator_credentials_select on public.facilitator_credentials;
  drop policy if exists fidelity_check_items_update on public.fidelity_check_items;
  drop policy if exists fidelity_check_items_write on public.fidelity_check_items;
  drop policy if exists fidelity_check_items_select on public.fidelity_check_items;
  drop policy if exists fidelity_runs_update on public.fidelity_runs;
  drop policy if exists fidelity_runs_write on public.fidelity_runs;
  drop policy if exists fidelity_runs_select on public.fidelity_runs;
  drop policy if exists fidelity_templates_admin_write on public.fidelity_templates;
  drop policy if exists fidelity_templates_select on public.fidelity_templates;
  drop table if exists public.facilitator_credentials;
  drop table if exists public.fidelity_check_items;
  drop table if exists public.fidelity_runs;
  drop table if exists public.fidelity_templates;
  drop type if exists public.facilitator_credential_status;
end;
$$;

revoke all on function internal.rollback_fidelity_board()
  from public, anon, authenticated;
grant execute on function internal.rollback_fidelity_board() to service_role;
