-- ============================================================================
-- RESEARCH ARCHIVE FOUNDATION. Additive and idempotent.
--
-- Question this answers: participant results must be verified human, then
-- anonymized and archived for social science research. Where do they live and
-- who can reach them.
--
-- THE ARCHITECTURAL RULE THIS ENFORCES
-- Admin access and research access are different privileges held by different
-- people. An admin sees identified data to deliver the service and has no
-- research access. A researcher sees de-identified data to study it and can
-- never reach an identity. Nobody gets both by default. That separation is the
-- whole design; everything below implements it.
--
-- THREE DOMAINS, DELIBERATELY SEPARATED
--   public    operational. Identified. Serves the man. Admin reach.
--   private   the linkage key. Service role only. Never granted to anyone.
--   research  the archive. De-identified. Researcher reach. No path back.
--
-- WHY A LINKAGE TABLE EXISTS AT ALL
-- Longitudinal research needs to know that a man's week-1 and week-12 results
-- belong to the same person, without knowing who he is. So the archive is
-- pseudonymous, and the map from person to pseudonym is held in `private`,
-- outside every application role. Destroying that map is what converts the
-- archive from pseudonymized to genuinely anonymous, and the destruction point
-- is a documented decision, not an accident. Until it is destroyed, treat the
-- archive as coded data, not anonymous data.
--
-- REGULATORY CONTEXT (verified, not assumed; see the governance brief)
--   * 45 CFR 46 Subpart C. Men in Returning Home's alternative-sentencing track
--     and in court-ordered residential treatment can meet the regulatory
--     definition of "prisoner." Subpart C also attaches if any participant
--     becomes a prisoner during a study. Research on those records needs IRB
--     review with a prisoner representative seated.
--   * 42 CFR Part 2. If a partner is a federally assisted SUD treatment
--     program, its records are Part 2 records: written consent to disclose, and
--     civil and criminal penalties for violations. The 2024 Final Rule
--     (compliance required 16 Feb 2026) adopted the HIPAA de-identification
--     standards for Part 2, which is the bar `research.deidentify` is written
--     against.
--   * Most restrictive law governs where these overlap.
--
-- NOTHING IN THIS FILE AUTHORIZES RESEARCH. It builds the container and the
-- controls. Analysis waits on IRB and on Cameron Brewer's partner data use
-- agreements. See `research.governance_gates`.
-- ============================================================================

create schema if not exists research;
create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
revoke all on schema research from public, anon;

-- ---------------------------------------------------------------------------
-- 1. OPERATIONAL SIDE: consent and human verification
-- Both live in `public` because both are about serving the man, and both must
-- be answerable to him. Neither travels into the archive as free text.
-- ---------------------------------------------------------------------------

-- Research consent is separate from service consent on purpose. A man in a
-- mandated program must be able to decline research and still receive
-- everything the program offers. Bundling them would make consent coercive for
-- exactly the population least able to refuse.
create table if not exists public.research_consent (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  granted        boolean not null default false,
  consent_version text not null,
  granted_at     timestamptz,
  withdrawn_at   timestamptz,
  method         text not null default 'in_app'
                 check (method in ('in_app','paper','verbal_witnessed')),
  -- Set when the man was told, in plain language, that withdrawal cannot pull
  -- a record back once the linkage key is destroyed.
  irreversibility_disclosed boolean not null default false,
  updated_at     timestamptz not null default now()
);
alter table public.research_consent enable row level security;

drop policy if exists rc_own on public.research_consent;
create policy rc_own on public.research_consent for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists rc_admin_read on public.research_consent;
create policy rc_admin_read on public.research_consent for select to authenticated
  using (public.has_role('admin'));

-- "Verified human" is not identity verification. It answers one question: was
-- this result produced by a real man taking the instrument, rather than a bot,
-- a duplicate, or a staff member clicking through a demo. Identity stays in
-- `public`; only the boolean and the method reach the archive.
create table if not exists public.result_verification (
  result_id   uuid primary key references public.keystone_results(id) on delete cascade,
  verified    boolean not null default false,
  method      text not null
              check (method in ('facilitator_attested','id_checked','proctored','session_heuristics')),
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz not null default now(),
  notes       text
);
alter table public.result_verification enable row level security;

drop policy if exists rv_staff on public.result_verification;
create policy rv_staff on public.result_verification for all to authenticated
  using (public.has_role('admin') or public.has_role('instructor'))
  with check (public.has_role('admin') or public.has_role('instructor'));

