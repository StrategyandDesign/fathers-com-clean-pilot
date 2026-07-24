-- The withdrawal window. Additive and idempotent.
--
-- WHAT THIS CLOSES
-- Gate six of six: "Define and honour the window between consent and key
-- destruction during which a man can still pull his record."
--
-- It was open because it is a decision rather than a document. The decision is
-- thirty days.
--
-- WHY THIRTY
-- Long enough that a man who says yes in the first flush of finishing a profile
-- can change his mind after sleeping on it, or after talking to his family or his
-- case manager. Short enough that calibration is not stalled. For men in
-- treatment or reentry, several of whom are enrolled through a programme rather
-- than by their own choice, a same-day yes is the one most worth allowing time to
-- reconsider.
--
-- WHY IN THE DATABASE
-- A window that lives in a policy document is a window somebody forgets under
-- deadline. The archive function now cannot pull a record before its window has
-- passed, so honouring it is not a matter of anyone remembering to.
--
-- WHAT IT DOES NOT DO
-- It does not make anonymised records recoverable. Once the linkage key is
-- destroyed nothing points back to the man, which is the point of destroying it,
-- and the consent text says so plainly. The window is the period in which
-- withdrawal still means something.

-- ---------------------------------------------------------------------------
-- 1. When a consent becomes archive-eligible.
-- ---------------------------------------------------------------------------
alter table public.research_consent
  add column if not exists window_days int not null default 30;

comment on column public.research_consent.window_days is
  'Days between granting consent and the record becoming eligible for archiving. Withdrawal inside this window removes the man entirely. Thirty by default; changed only with a documented reason.';

create or replace function public.research_archive_eligible_at(p_user uuid)
returns timestamptz
language sql stable as $$
  select rc.granted_at + (rc.window_days || ' days')::interval
  from public.research_consent rc
  where rc.user_id = p_user and rc.granted and rc.withdrawn_at is null;
$$;

-- ---------------------------------------------------------------------------
-- 2. The archive function honours it.
--    Same body as before, with the window added to the eligibility test and the
--    counts extended so a run reports what it is waiting on rather than
--    silently doing less than expected.
-- ---------------------------------------------------------------------------
-- The signature gains a fourth column, and Postgres will not let CREATE OR
-- REPLACE change a function's return type. The old one is dropped first. Safe:
-- nothing calls it on a schedule yet, and execute is revoked from every
-- application role, so there is no dependent object to break.
drop function if exists research.archive_consented_results();

create function research.archive_consented_results()
returns table (archived int, skipped_no_consent int, skipped_unverified int,
               waiting_on_window int)
language plpgsql security definer set search_path = public, research, private as $fn$
declare a int := 0; sc int := 0; su int := 0; ww int := 0;
begin
  insert into private.research_linkage (user_id)
  select rc.user_id from public.research_consent rc
  where rc.granted and rc.withdrawn_at is null
    and now() >= rc.granted_at + (rc.window_days || ' days')::interval
  on conflict (user_id) do nothing;

  insert into research.subjects (research_subject_id, population, partner_tier, first_period)
  select l.research_subject_id, 'unspecified', null,
         to_char(l.created_at, 'YYYY') || '-Q' || to_char(l.created_at, 'Q')
  from private.research_linkage l
  where l.key_destroyed_at is null
  on conflict (research_subject_id) do nothing;

  with eligible as (
    select kr.id, kr.overall_pct, kr.section_scores, kr.scale_scores,
           kr.gap_scale, kr.strength_scale, kr.completed_at,
           kr.assessment_slug, l.research_subject_id, rv.method
    from public.keystone_results kr
    join public.research_consent rc on rc.user_id = kr.user_id
                                   and rc.granted and rc.withdrawn_at is null
                                   -- the window, enforced here
                                   and now() >= rc.granted_at + (rc.window_days || ' days')::interval
    join private.research_linkage l on l.user_id = kr.user_id
    join public.result_verification rv on rv.result_id = kr.id and rv.verified
    where l.key_destroyed_at is null
  )
  insert into research.assessment_records (
    research_subject_id, instrument_slug, instrument_version, scoring_mode, norms_n,
    overall_pct, section_scores, scale_scores, gap_scale, strength_scale,
    completed_period, timepoint, verified_human, verification_method)
  select e.research_subject_id,
         coalesce(e.assessment_slug, 'keystone-father-profile'),
         null, null, null,
         e.overall_pct, e.section_scores, e.scale_scores, e.gap_scale, e.strength_scale,
         to_char(e.completed_at, 'YYYY') || '-Q' || to_char(e.completed_at, 'Q'),
         row_number() over (partition by e.research_subject_id order by e.completed_at),
         true, e.method
  from eligible e
  on conflict do nothing;

  get diagnostics a = row_count;

  select count(*) into sc from public.keystone_results kr
    left join public.research_consent rc on rc.user_id = kr.user_id
                                        and rc.granted and rc.withdrawn_at is null
    where rc.user_id is null;

  select count(*) into su from public.keystone_results kr
    left join public.result_verification rv on rv.result_id = kr.id and rv.verified
    where rv.result_id is null;

  -- consented, verified, but still inside his window
  select count(*) into ww from public.keystone_results kr
    join public.research_consent rc on rc.user_id = kr.user_id
                                   and rc.granted and rc.withdrawn_at is null
    join public.result_verification rv on rv.result_id = kr.id and rv.verified
    where now() < rc.granted_at + (rc.window_days || ' days')::interval;

  return query select a, sc, su, ww;
end $fn$;
revoke all on function research.archive_consented_results() from public, anon, authenticated, fc_researcher;

-- ---------------------------------------------------------------------------
-- 3. Record the gate as closed, with the decision on it.
-- ---------------------------------------------------------------------------
update research.governance_gates
   set status  = 'cleared',
       detail  = 'Thirty days between consent and archiving. Withdrawal inside the window removes the man entirely; after archiving the record is anonymised and cannot be found, which the consent text states plainly. Enforced by research.archive_consented_results rather than by policy.',
       cleared_by = 'Platform decision, documented in RESEARCH-GOVERNANCE-PACK.md',
       cleared_at = current_date
 where gate = 'withdrawal_window';

select 'withdrawal window enforced' as status,
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='research_consent'
       and column_name='window_days')                          as window_column,
  (select status from research.governance_gates
     where gate='withdrawal_window')                            as gate_status,
  (select count(*) from research.governance_gates
     where status='open')                                       as gates_still_open;
