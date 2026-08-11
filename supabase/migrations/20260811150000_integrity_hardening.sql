-- Integrity hardening (BUILD-SPEC section 1 + AUDIT-V41 WP-A). Executable.
-- ALON: the base schema lives in supabase/schema.sql, schema_rbac.sql, and the
-- earlier migrations; run those first on a fresh project. This migration is
-- idempotent and safe to run after them. Deploy the five Edge Functions
-- (checkpoint_submit, progress_beat, submit_award, review_award, plus the
-- existing issue path) in the same release; the client already calls them.

-- 1. The answer key leaves the wire.
create or replace view quiz_questions_public as
  select id, video_id, ord, prompt, choices from quiz_questions;
grant select on quiz_questions_public to authenticated, anon;
revoke select on quiz_questions from anon, authenticated;

-- 2. Append-only server-credited time, with rejection telemetry.
create table if not exists progress_events (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  video_id uuid not null,
  position_seconds numeric not null,
  credited_seconds numeric not null default 0,
  reason text,
  created_at timestamptz not null default now()
);
alter table progress_events add column if not exists reason text;
alter table progress_events enable row level security;
drop policy if exists progress_events_select_own on progress_events;
create policy progress_events_select_own on progress_events
  for select to authenticated using (auth.uid() = user_id);

create or replace function credited_total(p_user uuid, p_video uuid)
returns numeric language sql stable as
$$ select coalesce(sum(credited_seconds),0) from progress_events
   where user_id = p_user and video_id = p_video $$;

-- 3. Immutable award audit.
create table if not exists award_audit (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  course_id uuid not null,
  actor uuid,
  from_status text,
  to_status text not null,
  ip text,
  created_at timestamptz not null default now()
);
alter table award_audit enable row level security;
drop policy if exists award_audit_select_own on award_audit;
create policy award_audit_select_own on award_audit
  for select to authenticated using (auth.uid() = user_id);

-- 4. Awards carry integrity, the frozen evidence snapshot, and issuance fields.
alter table certificate_awards add column if not exists record_integrity text not null default 'clean';
alter table certificate_awards add column if not exists integrity_reasons text;
alter table certificate_awards add column if not exists integrity_cleared boolean;
alter table certificate_awards add column if not exists review_note text;
alter table certificate_awards add column if not exists contact_hours numeric;
alter table certificate_awards add column if not exists attestation_method text;
alter table certificate_awards add column if not exists snapshot_independent_seconds integer;
alter table certificate_awards add column if not exists snapshot_checkpoints jsonb;
alter table certificate_awards add column if not exists snapshot_final_answers_count integer;
alter table certificate_awards add column if not exists snapshot_at timestamptz;
alter table certificate_awards add column if not exists serial text;
alter table certificate_awards add column if not exists issued_at timestamptz;

-- 5. RLS lockdown (executable): drop every non-select policy on the four
--    integrity tables regardless of name, then ensure select-own exists.
do $$
declare t text; p record;
begin
  foreach t in array array['video_progress','quiz_responses','certificate_enrollments','certificate_awards'] loop
    for p in select policyname from pg_policies where schemaname='public' and tablename=t and cmd <> 'SELECT' loop
      execute format('drop policy %I on %I', p.policyname, t);
    end loop;
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

drop policy if exists vp_select_own on video_progress;
create policy vp_select_own on video_progress for select to authenticated using (auth.uid() = user_id);
drop policy if exists qr_select_own on quiz_responses;
create policy qr_select_own on quiz_responses for select to authenticated using (auth.uid() = user_id);
drop policy if exists ce_select_own on certificate_enrollments;
create policy ce_select_own on certificate_enrollments for select to authenticated using (auth.uid() = user_id);
drop policy if exists ca_select_own on certificate_awards;
create policy ca_select_own on certificate_awards for select to authenticated using (auth.uid() = user_id);

-- 5c. final_qa_responses stays the one intentional client write, scoped to own rows.
alter table final_qa_responses enable row level security;
drop policy if exists fqa_select_own on final_qa_responses;
create policy fqa_select_own on final_qa_responses for select to authenticated using (auth.uid() = user_id);
drop policy if exists fqa_write_own on final_qa_responses;
create policy fqa_write_own on final_qa_responses for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists fqa_update_own on final_qa_responses;
create policy fqa_update_own on final_qa_responses for update to authenticated using (auth.uid() = user_id);

-- 6. Verify surface: public_certificates carries status, attestation, and the
--    record fields the verify page renders. If public_certificates is a view
--    in your base schema, recreate it to expose these columns instead.
alter table if exists public_certificates add column if not exists status text not null default 'issued';
alter table if exists public_certificates add column if not exists attestation_method text;
alter table if exists public_certificates add column if not exists contact_hours numeric;
alter table if exists public_certificates add column if not exists snapshot_independent_seconds integer;
alter table if exists public_certificates add column if not exists issuing_authority text not null default 'fathers.com';

-- 7. Checkpoint attempts and durable passes (WP-C).
create table if not exists quiz_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null, video_id uuid not null,
  right_count int not null, total int not null, passed boolean not null,
  created_at timestamptz not null default now()
);
alter table quiz_attempts enable row level security;
drop policy if exists qa_select_own on quiz_attempts;
create policy qa_select_own on quiz_attempts for select to authenticated using (auth.uid() = user_id);

create table if not exists checkpoint_passes (
  user_id uuid not null, video_id uuid not null,
  passed_at timestamptz not null default now(),
  right_count int not null, total int not null,
  primary key (user_id, video_id)
);
alter table checkpoint_passes enable row level security;
drop policy if exists cp_select_own on checkpoint_passes;
create policy cp_select_own on checkpoint_passes for select to authenticated using (auth.uid() = user_id);

-- 8. Integrity flags visible to reviewers (WP-C anomaly hook).
create table if not exists integrity_flags (
  user_id uuid not null, course_id uuid not null,
  reason text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);
alter table integrity_flags enable row level security;
-- reads via service role and the reviewer surface only; no client policies.
