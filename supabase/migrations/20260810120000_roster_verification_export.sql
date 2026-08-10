-- Roster verification export (v4.6.0)
-- A Certified Facilitator can read the certificates of exactly the men he has
-- actively claimed, so the Facilitator Desk can produce one verification sheet
-- for a court coordinator or caseworker. Doctrine: the export is the
-- organization's own act with its own participants; the public verification
-- page still never names the organization (POSITIONING.md 9).
-- Idempotent. Read-only grant; nothing about issuance changes.

alter table if exists public.certificates enable row level security;

drop policy if exists facilitator_reads_claimed_certificates on public.certificates;
create policy facilitator_reads_claimed_certificates
  on public.certificates
  for select
  to authenticated
  using (
    exists (
      select 1
        from public.participant_claims pc
        join public.profiles p
          on lower(p.email) = lower(pc.participant_email)
       where pc.facilitator_user_id = auth.uid()
         and pc.status = 'active'
         and p.id = public.certificates.user_id
    )
  );

-- The sheet also names the man and his course. Facilitators can already read
-- their circle members' profiles through the roster; this covers claimed men
-- who are not yet in a circle, and the course-title lookup.
drop policy if exists facilitator_reads_claimed_profiles on public.profiles;
create policy facilitator_reads_claimed_profiles
  on public.profiles
  for select
  to authenticated
  using (
    exists (
      select 1
        from public.participant_claims pc
       where pc.facilitator_user_id = auth.uid()
         and pc.status = 'active'
         and lower(pc.participant_email) = lower(public.profiles.email)
    )
  );

drop policy if exists authenticated_reads_course_titles on public.certificate_courses;
create policy authenticated_reads_course_titles
  on public.certificate_courses
  for select
  to authenticated
  using (true);
