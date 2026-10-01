-- Leaders already have a select policy on participant_claims. The table
-- grant was missing, so the desk query failed with permission denied and
-- could not show claimed seats.

grant select on table public.participant_claims to authenticated;
