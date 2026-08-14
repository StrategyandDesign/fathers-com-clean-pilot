-- Session written deliverables. The man, and the case worker who claimed him,
-- can read these. Profile multiple-choice answers stay off this table.

create table if not exists session_writings (
  user_id        uuid not null,
  course_slug    text not null,
  video_id       text not null,
  session_ord    integer,
  session_title  text,
  learned        text not null default '',
  meaning        text not null default '',
  apply          text not null default '',
  share          text not null default '',
  saved_at       timestamptz not null default now(),
  primary key (user_id, course_slug, video_id)
);

create index if not exists session_writings_user_idx
  on session_writings (user_id);

create index if not exists session_writings_facilitator_idx
  on session_writings (user_id, saved_at desc);

alter table session_writings enable row level security;

drop policy if exists session_writings_own_select on session_writings;
create policy session_writings_own_select
  on session_writings for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists session_writings_own_insert on session_writings;
create policy session_writings_own_insert
  on session_writings for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists session_writings_own_update on session_writings;
create policy session_writings_own_update
  on session_writings for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update on session_writings to authenticated;

create or replace function facilitator_session_writings()
returns table (
  participant_user_id uuid,
  participant_email text,
  participant_name text,
  course_slug text,
  session_ord integer,
  session_title text,
  learned text,
  meaning text,
  apply text,
  share text,
  saved_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if not exists (
    select 1 from user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = any (array['circle_leader'::app_role, 'org_admin'::app_role, 'admin'::app_role])
  ) and not exists (
    select 1 from participant_claims pc
    where pc.facilitator_user_id = auth.uid() and pc.status = 'active'
  ) then
    raise exception 'facilitator role required';
  end if;

  return query
  with claims as (
    select pc.participant_email, pc.user_id as linked_user_id
    from participant_claims pc
    where pc.facilitator_user_id = auth.uid()
      and pc.status = 'active'
  ),
  resolved as (
    select
      c.participant_email,
      coalesce(c.linked_user_id, p.id) as uid,
      coalesce(p.name, '') as pname
    from claims c
    left join profiles p on lower(p.email) = lower(c.participant_email)
  )
  select
    r.uid,
    r.participant_email,
    r.pname,
    sw.course_slug,
    sw.session_ord,
    sw.session_title,
    sw.learned,
    sw.meaning,
    sw.apply,
    sw.share,
    sw.saved_at
  from resolved r
  join session_writings sw on sw.user_id = r.uid
  order by r.participant_email, sw.saved_at desc;
end;
$$;

revoke all on function facilitator_session_writings() from public;
grant execute on function facilitator_session_writings() to authenticated;

create or replace function facilitator_participant_progress()
returns table (
  claim_id uuid,
  participant_email text,
  participant_user_id uuid,
  participant_name text,
  profile_complete boolean,
  sessions_completed integer,
  checkpoints_passed integer,
  practices_completed integer,
  writings_completed integer,
  seconds_logged integer,
  enroll_state text,
  course_title text,
  cert_serial text,
  cert_issued_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if not exists (
    select 1 from user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = any (array['circle_leader'::app_role, 'org_admin'::app_role, 'admin'::app_role])
  ) and not exists (
    select 1 from participant_claims pc
    where pc.facilitator_user_id = auth.uid() and pc.status = 'active'
  ) then
    raise exception 'facilitator role required';
  end if;

  return query
  with claims as (
    select pc.id as claim_id, pc.participant_email, pc.user_id as linked_user_id
    from participant_claims pc
    where pc.facilitator_user_id = auth.uid()
      and pc.status = 'active'
  ),
  resolved as (
    select
      c.claim_id,
      c.participant_email,
      coalesce(c.linked_user_id, p.id) as uid,
      coalesce(p.name, '') as pname
    from claims c
    left join profiles p on lower(p.email) = lower(c.participant_email)
  )
  select
    r.claim_id,
    r.participant_email,
    r.uid,
    r.pname,
    exists (select 1 from keystone_results kr where kr.user_id = r.uid) as profile_complete,
    coalesce((select count(*)::int from video_progress vp where vp.user_id = r.uid and vp.completed is true), 0),
    coalesce((select count(*)::int from checkpoint_passes cp where cp.user_id = r.uid), 0),
    coalesce((select count(*)::int from practice_completions pc2 where pc2.user_id = r.uid), 0),
    coalesce((select count(*)::int from session_writings sw where sw.user_id = r.uid), 0),
    coalesce((select max(ce.seconds_logged)::int from certificate_enrollments ce where ce.user_id = r.uid), 0),
    (select ce.state from certificate_enrollments ce where ce.user_id = r.uid order by ce.last_activity_at desc nulls last limit 1),
    (select cc.title from certificate_enrollments ce join certificate_courses cc on cc.id = ce.course_id where ce.user_id = r.uid order by ce.last_activity_at desc nulls last limit 1),
    (select cert.serial from certificate_enrollments ce join certificates cert on cert.enrollment_id = ce.id where ce.user_id = r.uid and coalesce(cert.revoked, false) is not true order by cert.issued_at desc nulls last limit 1),
    (select cert.issued_at from certificate_enrollments ce join certificates cert on cert.enrollment_id = ce.id where ce.user_id = r.uid and coalesce(cert.revoked, false) is not true order by cert.issued_at desc nulls last limit 1)
  from resolved r
  order by r.participant_email;
end;
$$;
