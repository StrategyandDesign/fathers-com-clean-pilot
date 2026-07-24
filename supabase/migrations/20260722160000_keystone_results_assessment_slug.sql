-- Correlate each saved result to the exact assessment that produced it.
-- Both Keystone instruments (father, manhood) carry 26 scales across the same
-- three sections, so a result cannot be told apart by shape. Identity must be
-- stored on the row. The report and the participant dashboard read this column
-- through the assessment registry; the key-count heuristic is retained only as a
-- fallback for rows written before this column existed.
--
-- Idempotent: safe to run more than once.

alter table if exists public.keystone_results
  add column if not exists assessment_slug text;

comment on column public.keystone_results.assessment_slug is
  'Assessment registry slug (e.g. keystone-father-profile, keystone-manhood-profile). Written at save time; the report is rendered from the matching assessment.';

-- Legacy rows predate tagging and are all father profiles. Default them so the
-- report resolves without falling back to the heuristic.
update public.keystone_results
  set assessment_slug = 'keystone-father-profile'
  where assessment_slug is null;
