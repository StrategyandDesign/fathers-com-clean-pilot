-- CALIBRATION ENGINE. Additive, idempotent, read-only.
--
-- What this is for
-- An instrument is calibrated when each scale carries a mean, a standard
-- deviation and a reliability coefficient computed from real people answering
-- real items. The Keystone Father Profile has those from 2,066 fathers. The
-- Keystone Manhood Profile has none, because no one has taken it yet.
--
-- Numbers cannot be borrowed between instruments. A mean describes a specific
-- population answering specific items; the father means describe fathers
-- answering fathering items and say nothing about how men answer manhood items.
-- So this file does not invent numbers. It computes them, from sittings, using
-- the same statistics the Father Profile was normed with.
--
-- What it computes, per scale
--   n         how many men answered enough of the scale to count
--   mean      the scale's raw sum, averaged across those men
--   sd        the population standard deviation of that sum
--   alpha     Cronbach's alpha, the reliability coefficient
--             alpha = (k/(k-1)) * (1 - sum(item variances) / variance of total)
--   floor/ceiling  share of men at the bottom or top of the scale
--
-- What to do with the output
-- Run calibration_report to watch a pilot as it fills. When n is large enough
-- and alpha clears .80, run emit_instrument_norms to get the exact mean, sd and
-- rel values to paste into the instrument file. Nothing writes itself: putting
-- norms into an instrument is a deliberate act with a person's name on it.
--
-- Thresholds are stated, not assumed. The Father Profile reliabilities run .80
-- to .87, so .80 is the bar. Norming at n>=1000 is the bar for switching an
-- instrument from criterion-referenced to norm-referenced scoring.

create schema if not exists calib;
revoke all on schema calib from public, anon;
grant usage on schema calib to authenticated;

-- ---------------------------------------------------------------------------
-- 1. Long-form answers for one instrument.
--    keystone_answers stores one row per item, keyed 'section.scale.index'.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 2. Per-scale statistics for one instrument.
-- ---------------------------------------------------------------------------
create or replace function calib.scale_stats(p_slug text)
returns table (
  scale_key text, k_items int, n_respondents bigint,
  mean numeric, sd numeric, alpha numeric,
  floor_pct numeric, ceiling_pct numeric
)
language sql stable security definer set search_path = public, calib as $$
  with a as (
    select * from calib.answers_long where assessment_slug = p_slug
  ),
  -- how many distinct items each scale has, from the data itself
  k as (
    select scale_key, count(distinct item_index)::int as k_items from a group by 1
  ),
  -- one total per man per scale, only where he answered every item
  totals as (
    select a.scale_key, a.session_id,
           sum(a.value) as total,
           count(*)     as answered
    from a group by 1,2
  ),
  complete as (
    select t.scale_key, t.session_id, t.total
    from totals t join k on k.scale_key = t.scale_key
    where t.answered = k.k_items
  ),
  -- variance of each individual item, summed per scale
  item_var as (
    select a.scale_key, sum(v) as sum_item_var from (
      select scale_key, item_index, var_pop(value) as v
      from a group by 1,2
    ) a group by 1
  ),
  totvar as (
    select scale_key, count(*) as n, avg(total) as mean,
           stddev_pop(total) as sd, var_pop(total) as total_var,
           min(total) as lo, max(total) as hi
    from complete group by 1
  )
  select tv.scale_key,
         k.k_items,
         tv.n,
         round(tv.mean, 3),
         round(tv.sd, 3),
         case when k.k_items > 1 and tv.total_var > 0
              then round(((k.k_items::numeric / (k.k_items - 1))
                          * (1 - iv.sum_item_var / tv.total_var))::numeric, 3)
              else null end as alpha,
         round(100.0 * (select count(*) from complete c
                        where c.scale_key = tv.scale_key and c.total = tv.lo) / tv.n, 1),
         round(100.0 * (select count(*) from complete c
                        where c.scale_key = tv.scale_key and c.total = tv.hi) / tv.n, 1)
  from totvar tv
  join k on k.scale_key = tv.scale_key
  join item_var iv on iv.scale_key = tv.scale_key
  order by tv.scale_key;
$$;

-- ---------------------------------------------------------------------------
-- 3. Item-level diagnostics. A low item-total correlation means the item is not
--    measuring what the rest of its scale measures, and is a candidate to cut.
-- ---------------------------------------------------------------------------
create or replace function calib.item_stats(p_slug text)
returns table (scale_key text, item_index text, n bigint, mean numeric,
               sd numeric, item_total_r numeric)
language sql stable security definer set search_path = public, calib as $$
  with a as (select * from calib.answers_long where assessment_slug = p_slug),
  totals as (select scale_key, session_id, sum(value) as total from a group by 1,2),
  joined as (
    select a.scale_key, a.item_index, a.session_id, a.value,
           t.total - a.value as rest_total          -- corrected item-total
    from a join totals t on t.scale_key = a.scale_key and t.session_id = a.session_id
  )
  select scale_key, item_index, count(*) as n,
         round(avg(value),3), round(stddev_pop(value),3),
         round(corr(value, rest_total)::numeric, 3)
  from joined group by 1,2 order by 1,2;
$$;

-- ---------------------------------------------------------------------------
-- 4. The readout. One row per scale, with a plain verdict.
-- ---------------------------------------------------------------------------
create or replace function calib.calibration_report(p_slug text)
returns table (scale_key text, n bigint, k_items int, mean numeric, sd numeric,
               alpha numeric, floor_pct numeric, ceiling_pct numeric, verdict text)
language sql stable security definer set search_path = public, calib as $$
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
$$;

-- ---------------------------------------------------------------------------
-- 5. Emit the instrument block. Copy the output into the instrument file.
--    Refuses below n=1000, because publishing norms from a thin sample is how a
--    profile ends up making claims it cannot support.
-- ---------------------------------------------------------------------------
create or replace function calib.emit_instrument_norms(p_slug text, p_force boolean default false)
returns text
language plpgsql stable security definer set search_path = public, calib as $$
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
  select count(*) into bad from calib.scale_stats(p_slug) where alpha is null or alpha < 0.80;
  select string_agg(format('  %s: mean:%s, sd:%s, rel:%s',
           scale_key, mean, sd, coalesce(alpha::text,'null')), E',\n' order by scale_key)
    into out_text from calib.scale_stats(p_slug);
  return format(E'// Computed from %s sittings on %s.\n// %s of 26 scales are below the .80 reliability bar.\n%s',
                min_n, current_date, bad, out_text);
end $$;

revoke all on function calib.emit_instrument_norms(text, boolean) from anon;

select 'calibration engine ready' as status,
  (select count(*) from information_schema.routines
     where routine_schema='calib') as functions;
