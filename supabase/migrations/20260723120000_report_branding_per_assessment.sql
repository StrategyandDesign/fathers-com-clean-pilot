-- Per-assessment report branding. Additive and idempotent.
--
-- THE PROBLEM
-- report_branding was declared `id int primary key default 1 check (id = 1)`.
-- One row, enforced by the database. Both the report and Studio read and write
-- `.eq('id', 1)`. So the two logos, the two accent colours, the three section
-- photos and the hero and footer backgrounds were global. Setting a hero image
-- for the Manhood report set it for the Father report at the same instant, which
-- is why the Studio panel says changes apply to every report.
--
-- Report CONTENT was already per-assessment: title, thesis, per-scale copy,
-- section intros, scoring mode and norm claims all resolve from the instrument.
-- Branding was the one part that could not follow the assessment.
--
-- AFTER THIS
-- One row per assessment, plus one row with assessment_slug NULL that acts as
-- the default. A report looks for its own slug first and falls back to the
-- default, so an assessment with no branding of its own still renders exactly as
-- it does today. Nothing changes visually until someone sets per-assessment
-- branding on purpose.

-- 1. Free the table from its single-row constraint.
alter table public.report_branding drop constraint if exists report_branding_id_check;

-- 2. New rows need their own ids. The existing row keeps id 1.
create sequence if not exists public.report_branding_id_seq as int start with 2;
select setval('public.report_branding_id_seq',
              greatest(coalesce((select max(id) from public.report_branding), 1), 1));
alter table public.report_branding
  alter column id set default nextval('public.report_branding_id_seq');
alter sequence public.report_branding_id_seq owned by public.report_branding.id;

-- 3. Which assessment this branding belongs to. NULL means the default, used by
--    any assessment that has no branding of its own.
alter table public.report_branding add column if not exists assessment_slug text;

-- One branding row per assessment, and only one default.
create unique index if not exists uq_report_branding_slug
  on public.report_branding (assessment_slug) where assessment_slug is not null;
create unique index if not exists uq_report_branding_default
  on public.report_branding ((assessment_slug is null)) where assessment_slug is null;

comment on column public.report_branding.assessment_slug is
  'Assessment this branding applies to. NULL is the default used when an assessment has none of its own.';

select 'per-assessment report branding ready' as status,
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='report_branding'
       and column_name='assessment_slug') as slug_col,
  (select count(*) from public.report_branding) as branding_rows,
  (select count(*) from public.report_branding where assessment_slug is null) as default_rows;
