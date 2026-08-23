-- Let anonymous visitors call the public serial check.
-- Anon has no USAGE on schema internal, so the public wrapper is a thin
-- security-definer hop to internal.verify_certificate_serial.
-- Privileged read stays in internal. Allow-listed columns only.

create or replace function public.verify_certificate_serial(p_serial text)
returns table (
  serial_number text,
  training_title text,
  issued_at timestamptz,
  issuer_name text,
  recipient_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select * from internal.verify_certificate_serial($1);
$$;

revoke all on function internal.verify_certificate_serial(text) from public, anon;
grant execute on function internal.verify_certificate_serial(text) to authenticated, service_role;
revoke all on function public.verify_certificate_serial(text) from public;
grant execute on function public.verify_certificate_serial(text) to anon, authenticated, service_role;

comment on function public.verify_certificate_serial(text) is
  'Public serial check. Allow-listed fields only. Thin definer wrapper so anonymous visitors can check a serial without usage on the internal schema.';
