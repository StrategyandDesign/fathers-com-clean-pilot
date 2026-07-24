-- Fix the branding upsert. Additive and idempotent.
--
-- THE BUG
-- Saving branding for a specific assessment failed with:
--   "there is no unique or exclusion constraint matching the ON CONFLICT
--    specification"
--
-- The per-assessment migration created this:
--   create unique index uq_report_branding_slug
--     on report_branding (assessment_slug) where assessment_slug is not null;
--
-- That is a PARTIAL unique index. Postgres will not use a partial index to
-- resolve ON CONFLICT unless the statement repeats the identical WHERE clause,
-- and PostgREST does not. So every per-assessment save was rejected.
--
-- Two symptoms from one cause: branding never saved, and the preview then had no
-- row to find, so it correctly showed the default and looked broken as well.
--
-- THE FIX
-- Make the index plain. Postgres treats NULLs as distinct in a unique index, so
-- a plain index still permits the NULL default row, and ON CONFLICT
-- (assessment_slug) now resolves for every real slug.
--
-- The "only one default" rule does NOT come from this index. It is enforced
-- separately by uq_report_branding_default, which stays partial because it is
-- never used for conflict resolution. Both rules hold; only the inference is
-- fixed.

-- Guard: if two default rows somehow exist, the plain index would still allow it
-- but the default index would already have failed. Report rather than assume.
do $$
declare dupes int;
begin
  select count(*) into dupes from (
    select assessment_slug from public.report_branding
    where assessment_slug is not null
    group by assessment_slug having count(*) > 1
  ) q;
  if dupes > 0 then
    raise exception 'Cannot create a unique index: % assessment_slug value(s) are duplicated. Resolve before rerunning.', dupes;
  end if;
end $$;

drop index if exists public.uq_report_branding_slug;

create unique index if not exists uq_report_branding_slug
  on public.report_branding (assessment_slug);

comment on index public.uq_report_branding_slug is
  'One branding row per assessment. Plain rather than partial so ON CONFLICT (assessment_slug) resolves; a partial index cannot be used for conflict inference. NULL rows remain permitted here and are constrained to one by uq_report_branding_default.';

select 'branding upsert fixed' as status,
  (select count(*) from pg_indexes
     where schemaname='public' and indexname='uq_report_branding_slug')     as slug_index,
  (select indexdef like '%WHERE%' from pg_indexes
     where schemaname='public' and indexname='uq_report_branding_slug')     as still_partial_should_be_false,
  (select count(*) from pg_indexes
     where schemaname='public' and indexname='uq_report_branding_default')  as default_index,
  (select count(*) from public.report_branding)                             as branding_rows;
