-- ============================================================================
-- Returning Home pilot: participant codes, no identity.
--
-- Custody model. Returning Home holds the crosswalk from code to person.
-- This database never receives a name, an email address, a date of birth, or
-- a case number. If it is breached, what leaks is assessment scores attached
-- to meaningless strings.
--
-- The rule this file enforces: no direct identifier may be added to
-- pilot_participant. There is a guard at the bottom that fails loudly if one
-- ever appears, so a future migration cannot quietly undo the decision.
--
-- NOTE ON ON CONFLICT. Every conflict target used against this table resolves
-- against the primary key, which is a plain unique index. No partial index is
-- used for conflict resolution anywhere in this file. That was the defect in
-- the report_branding migration and it is deliberately not repeated here.
-- ============================================================================

create table if not exists pilot_participant (
  code          text primary key,
  cohort        text        not null,
  status        text        not null default 'issued',
  created_at    timestamptz not null default now(),
  activated_at  timestamptz,
  withdrawn_at  timestamptz,
  auth_user_id  uuid unique references auth.users(id) on delete set null,

  -- Crockford Base32, seven characters, payload plus Luhn mod 32 check.
  constraint pilot_code_shape
    check (code ~ '^[0-9A-HJKMNP-TV-Z]{7}$'),

  constraint pilot_status_known
    check (status in ('issued','active','withdrawn','completed'))
);

comment on table pilot_participant is
  'Returning Home pilot roster. Codes only. Adding any direct identifier '
  '(name, email, phone, date of birth, case number, inmate number) to this '
  'table breaks the custody model agreed with Returning Home. The crosswalk '
  'lives with Returning Home and must not be reconstructed here.';

create index if not exists ix_pilot_participant_cohort
  on pilot_participant (cohort);

-- ---------------------------------------------------------------------------
-- Row level security. A man sees his own row and nothing else. Nobody using
-- the anon or authenticated role can enumerate the roster.
-- ---------------------------------------------------------------------------
alter table pilot_participant enable row level security;

drop policy if exists pilot_self_read on pilot_participant;
create policy pilot_self_read
  on pilot_participant
  for select
  to authenticated
  using (auth_user_id = auth.uid());

drop policy if exists pilot_self_activate on pilot_participant;
create policy pilot_self_activate
  on pilot_participant
  for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- No insert or delete policy is defined, so neither role can create or remove
-- roster rows. Enrolment happens through the SQL editor with the postgres
-- role. That is intentional: issuing a code should be a deliberate act.

revoke all on pilot_participant from anon;
grant select, update on pilot_participant to authenticated;

-- ---------------------------------------------------------------------------
-- Guard. Fails the migration if a direct identifier has been added.
-- Re-runnable: keep this at the end of any future migration touching the table.
-- ---------------------------------------------------------------------------
do $$
declare
  offending text;
begin
  select string_agg(column_name, ', ')
    into offending
  from information_schema.columns
  where table_schema = 'public'
    and table_name   = 'pilot_participant'
    and (
      column_name ~* '(name|email|phone|mobile|dob|birth|ssn|address|inmate|case_?no|case_?number|docket|offender)'
    );

  if offending is not null then
    raise exception
      'pilot_participant contains direct identifiers (%). The Returning Home '
      'custody model forbids this. Remove the column or change the model on '
      'purpose, in writing, with Returning Home.', offending;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Verification. Run these after applying. Every one must come back as stated.
-- ---------------------------------------------------------------------------

-- A. RLS is on. Expect true.
-- select relrowsecurity from pg_class where relname = 'pilot_participant';

-- B. No conflict target on this table is a partial index. Expect all false.
-- select indexname, (indexdef ilike '%where%') as partial
-- from pg_indexes where tablename = 'pilot_participant';

-- C. The shape constraint bites. Expect an error, not a row.
-- insert into pilot_participant (code, cohort) values ('bad', 'x');

-- D. anon cannot read. Expect zero rows from the REST endpoint with the anon key.
