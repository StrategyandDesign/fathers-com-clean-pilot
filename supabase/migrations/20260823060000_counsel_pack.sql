-- Optional counsel pack metadata per organization.
-- counsel_pack_required defaults OFF. Super-admin may turn it on so Leaders
-- see an empty-state checklist until a pack-attached mark is recorded.
-- attached_* is metadata only. This table never stores signatures or
-- executed-agreement truth.

create table if not exists public.group_counsel_pack (
  group_id uuid primary key references public.groups (id) on delete cascade,
  required boolean not null default false,
  attached_at timestamptz,
  attached_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint group_counsel_pack_attached_pair_check
    check (
      (attached_at is null and attached_by is null)
      or (attached_at is not null)
    )
);

comment on table public.group_counsel_pack is
  'Optional counsel pack posture. required defaults false (counsel_pack_required OFF). attached_at/attached_by record that Super-admin marked a pack attached. Metadata only. Not signatures. Not executed-agreement truth.';

comment on column public.group_counsel_pack.required is
  'counsel_pack_required. Default false. When true, Account counsel shows an empty-state checklist until attached_at is set.';

comment on column public.group_counsel_pack.attached_at is
  'When Super-admin recorded that counsel provided executed copies outside this product. Null means no attached mark. Downloads on Account remain drafts.';

comment on column public.group_counsel_pack.attached_by is
  'Profile id of the Super-admin who recorded the attached mark. Not a signature.';

alter table public.group_counsel_pack enable row level security;
alter table public.group_counsel_pack force row level security;

grant select on public.group_counsel_pack to authenticated, service_role;
grant insert, update, delete on public.group_counsel_pack to authenticated, service_role;
revoke all on public.group_counsel_pack from anon;

drop policy if exists group_counsel_pack_select on public.group_counsel_pack;
drop policy if exists group_counsel_pack_admin_write on public.group_counsel_pack;

create policy group_counsel_pack_select
on public.group_counsel_pack
for select
to authenticated
using (
  (select public.is_manager_of_group(group_id))
  or (select public.is_reviewer_of_group(group_id))
  or (select public.is_super_admin())
);

create policy group_counsel_pack_admin_write
on public.group_counsel_pack
for all
to authenticated
using ((select public.is_super_admin()))
with check ((select public.is_super_admin()));
