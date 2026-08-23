-- leader_assessment_answers defaults OFF per organization.
-- Super-admin may turn it on so Leaders can read custom assessment
-- question text and answer payloads. Leave it off for flags and
-- completion only (started, finished, stalled).

create table if not exists public.group_leader_assessment_answers (
  group_id uuid primary key references public.groups (id) on delete cascade,
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

comment on table public.group_leader_assessment_answers is
  'Optional Leader visibility of custom assessment answers. enabled defaults false (leader_assessment_answers OFF). When false, Leaders see completion status only.';

comment on column public.group_leader_assessment_answers.enabled is
  'leader_assessment_answers. Default false. When true, Leaders may read custom assessment question text and answer payloads for this organization.';

alter table public.group_leader_assessment_answers enable row level security;
alter table public.group_leader_assessment_answers force row level security;

grant select on public.group_leader_assessment_answers to authenticated, service_role;
grant insert, update, delete on public.group_leader_assessment_answers to authenticated, service_role;
revoke all on public.group_leader_assessment_answers from anon;

drop policy if exists group_leader_assessment_answers_select on public.group_leader_assessment_answers;
drop policy if exists group_leader_assessment_answers_admin_write on public.group_leader_assessment_answers;

create policy group_leader_assessment_answers_select
on public.group_leader_assessment_answers
for select
to authenticated
using (
  (select public.is_manager_of_group(group_id))
  or (select public.is_reviewer_of_group(group_id))
  or (select public.is_super_admin())
);

create policy group_leader_assessment_answers_admin_write
on public.group_leader_assessment_answers
for all
to authenticated
using ((select public.is_super_admin()))
with check ((select public.is_super_admin()));
