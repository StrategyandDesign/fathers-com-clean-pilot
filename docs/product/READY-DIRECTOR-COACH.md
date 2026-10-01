# READY: director and coach delivery

Production stays paused. This note is what a rehab director or father coach can do on the review branch. It is not a board demo and it does not publish.

## What they can do now

- **Father Home** opens on Finish this week, the session title, one film card with one button, this week's practice, and a solid Film / Checkpoint / Practice tab. Shelves, streak, assessment peers, the desk stamp, and the leader chip are off that page.
- **Leader desk** opens on the claimed roster with this week's film, checkpoint, and practice as Y or N. Stalls name one man. The Friday line is status plus Copy. It does not send. Export downloads complete and claimed (CSV, the reports table, and the PDF).
- **Claim** is a button for a man already on the roster who has no active seat. Joining still does not bill him.
- **Assign a training** stays on Participants. **Assign an assessment** stays on the assessment cohort. Assessments are a self-report, not a diagnosis. No norms on that desk.
- **Film seat:** the checkpoint button stays hidden until the player reports about 95 percent of `duration_seconds`. The keyline is on the page so mute can still read. Certificate issuance still requires film, checkpoint, and lived practice.
- **Checkpoint:** three skill questions. The first is the stored check-in, or the existing Fundamentals pack when that session has no stored prompt. The next two are placeholders on the session keyline (the session title when the keyline is empty). They are not a new course. Any choice saves, the same way the stored question already saves.

Doors on the desk: directors see "Men finish the week. You can claim them. The man never pays." Coaches see "You hold the caseload. We hold the week."

## Research drivers

Quoted provider pains, mapped. No new course length.

1. **Too long for the stay.** Week stays one film, one checkpoint, one lived practice. Early finish of that week is the tab. Certificate still needs all three on every session in the training.
2. **Literacy.** The checkpoint is three short skill questions. The stored question stays. The other two use the session keyline until those questions are stored. Home does not make a workbook the path.
3. **Retention / no chase staff.** The desk surfaces stalls and one Friday line to copy. Existing reminder routes stay behind More desk tools. Nothing on the desk auto-sends.
4. **Facilitator burn.** First paint is the caseload, not a catalog.
5. **Funding / staffing.** The buyer line is an organization Leader seat. The export is complete and claimed for a caseworker. No anger-management or batterer framing.

GTM channels stay out of band. The product export is the director report.

## Live Pilot: grant select on participant_claims

Micah, the Leader desk cannot read claims on the hosted Pilot database until this grant runs. Production stays paused. Do not deploy. Apply the grant in the Pilot SQL editor when Claimed should load.

- Project ref: `koeplcybddrvbliuepsy`
- URL: https://koeplcybddrvbliuepsy.supabase.co
- Symptom: `/manager` says "Claim status did not load." Week film / checkpoint / practice still show Y or N. The server log is `permission denied for table participant_claims`.
- Cause: a row policy exists. The role `authenticated` does not have table `SELECT`.

File in this PR: `supabase/migrations/20261001140000_participant_claims_select_grant.sql`

```sql
grant select on table public.participant_claims to authenticated;
```

Path:

1. Open the Supabase dashboard for project `koeplcybddrvbliuepsy`.
2. Open the SQL editor.
3. Paste the statement above. Run it once.
4. Reload `/manager` as a Leader. Claimed should read Yes or No, and the "did not load" line should leave.

This run did not execute that statement on the hosted database. A fresh local database that applies migrations from `20260817025510` onward includes this file with the rest of the clean-pilot era. Hosted Pilot does not apply repo migrations by itself.

## Measured film length

The checkpoint button stays hidden until watched seconds reach about 95 percent of `sessions.duration_seconds`. Null or zero keeps the checkpoint closed. Do not invent a length in the player.

Set it on the session:

1. Sign in as super-admin and open `/admin/trainings/<training id>`.
2. Edit the session. The Runtime field is `duration_seconds`.
3. Enter whole seconds (`330`) or `m:ss` (`5:30`). Save.
4. If a YouTube server key is configured, that same field can fill from YouTube. Still confirm the number matches the file.

Pilot SQL, after the file has been measured:

```sql
update public.sessions
set duration_seconds = 330
where id = '<session uuid>';
```

`330` is an example of a measured 5:30 film. Replace it with the file's real length. Unlock math on a 360-second film: 342 watched seconds opens the checkpoint, 341 stays closed.

Publishing still rejects a new length over 360 seconds (6:00). Five to six minutes can be stored. A full 7-minute film cannot be published until that cap moves.

## Gaps (do not demo past these)

- Questions two and three are keyline placeholders until those questions are stored on the session. They do not add teaching. Question one stays the stored check-in, or the existing Fundamentals pack.
- Sessions with no `duration_seconds` keep the checkpoint closed. See Measured film length above.
- Hosted Pilot still denies `select` on `participant_claims` until the grant above is run in that project's SQL editor.
- Published-film runtime in the database still rejects a new length over 360 seconds. A full 7-minute film cannot be published until that cap moves. Five to six minutes fit.
- Optional practice-replay files are not a separate player control in this app. The lived practice is the Action step.
- Team seats still required: a signed-in Leader in an organization, claimed fathers, and sessions that have a measured film length. Pilot login is not created by this change.
- `fathers-docs/rebuild/GEE-BUILD-BRIEF-CONSOLIDATED-2026-09-30.md` was not in this checkout. The lock in the run instructions was the spec.

## Must not be shown

Trauma treatment, PTSD framing, unearned evidence claims, faith-as-product, CE, CARF, billing a man, or a board walkthrough of an unfinished claim.