-- ---------------------------------------------------------------------------
-- 2. THE LINKAGE KEY. private schema. Service role only.
-- No application role is granted anything here, ever. Researchers cannot see
-- it, and admins cannot see it. It exists so a pseudonym can be reused across
-- timepoints, and so a withdrawal can still find its record before the key is
-- destroyed.
-- ---------------------------------------------------------------------------
create table if not exists private.research_linkage (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  research_subject_id uuid not null unique default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  key_destroyed_at    timestamptz
);
alter table private.research_linkage enable row level security;
-- Deliberately no policies. RLS with zero policies denies everyone except the
-- service role, which is exactly the intent.

-- ---------------------------------------------------------------------------
-- 3. THE ARCHIVE. research schema. De-identified. No route back to a person.
-- ---------------------------------------------------------------------------

create table if not exists research.subjects (
  research_subject_id uuid primary key,
  -- Coarse grouping only. Never the org name, never a site, never a cohort id:
  -- a named small org plus a date is a re-identification vector on its own.
  population          text check (population in ('reentry','treatment','separation','community','unspecified')),
  partner_tier        text,          -- e.g. 'residential', 'outpatient'. Not the partner.
  first_period        text,          -- 'YYYY-Qn'. No day, no month.
  created_at          timestamptz not null default now()
);

create table if not exists research.assessment_records (
  id                  bigserial primary key,
  research_subject_id uuid not null references research.subjects(research_subject_id) on delete cascade,
  instrument_slug     text not null,
  instrument_version  text,
  scoring_mode        text,          -- norm_referenced | criterion_referenced
  norms_n             int,           -- what the score was actually computed against
  overall_pct         numeric(5,2),
  section_scores      jsonb,
  scale_scores        jsonb,         -- scores only. Never item-level free text.
  gap_scale           text,
  strength_scale      text,
  completed_period    text not null, -- 'YYYY-Qn'. Dates are a Safe Harbor identifier.
  timepoint           int,           -- 1 = baseline, 2 = second sitting, ...
  verified_human      boolean not null,
  verification_method text not null,
  archived_at         timestamptz not null default now()
);
create index if not exists ix_ar_subject   on research.assessment_records (research_subject_id);
create index if not exists ix_ar_instrument on research.assessment_records (instrument_slug, completed_period);

-- Standing record of what must be true before anyone analyses this. Read by
-- the admin console so the gates are visible rather than remembered.
create table if not exists research.governance_gates (
  gate        text primary key,
  status      text not null default 'open' check (status in ('open','cleared','not_applicable')),
  detail      text,
  cleared_by  text,
  cleared_at  date
);
insert into research.governance_gates (gate, detail) values
  ('irb_review',
   'IRB review and determination before any analysis or publication. Archiving under consent may proceed; analysis may not.'),
  ('subpart_c_prisoner_representative',
   '45 CFR 46 Subpart C. Required where participants are in alternative sentencing or court-ordered residential treatment, or become incarcerated during a study. IRB must seat a prisoner representative.'),
  ('part_2_determination',
   '42 CFR Part 2. Determine per partner whether they are a federally assisted SUD program. If so, their records need Part 2 written consent and Part 2 handling, or exclusion until cleared.'),
  ('partner_data_use_agreements',
   'Executed DUA with each partner covering research use, de-identification standard, publication rights and breach duties. Route through Cameron Brewer.'),
  ('deidentification_review',
   'Independent check that the archive meets the HIPAA de-identification standard adopted by the 2024 Part 2 Final Rule, including small-cell suppression.'),
  ('withdrawal_window',
   'Define and honour the window between consent and key destruction during which a man can still pull his record.')
on conflict (gate) do nothing;

-- ---------------------------------------------------------------------------
-- 4. ROLE SEPARATION
-- `fc_researcher` reads the archive and nothing else. It is not granted on
-- public or private, so a researcher cannot reach an identity even by mistake.
-- Admin is not granted research, so an admin cannot quietly become a
-- researcher. Grant the role to a person only after the gates above are cleared.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'fc_researcher') then
    create role fc_researcher nologin;
  end if;
end $$;

grant usage on schema research to fc_researcher;
grant select on research.subjects, research.assessment_records, research.governance_gates to fc_researcher;
revoke all on schema public  from fc_researcher;
revoke all on schema private from fc_researcher;

