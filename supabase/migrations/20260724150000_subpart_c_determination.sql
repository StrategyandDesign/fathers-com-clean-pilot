-- Subpart C applicability determination. Additive and idempotent.
--
-- THE DETERMINATION
-- Asked and answered 24 July 2026:
--   Does the National Center for Fathering hold a Federalwide Assurance
--   covering this work?                                            NO
--   Does any federal funding touch this research?                  NO
--
-- WHAT THAT MEANS
-- 45 CFR 46 Subpart C binds research conducted or supported by DHHS, and any
-- institution whose Federalwide Assurance elects to apply the Common Rule to all
-- human subjects research regardless of funding. Neither applies here. So the
-- federal machinery does not attach:
--
--   no OHRP certification under 46.306(a)(1)
--   no waiting on an OHRP authorisation letter before collecting data
--   no federal requirement for a prisoner representative as a voting member
--   no requirement to place the study in a 46.306(a)(2) category
--
-- WHAT IT DOES NOT CHANGE
-- Four things survive this determination untouched, and confusing them would be
-- the expensive mistake:
--
--   1. 42 CFR PART 2 is a different law with a different trigger. It attaches
--      because a PARTNER is a federally assisted substance use programme, not
--      because the research is federally funded. Still live. Still needs a
--      written answer from each partner.
--
--   2. STATE LAW is untouched by a federal funding determination.
--
--   3. PUBLICATION. Peer-reviewed journals require IRB approval regardless of
--      funding. A paper without it is unpublishable in most venues.
--
--   4. THE ETHICS. Men in court-ordered treatment and alternative sentencing are
--      in a limited-choice environment whether or not a federal rule says so.
--      The reason Subpart C exists does not depend on who pays for the study.
--
-- THE DECISION TAKEN
-- Adopt the Subpart C protections as an internal standard rather than wait on a
-- federal process. Same substance, no OHRP queue. Specifically:
--   the seven findings at 46.305(a) are made and minuted by the reviewing body
--   a prisoner representative sits on that body when these populations are heard
--   consent states plainly that participation has no bearing on parole,
--     probation, programme standing or release
--   selection is uniform across the programme and no facility staff influence it
--
-- Documented here so the determination is dated and attributable rather than
-- remembered. If federal funding is ever sought, this determination expires and
-- Subpart C attaches as law from that moment.

create table if not exists research.determinations (
  id           bigserial primary key,
  topic        text not null,
  question     text not null,
  answer       text not null,
  consequence  text not null,
  determined_by text,
  determined_at date not null default current_date,
  expires_if   text
);

insert into research.determinations (topic, question, answer, consequence, determined_by, expires_if)
select 'subpart_c_applicability',
       'Does NCF hold a Federalwide Assurance covering this work, and does any federal funding touch this research?',
       'No to both.',
       'Subpart C does not attach as federal law. No OHRP certification and no authorisation letter required before data collection. The protections are adopted as an internal standard instead.',
       'Micah Canfield, Executive Director, National Center for Fathering',
       'Any federal funding of this research, or an FWA electing the Common Rule for all research, reinstates Subpart C as law from that date.'
where not exists (select 1 from research.determinations where topic = 'subpart_c_applicability');

-- ---------------------------------------------------------------------------
-- Update the gates to reflect the determination.
-- ---------------------------------------------------------------------------

-- The prisoner representative is no longer a federal requirement, but the study
-- still hears these populations, so the protection is kept by choice.
update research.governance_gates
   set detail = 'Subpart C does not attach as federal law: no FWA, no federal funding, determined 24 July 2026. The protection is adopted as an internal standard. A prisoner representative sits on the reviewing body when reentry or court-ordered treatment participants are considered, and the seven findings at 46.305(a) are made and minuted. No OHRP certification and no authorisation letter.'
 where gate = 'subpart_c_prisoner_representative';

-- IRB review is now a business and publication decision on timing, not a legal
-- gate on data collection. It is still required before analysis or publication.
update research.governance_gates
   set detail = 'No longer a federal gate on collection: Subpart C does not attach and the study is not federally supported. Still required before ANALYSIS or PUBLICATION. Route options: an independent IRB such as Advarra or WCG, an academic partner IRB, or a documented internal review board. Archiving under consent may proceed; analysis may not.'
 where gate = 'irb_review';

-- Part 2 is unaffected and now the most urgent open gate.
update research.governance_gates
   set detail = '42 CFR Part 2. UNAFFECTED by the Subpart C determination: it attaches because a partner is a federally assisted SUD programme, not because the research is federally funded. Obtain a written answer from each partner before archiving any of their records. Civil and criminal penalties apply.'
 where gate = 'part_2_determination';

select 'subpart c determination recorded' as status,
  (select count(*) from research.determinations
     where topic='subpart_c_applicability')                as determination_on_file,
  (select count(*) from research.governance_gates
     where status='open')                                  as gates_still_open,
  (select count(*) from research.governance_gates
     where status='cleared')                               as gates_cleared;
