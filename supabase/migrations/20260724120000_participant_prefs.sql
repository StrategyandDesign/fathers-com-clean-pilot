-- Participant preferences. Additive and idempotent.
--
-- The settings page had no store behind it. A man could not change how the
-- platform contacts him, decide whether his facilitator may open his report,
-- take his data, or close his account. For men enrolled through a treatment or
-- reentry programme, where the platform holds a document about how they father
-- and how they carry themselves, that control is not a nicety.
--
-- One jsonb column rather than a column per switch: preferences change often and
-- each new one should not need a migration.

alter table if exists public.profiles
  add column if not exists prefs jsonb not null default '{}'::jsonb;

comment on column public.profiles.prefs is
  'Participant-controlled settings: email_weekly, email_course, email_news, share_facilitator. Email is off by default; facilitator sharing defaults on because it is how a programme supports him, and he can switch it off.';

-- A man must be able to read and change his own row.
do $$
begin
  if not exists (select 1 from pg_policies
                 where schemaname='public' and tablename='profiles' and policyname='profiles_own_rw') then
    execute $p$create policy profiles_own_rw on public.profiles
              for all to authenticated using (id = auth.uid()) with check (id = auth.uid())$p$;
  end if;
end $$;

select 'participant preferences ready' as status,
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='profiles' and column_name='prefs') as prefs_column,
  (select count(*) from pg_policies
     where schemaname='public' and tablename='profiles' and policyname='profiles_own_rw') as own_row_policy;
