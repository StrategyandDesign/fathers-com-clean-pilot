-- Engine verticals (v4.7.0)
-- The certification spine opens to partner programs that carry their own
-- standard on the same verification infrastructure. Three capabilities:
--   1. Signatory parameterization: certificates record who signs them.
--   2. Serial namespacing: each vertical mints under its own prefix.
--   3. Norms authority: each instrument states who normed it and on whom.
-- NCF remains the default everywhere: a course with no vertical mints FC
-- serials signed by Dr. Ken Canfield, exactly as today.
-- DEPLOY ORDER: apply this migration BEFORE deploying the updated
-- issue-certificate function (docs/ENGINE.md). Idempotent.

create table if not exists public.platform_verticals (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  name                text not null,
  cert_prefix         text not null unique,     -- e.g. FC stays NCF's
  authority_name      text not null,            -- who signs and stands behind it
  authority_title     text,
  authority_statement text,                     -- printed norms/validity line
  active              boolean not null default false,
  created_at          timestamptz not null default now()
);

alter table public.platform_verticals enable row level security;
drop policy if exists public_reads_active_verticals on public.platform_verticals;
create policy public_reads_active_verticals
  on public.platform_verticals for select
  using (active = true);

alter table if exists public.certificate_courses
  add column if not exists vertical_id uuid references public.platform_verticals(id);

alter table if exists public.certificates
  add column if not exists signatory_name  text,
  add column if not exists signatory_title text,
  add column if not exists vertical_slug   text;

-- Norms authority on the instrument itself. The engine hosts the instrument;
-- the subject-matter authority owns its validity, the way Dr. Canfield owns
-- Keystone's. Renderers print the statement when present.
alter table if exists public.instruments
  add column if not exists norms_authority  text,
  add column if not exists norms_statement  text;