-- ---------------------------------------------------------------------------
-- 5. THE DE-IDENTIFYING TRANSFER
-- Runs as service role, on a schedule or on demand. Everything that could
-- re-identify is dropped or coarsened here, not later.
--
-- Dropped: user_id, session_id, org id and name, cohort id, exact timestamps,
-- any free text the man wrote (his plan cue is his own words and is a
-- re-identification risk, so it never leaves `public`).
-- Coarsened: dates to year and quarter; partner to a tier.
-- Gated: only verified, consented results move.
-- ---------------------------------------------------------------------------
create or replace function research.archive_consented_results()
returns table (archived int, skipped_no_consent int, skipped_unverified int)
language plpgsql security definer set search_path = public, research, private as $$
declare a int := 0; sc int := 0; su int := 0;
begin
  -- pseudonyms for newly consented men
  insert into private.research_linkage (user_id)
  select rc.user_id from public.research_consent rc
  where rc.granted and rc.withdrawn_at is null
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
           l.research_subject_id, rv.verified, rv.method
    from public.keystone_results kr
    join public.research_consent rc on rc.user_id = kr.user_id
                                   and rc.granted and rc.withdrawn_at is null
    join private.research_linkage l on l.user_id = kr.user_id
    join public.result_verification rv on rv.result_id = kr.id and rv.verified
    where l.key_destroyed_at is null
  )
  insert into research.assessment_records (
    research_subject_id, instrument_slug, instrument_version, scoring_mode, norms_n,
    overall_pct, section_scores, scale_scores, gap_scale, strength_scale,
    completed_period, timepoint, verified_human, verification_method)
  select e.research_subject_id,
         coalesce(nullif(current_setting('research.slug', true), ''), 'keystone-father-profile'),
         null, null, null,
         e.overall_pct, e.section_scores, e.scale_scores, e.gap_scale, e.strength_scale,
         to_char(e.completed_at, 'YYYY') || '-Q' || to_char(e.completed_at, 'Q'),
         row_number() over (partition by e.research_subject_id order by e.completed_at),
         true, e.method
  from eligible e
  on conflict do nothing;

  get diagnostics a = row_count;

  select count(*) into sc from public.keystone_results kr
    left join public.research_consent rc on rc.user_id = kr.user_id and rc.granted and rc.withdrawn_at is null
    where rc.user_id is null;
  select count(*) into su from public.keystone_results kr
    left join public.result_verification rv on rv.result_id = kr.id and rv.verified
    where rv.result_id is null;

  return query select a, sc, su;
end $$;
revoke all on function research.archive_consented_results() from public, anon, authenticated, fc_researcher;

-- ---------------------------------------------------------------------------
-- 6. SMALL-CELL SUPPRESSION
-- Scores plus a small group are re-identifying even with no name attached.
-- Researchers read through this view, which withholds grouping variables until
-- a cell is large enough. k=11 follows the common federal reporting threshold.
-- ---------------------------------------------------------------------------
create or replace view research.assessment_records_safe as
  with cell as (
    select s.population, r.completed_period, count(*) n
    from research.assessment_records r
    join research.subjects s using (research_subject_id)
    group by 1,2
  )
  select r.id, r.research_subject_id, r.instrument_slug, r.instrument_version,
         r.scoring_mode, r.norms_n, r.overall_pct, r.section_scores, r.scale_scores,
         r.gap_scale, r.strength_scale, r.timepoint, r.verified_human,
         case when c.n >= 11 then s.population       else 'suppressed' end as population,
         case when c.n >= 11 then r.completed_period else 'suppressed' end as completed_period,
         c.n as cell_size
  from research.assessment_records r
  join research.subjects s using (research_subject_id)
  join cell c on c.population = s.population and c.completed_period = r.completed_period;
grant select on research.assessment_records_safe to fc_researcher;

-- ---------------------------------------------------------------------------
-- 7. DESTROYING THE KEY. The step that makes the archive truly anonymous.
-- Deliberately a separate, explicit call. After this a man cannot withdraw a
-- record, because nothing can find it, which is why consent must say so.
-- ---------------------------------------------------------------------------
create or replace function private.destroy_research_linkage(p_confirm text)
returns text language plpgsql security definer set search_path = private as $$
begin
  if p_confirm is distinct from 'DESTROY LINKAGE KEY' then
    return 'Not destroyed. Pass the exact confirmation phrase.';
  end if;
  update private.research_linkage set key_destroyed_at = now() where key_destroyed_at is null;
  delete from private.research_linkage where key_destroyed_at is not null;
  return 'Linkage key destroyed. The archive is now anonymous and withdrawal is no longer possible.';
end $$;
revoke all on function private.destroy_research_linkage(text) from public, anon, authenticated, fc_researcher;

select 'research archive foundation ready' as status,
  (select count(*) from information_schema.schemata where schema_name in ('research','private')) as schemas,
  (select count(*) from information_schema.tables where table_schema in ('research','private')) as tables,
  (select count(*) from research.governance_gates where status = 'open') as open_gates;
