-- RUN THIS ONE FILE. Idempotent, safe to run more than once.
--
-- PART 1 FIXES A LIVE BUG. Read this before running.
--
-- keystone_results has no assessment_slug column in this database. The migration
-- that adds it was written but never applied here. Meanwhile the live app writes
-- that column on every save, and the save path did not check the result, so:
--
--   the insert was rejected  ->  the session was marked completed anyway
--   ->  the man saw "done"   ->  his answers were never stored
--
-- Any signed-in man who completed a profile since that code shipped lost his
-- result. Part 1 stops that. The matching client fix, which refuses to mark a
-- sitting complete when the result did not save, ships alongside this.
--
-- PART 2 installs the calibration engine, which reads that column. It failed to
-- run for the same reason. Both are here in one file so the order cannot be got
-- wrong.

-- ===========================================================================
-- PART 1: the missing column
-- ===========================================================================
alter table if exists public.keystone_results
  add column if not exists assessment_slug text;

comment on column public.keystone_results.assessment_slug is
  'Assessment registry slug, e.g. keystone-father-profile or keystone-manhood-profile. Written at save time; the report, plan and dashboard all render from the matching assessment.';

-- Rows written before tagging existed are father profiles.
update public.keystone_results
   set assessment_slug = 'keystone-father-profile'
 where assessment_slug is null;

create index if not exists ix_keystone_results_slug
  on public.keystone_results (assessment_slug, completed_at desc);

-- ===========================================================================
-- PART 2: the calibration engine
-- ===========================================================================
create schema if not exists calib;
revoke all on schema calib from public, anon;
grant usage on schema calib to authenticated;

create or replace view calib.answers_long as
  select a.session_id,
         s.user_id,
         coalesce(r.assessment_slug, 'keystone-father-profile') as assessment_slug,
         split_part(a.item_key, '.', 1) as section_key,
         split_part(a.item_key, '.', 2) as scale_key,
         split_part(a.item_key, '.', 3) as item_index,
         a.value::numeric                as value
  from public.keystone_answers a
  join public.keystone_sessions s on s.id = a.session_id
  left join public.keystone_results r on r.session_id = a.session_id
  where a.value is not null;

create or replace function calib.scale_stats(p_slug text)
returns table (
  scale_key text, k_items int, n_respondents bigint,
  mean numeric, sd numeric, alpha numeric,
  floor_pct numeric, ceiling_pct numeric
)
language sql stable security definer set search_path = public, calib as $fn$
  with a as (select * from calib.answers_long where assessment_slug = p_slug),
  k as (select scale_key, count(distinct item_index)::int as k_items from a group by 1),
  totals as (select scale_key, session_id, sum(value) as total, count(*) as answered
             from a group by 1,2),
  complete as (select t.scale_key, t.session_id, t.total
               from totals t join k on k.scale_key = t.scale_key
               where t.answered = k.k_items),
  item_var as (select scale_key, sum(v) as sum_item_var from (
                 select scale_key, item_index, var_pop(value) as v from a group by 1,2) q
               group by 1),
  totvar as (select scale_key, count(*) as n, avg(total) as mean,
                    stddev_pop(total) as sd, var_pop(total) as total_var,
                    min(total) as lo, max(total) as hi
             from complete group by 1)
  select tv.scale_key, k.k_items, tv.n,
         round(tv.mean, 3), round(tv.sd, 3),
         case when k.k_items > 1 and tv.total_var > 0
              then round(((k.k_items::numeric / (k.k_items - 1))
                          * (1 - iv.sum_item_var / tv.total_var))::numeric, 3)
              else null end,
         round(100.0 * (select count(*) from complete c
                        where c.scale_key = tv.scale_key and c.total = tv.lo) / tv.n, 1),
         round(100.0 * (select count(*) from complete c
                        where c.scale_key = tv.scale_key and c.total = tv.hi) / tv.n, 1)
  from totvar tv
  join k on k.scale_key = tv.scale_key
  join item_var iv on iv.scale_key = tv.scale_key
  order by tv.scale_key;
$fn$;

create or replace function calib.item_stats(p_slug text)
returns table (scale_key text, item_index text, n bigint, mean numeric,
               sd numeric, item_total_r numeric)
language sql stable security definer set search_path = public, calib as $fn$
  with a as (select * from calib.answers_long where assessment_slug = p_slug),
  totals as (select scale_key, session_id, sum(value) as total from a group by 1,2),
  joined as (select a.scale_key, a.item_index, a.session_id, a.value,
                    t.total - a.value as rest_total
             from a join totals t
               on t.scale_key = a.scale_key and t.session_id = a.session_id)
  select scale_key, item_index, count(*), round(avg(value),3),
         round(stddev_pop(value),3), round(corr(value, rest_total)::numeric, 3)
  from joined group by 1,2 order by 1,2;
$fn$;

create or replace function calib.calibration_report(p_slug text)
returns table (scale_key text, n bigint, k_items int, mean numeric, sd numeric,
               alpha numeric, floor_pct numeric, ceiling_pct numeric, verdict text)
language sql stable security definer set search_path = public, calib as $fn$
  select s.scale_key, s.n_respondents, s.k_items, s.mean, s.sd, s.alpha,
         s.floor_pct, s.ceiling_pct,
         case
           when s.n_respondents < 100 then 'too few sittings to judge'
           when s.alpha is null       then 'no variance yet'
           when s.alpha < 0.60        then 'unreliable, rewrite the scale'
           when s.alpha < 0.80        then 'below the .80 bar, review items'
           when s.ceiling_pct > 25    then 'reliable but ceiling effect, items too easy'
           when s.floor_pct  > 25     then 'reliable but floor effect, items too hard'
           else 'meets the bar'
         end
  from calib.scale_stats(p_slug) s order by s.scale_key;
$fn$;

create or replace function calib.emit_instrument_norms(p_slug text, p_force boolean default false)
returns text
language plpgsql stable security definer set search_path = public, calib as $fn$
declare min_n bigint; out_text text; bad int;
begin
  select min(n_respondents) into min_n from calib.scale_stats(p_slug);
  if min_n is null then
    return 'No sittings for ' || p_slug || '. Nothing to compute.';
  end if;
  if min_n < 1000 and not p_force then
    return 'Smallest scale has n=' || min_n || '. Norming needs n>=1000. '
        || 'Pass true as the second argument to emit provisional values anyway, '
        || 'clearly labelled as provisional.';
  end if;
  select count(*) into bad from calib.scale_stats(p_slug)
    where alpha is null or alpha < 0.80;
  select string_agg(format('  %s: mean:%s, sd:%s, rel:%s',
           scale_key, mean, sd, coalesce(alpha::text,'null')), E',\n' order by scale_key)
    into out_text from calib.scale_stats(p_slug);
  return format(E'// Computed from %s sittings on %s.\n// %s of 26 scales are below the .80 reliability bar.\n%s',
                min_n, current_date, bad, out_text);
end $fn$;

revoke all on function calib.emit_instrument_norms(text, boolean) from anon;

-- ===========================================================================
-- Verification. Every value should look right before you move on.
-- ===========================================================================
select
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='keystone_results'
       and column_name='assessment_slug')            as slug_column_exists,
  (select count(*) from public.keystone_results)      as total_results,
  (select count(*) from public.keystone_results
     where assessment_slug is null)                   as untagged_results,
  (select count(*) from information_schema.routines
     where routine_schema='calib')                    as calib_functions,
  (select count(*) from public.keystone_sessions s
     where s.status = 'completed'
       and not exists (select 1 from public.keystone_results r
                       where r.session_id = s.id))    as sittings_marked_done_with_no_result;
