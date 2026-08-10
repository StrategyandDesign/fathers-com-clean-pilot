-- Delivery modes and locale (v4.9.0)
-- Receptivity findings adopted as engine parameters (POSITIONING.md 19):
--   1. completion_mode: court-facing courses keep the graded final; voluntary
--      military and similar cohorts may complete on verified checkpoints.
--      The certificate always records which mode earned it.
--   2. locale and rtl on platform_verticals: a partner vertical can declare
--      its delivery language; Hebrew localization for an IDF pilot is the
--      first intended use. Recording intent precedes building translation.
-- Idempotent. NCF defaults unchanged.

alter table if exists public.certificate_courses
  add column if not exists completion_mode text not null default 'graded_final';

do $$ begin
  alter table public.certificate_courses
    add constraint certificate_courses_completion_mode_check
    check (completion_mode in ('graded_final', 'checkpoint'));
exception when duplicate_object then null; end $$;

alter table if exists public.certificates
  add column if not exists completion_mode text;

alter table if exists public.platform_verticals
  add column if not exists locale text not null default 'en',
  add column if not exists rtl boolean not null default false;
