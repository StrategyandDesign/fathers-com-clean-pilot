# READY: director and coach delivery

Production stays paused. This note is what a rehab director or father coach can do on the review branch. It does not publish.

**Board demo: YELLOW** for the remaining first-paint gaps: keyline questions two and three are placeholders, sessions without a measured `duration_seconds` keep the checkpoint closed, and publishing still rejects a new length over 360 seconds. Hosted Pilot already grants `select` on `participant_claims` to `authenticated` on project `koeplcybddrvbliuepsy`. This branch did not run that statement.

## What they can do now

- **Father Home** opens on Finish this week, one cover and one Start, and a solid Film / Checkpoint / Practice tab. The cover is the Ken solo still at `public/brand/covers/ken-teacher-cover-solo-16x9.jpg`. Micah is out of that frame. Title and keyline sit on the still. A soft gradient covers only the bottom of the still, behind that type. The face stays crisp. Home hides a practice line that only repeats the cover keyline or the title. When `duration_seconds` is set, the card reads "1 film · N min · then practice". Feelings Without Weapons is measured at 635 seconds, so the card reads "1 film · 11 min · then practice". When it is unset, that line stays off and the checkpoint stays closed. No catalog wall. Shelves, streak, assessment peers, and the leader chip are off that page. The film seat and the nav read This week.
- **Leader desk** opens on the claimed roster. Phone stacks three equal Y/N chips under each name, labeled Film, Checkpoint, and Practice. Checkpoint and Practice are on the screen. There is no horizontal swipe to find them. Stalls name one man. The Friday line is a check-in, not a quiz: "Checking in on {name} — film, checkpoint, practice. Need anything to finish this week?" It is status plus Copy. It does not send. First paint is the director line only: "Men finish the week. You can claim them. The man never pays." First paint ends at Export complete and claimed. Assign stays on Participants and Assessments. The coach line and the older desk stay collapsed under More desk tools. Roster names use `profiles.full_name`. An id prefix shows only when that field is empty. This change does not invent names.
- **Claim** is a button for a man already on the roster who has no active seat. Joining still does not bill him.
- **Assign a training** stays on Participants. **Assign an assessment** stays on the assessment cohort. Assessments are a self-report, not a diagnosis. No norms on that desk.
- **Film seat:** opens on the same house still, with the title and keyline on the picture and the same bottom type scrim. The seat and the nav read This week. Play stays inside the product. The YouTube title bar and "Watch on YouTube" are not on the seat. The checkpoint button stays hidden until the player reports about 95 percent of `duration_seconds`. Certificate issuance still requires film, checkpoint, and lived practice.
- **Checkpoint:** three skill questions. The first is the stored check-in, or the existing Fundamentals pack when that session has no stored prompt. The next two are placeholders on the session keyline (the session title when the keyline is empty). They are not a new course. Any choice saves, the same way the stored question already saves.

The first-paint line is the director door only: "Men finish the week. You can claim them. The man never pays." The coach line, "You hold the caseload. We hold the week. A human still owns the line.", sits under More desk tools, next to the older copy tools.

## Research drivers

Quoted provider pains, mapped. No new course length.

1. **Too long for the stay.** Week stays one film, one checkpoint, one lived practice. Early finish of that week is the tab. Certificate still needs all three on every session in the training.
2. **Literacy.** The checkpoint is three short skill questions. The stored question stays. The other two use the session keyline until those questions are stored. Home does not make a workbook the path.
3. **Retention / no chase staff.** The desk surfaces stalls and one Friday line to copy. Existing reminder routes stay behind More desk tools. Nothing on the desk auto-sends.
4. **Facilitator burn.** First paint is the caseload, not a catalog.
5. **Funding / staffing.** The buyer line is an organization Leader seat. The export is complete and claimed for a caseworker. No anger-management or batterer framing.

GTM channels stay out of band. The product export is the director report.

## Live Pilot: grant select on participant_claims

Hosted Pilot already has this grant. Claimed should load on `/manager` after a Leader reload. Production stays paused. This branch did not run the statement.

- Project ref: `koeplcybddrvbliuepsy`
- URL: https://koeplcybddrvbliuepsy.supabase.co
- File in this PR: `supabase/migrations/20261001140000_participant_claims_select_grant.sql`

```sql
grant select on table public.participant_claims to authenticated;
```

A fresh local database that applies migrations from `20260817025510` onward includes this file with the rest of the clean-pilot era. Hosted Pilot does not apply repo migrations by itself.

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
- Published-film runtime in the database still rejects a new length over 360 seconds. A full 7-minute film cannot be published until that cap moves. Five to six minutes fit.
- Optional practice-replay files are not a separate player control in this app. The lived practice is the Action step.
- Team seats still required: a signed-in Leader in an organization, claimed fathers, and sessions that have a measured film length. Pilot login is not created by this change.
- `fathers-docs/rebuild/GEE-BUILD-BRIEF-CONSOLIDATED-2026-09-30.md` was not in this checkout. The lock in the run instructions was the spec.

## Must not be shown

Trauma treatment, PTSD framing, unearned evidence claims, faith-as-product, CE, CARF, billing a man, or a board walkthrough of an unfinished claim.
