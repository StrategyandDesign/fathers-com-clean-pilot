# READY: director and coach delivery

Production stays paused. This note is what a rehab director or father coach can do on the review branch. It is not a board demo and it does not publish.

## What they can do now

- **Father Home** opens on Finish this week, the session title, one film card with one button, this week's practice, and a solid Film / Checkpoint / Practice tab. Shelves, streak, assessment peers, the desk stamp, and the leader chip are off that page.
- **Leader desk** opens on the claimed roster with this week's film, checkpoint, and practice as Y or N. Stalls name one man. The Friday line is status plus Copy. It does not send. Export downloads complete and claimed (CSV, the reports table, and the PDF).
- **Claim** is a button for a man already on the roster who has no active seat. Joining still does not bill him.
- **Assign a training** stays on Participants. **Assign an assessment** stays on the assessment cohort. Assessments are a self-report, not a diagnosis. No norms on that desk.
- **Film seat:** the checkpoint button stays hidden until the player reports about 95 percent of `duration_seconds`. The keyline is on the page so mute can still read. Certificate issuance still requires film, checkpoint, and lived practice.

Doors on the desk: directors see "Men finish the week. You can claim them. The man never pays." Coaches see "You hold the caseload. We hold the week."

## Research drivers

Quoted provider pains, mapped. No new course length.

1. **Too long for the stay.** Week stays one film, one checkpoint, one lived practice. Early finish of that week is the tab. Certificate still needs all three on every session in the training.
2. **Literacy.** Checkpoint stays short skill choices tied to the film. Home does not make a workbook the path.
3. **Retention / no chase staff.** The desk surfaces stalls and one Friday line to copy. Existing reminder routes stay behind More desk tools. Nothing on the desk auto-sends.
4. **Facilitator burn.** First paint is the caseload, not a catalog.
5. **Funding / staffing.** The buyer line is an organization Leader seat. The export is complete and claimed for a caseworker. No anger-management or batterer framing.

GTM channels stay out of band. The product export is the director report.

## Gaps (do not demo past these)

- Authored checkpoints are still **one** skill question with choices, not three separate questions. Padding questions would invent curriculum.
- Sessions with no `duration_seconds` keep the checkpoint closed. Do not invent a length.
- The live Pilot database currently denies `select` on `participant_claims` (policy exists, table grant does not). The desk still shows week marks and says claim status did not load. Migration `20261001140000_participant_claims_select_grant.sql` grants `select` to `authenticated`. It is not applied to the hosted database from this run.
- Published-film runtime in the database still rejects a new length over 360 seconds. A full 7-minute film cannot be published until that cap moves. Five to six minutes fit.
- Optional practice-replay files are not a separate player control in this app. The lived practice is the Action step.
- Team seats still required: a signed-in Leader in an organization, claimed fathers, and sessions that have a measured film length. Pilot login is not created by this change.
- `fathers-docs/rebuild/GEE-BUILD-BRIEF-CONSOLIDATED-2026-09-30.md` was not in this checkout. The lock in the run instructions was the spec.

## Must not be shown

Trauma treatment, PTSD framing, unearned evidence claims, faith-as-product, CE, CARF, billing a man, or a board walkthrough of an unfinished claim.
