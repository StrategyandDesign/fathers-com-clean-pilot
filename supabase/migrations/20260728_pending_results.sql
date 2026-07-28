-- ============================================================================
-- Pending results: a finished sitting survives the email round trip.
--
-- The failure this closes: a man completes the profile signed out, his scored
-- result is parked in localStorage, and the magic link opens on his phone, in
-- a mail app, in a browser that has never seen that localStorage. His account
-- is created empty. The report shows him a sample. The plan shows him a demo
-- pinned to week 3. His twenty minutes are gone.
--
-- The fix: at completion the browser parks the scored result in this table
-- under a random claim token. The emailed link carries the token. Whatever
-- device he lands on, claim_pending_result() redeems the token into
-- keystone_results for the account that just authenticated, then burns it.
--
-- Privacy shape: rows carry no identity. anon may INSERT only; nobody may
-- SELECT except through the redeeming function, which requires a valid token
-- and an authenticated caller. Unclaimed rows expire after 7 days.
--
-- ON CONFLICT note: the only conflict target in this file is a primary key,
-- a plain unique index. No partial index is used for conflict resolution.
-- ============================================================================

create table if not exists pending_results (
  token           uuid primary key,
  assessment_slug text not null default 'keystone-father-profile',
  payload         jsonb not null,
  created_at      timestamptz not null default now(),
  claimed_by      uuid,
  claimed_at      timestamptz,

  constraint pending_payload_shape check (payload ? 'scored')
);

comment on table pending_results is
  'Completed assessment sittings awaiting account claim. No identity columns; '
  'the token in the emailed link is the sole key. Expired and claimed rows are '
  'purged by purge_pending_results().';

alter table pending_results enable row level security;

-- The browser, signed out, parks the finished sitting. Insert only.
drop policy if exists pending_park on pending_results;
create policy pending_park
  on pending_results
  for insert
  to anon, authenticated
  with check (claimed_by is null and claimed_at is null);

-- No select, update, or delete policy for either role: reading and redeeming
-- happen only through the definer function below.
revoke all on pending_results from anon, authenticated;
grant insert (token, assessment_slug, payload) on pending_results to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Redemption. Idempotent per token. Returns true when a row was moved.
-- ---------------------------------------------------------------------------
create or replace function claim_pending_result(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  pend pending_results%rowtype;
  sc   jsonb;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into pend
  from pending_results
  where token = p_token
    and claimed_at is null
    and created_at > now() - interval '7 days'
  for update skip locked;

  if not found then
    return false;   -- unknown, expired, or already claimed: nothing to do
  end if;

  sc := pend.payload -> 'scored';

  insert into keystone_results
    (user_id, assessment_slug, overall_pct, section_scores, scale_scores,
     gap_scale, strength_scale)
  values
    (auth.uid(),
     pend.assessment_slug,
     nullif(sc ->> 'overall','')::numeric,
     sc -> 'sections',
     sc -> 'scales',
     sc ->> 'gap',
     sc ->> 'strength');

  update pending_results
     set claimed_by = auth.uid(), claimed_at = now()
   where token = p_token;

  return true;
end $$;

revoke all on function claim_pending_result(uuid) from public;
grant execute on function claim_pending_result(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Hygiene. Run from a scheduled job or by hand; safe any time.
-- ---------------------------------------------------------------------------
create or replace function purge_pending_results()
returns integer
language sql
security definer
set search_path = public
as $$
  with gone as (
    delete from pending_results
    where claimed_at is not null
       or created_at < now() - interval '7 days'
    returning 1
  )
  select count(*)::integer from gone;
$$;

revoke all on function purge_pending_results() from public;

-- ---------------------------------------------------------------------------
-- Verification, after applying:
-- A. RLS on:      select relrowsecurity from pg_class where relname='pending_results';
-- B. anon insert: works;  anon select: permission denied.
-- C. claim as an authenticated user moves the row into keystone_results,
--    marks it claimed, and a second claim of the same token returns false.
-- ---------------------------------------------------------------------------
