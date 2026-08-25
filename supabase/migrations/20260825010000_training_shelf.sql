-- Leader catalog shelf: house trainings vs org-owned / org-opt-in modules.
-- Existing published catalog rows default to fathering. Mark org_program
-- only when a training is site-owned or an org opt-in, not Ken catalog.
-- Down path: alter table public.trainings drop constraint if exists trainings_shelf_check;
--            alter table public.trainings drop column if exists shelf;

alter table public.trainings
  add column if not exists shelf text not null default 'fathering';

alter table public.trainings
  drop constraint if exists trainings_shelf_check;

alter table public.trainings
  add constraint trainings_shelf_check
  check (shelf in ('fathering', 'org_program'));

comment on column public.trainings.shelf is
  'Leader catalog shelf. fathering is the house catalog. org_program is org-owned or org-opt-in.';
