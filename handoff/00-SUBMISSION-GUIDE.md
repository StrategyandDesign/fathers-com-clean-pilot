# Handoff Submission Guide

**Audience:** you (the submitter)  
**Date:** 18 August 2026  
**Rule:** send only the clean-pilot line. Do not send `main`. Do not send PRs that target `main`.

This guide is written from a completed audit of `origin/clean-pilot` plus the cleanup on `cursor/clean-pilot-handoff-audit-7c78`. Probe evidence is from the same day.

---

## 1. GitHub submission

### What to point the team at

| Point them here | Do not point them here |
|---|---|
| Pull request **against `clean-pilot`**: the audit/cleanup PR from branch `cursor/clean-pilot-handoff-audit-7c78` | `main` |
| If that PR is not up yet: branch `cursor/clean-pilot-handoff-audit-7c78` | Any `cursor/*-7c78` PR that lists **base = `main`** (PRs 103–108) |
| Base of the line: `b950131` on `origin/clean-pilot` | Draft PR **#92** (`cursor/cloud-agent-1786970093610-bdqgf` → `clean-pilot`) — 532 files, `mergeable_state: dirty` |
| | The `0b8c` stack (PRs 93–99) — those target `main` or each other, not `clean-pilot` |

**Use one PR targeting `clean-pilot`.** Do not open a PR to `main`. Do not ask them to review a pile of stacked PRs.

Recommended PR title:

```
clean-pilot handoff: audit cleanup (do not merge to main)
```

Recommended PR description (paste as the body):

```markdown
## Scope

Next.js clean-pilot app only. Base is `clean-pilot`, not `main`.

This PR deletes unused Next.js modules, corrects the branch README / runbook
so reviewers are not sent to the wrong host, and adds the `handoff/` package.

## This is not production

- Do **not** merge this to `main`.
- Do **not** treat https://fathers-com-platform.vercel.app as this review.
- That host currently serves Next.js from **`main`**. It is a separate line.

## What to read first

1. `handoff/00-SUBMISSION-GUIDE.md`
2. `handoff/01-EXECUTIVE-SUMMARY.md`
3. `handoff/02-INVENTORY.md`
4. `handoff/03-AUDIT-FINDINGS.md`

## Cleaned in this PR

- Removed unused Next.js modules (no remaining importers).
- README and PILOT.md now state the live-host facts from 18 Aug 2026 probes.
- Cron comment in `.env.example` matches `vercel.json`.
- Local static-builder HTML stubs are gitignored.

## Still incomplete / out of scope

- Root `*.html`, `assets/`, `build_*.py` remain in the tree (leftover static
  source; excluded from Next deploy by `.vercelignore`). Left in place so a
  future merge to `main` cannot wipe that history by accident.
- Email, web-push, Sentry, YouTube duration backfill, and Vercel cron are
  optional and degrade when unset.
- Pilot DB has `platform_assessments*` tables that this branch does not query.
- Draft PR #92 is not part of this submission.
```

Label the PR (GitHub labels or the first line of the body):

- `do-not-merge-to-main`
- `clean-pilot-only`
- `not-production`

### Files to call out

**Cleaned (this PR)**

- Deleted: `components/assessments/assigned-list.tsx`, `components/father/group-membership.tsx`, `components/father/session-steps.tsx`, `components/father/session-complete-mark.tsx`, `lib/father/evaluate.ts`
- Updated: `README.md`, `PILOT.md`, `.env.example`, `.gitignore`
- Added: `handoff/*`

**Present but not the Next.js app** (tell reviewers to ignore for behavior review)

- Root `*.html`, `assets/`, `content/`, `emails/`, `partner-kit/`, `build_*.py`, `tools/`, `docs/` (except this `handoff/` set and `PILOT.md`)

---

## 2. Supabase submission

### Correct project

| Field | Value |
|---|---|
| Name | **Pilot** |
| Project ref | `koeplcybddrvbliuepsy` |
| Dashboard | https://supabase.com/dashboard/project/koeplcybddrvbliuepsy |
| API host | https://koeplcybddrvbliuepsy.supabase.co |
| Region | us-east-2 |
| Status (18 Aug 2026) | `ACTIVE_HEALTHY` |

### Wrong project (do not share as the review DB)

| Name | Ref | Status |
|---|---|---|
| fathers-com-platform | `kemqpiboqeqhbuuldmls` | **INACTIVE** |
| ReqPub Project | `mqppdbiimvdgjsjirduw` | Unrelated |

Say this in the email: “The Next.js clean-pilot app uses only the Supabase project named **Pilot** (`koeplcybddrvbliuepsy`). The project named `fathers-com-platform` is inactive and is not this review.”

### How to grant access

1. Supabase Dashboard → organization that owns **Pilot**.
2. **Organization → Team** → invite each engineer by email as `Developer` (or `Read-only` if they only need to inspect).
3. Also share the project ref and dashboard URL above.
4. Do **not** send the service-role key in email. If they need to run cron locally, they create their own secrets in a personal `.env.local`.
5. Pilot publishable/anon keys are already in the repo as a fallback (`lib/supabase/env.ts`). Treat them as public, same class as a shipped anon key. Rotate later if the team asks.

Pilot test seats (already documented in `docs/CLEAN-PILOT-AUDITOR-LINK-REPORT.md`; weak by design):

| Email | Role |
|---|---|
| `father1@il` | father |
| `manager@il` | manager (shown as Leader) |
| `reviewer@il` | reviewer |
| `admin@fathers` | admin |

Tell the team these are **pilot-only** and must not be reused on any production project.

### Schema in scope

Public tables the Next.js app actually reads/writes (RLS on):

`profiles`, `groups`, `group_members`, `trainings`, `sessions`, `session_progress`, `father_profiles`, `father_profile_drafts`, `training_assignments`, `certificates`, `notification_preferences`, `reminder_preferences`, `custom_assessments`, `custom_assessment_questions`, `custom_assessment_assignments`, `custom_assessment_answers`, `platform_assessment_releases`, `organization_assessment_reviews`, `organization_assessment_availability`, `organization_training_reviews`, `manager_notifications`, `manager_nudges`, `manager_participant_notes`, `organization_photos`, `organization_cohort_notes`, `organization_cohort_note_dismissals`, `support_reports`, `training_requests`, `training_sources`, `training_intakes`, `push_subscriptions`, `notification_outbox`, `notification_deliveries`, `action_commitments`, `father_streaks`, `streak_week_ledger`, `father_streak_notices`

Storage buckets: `certificates`, `org-photos`, `support-screenshots`, `avatars` (read-only from the app).

**On Pilot today, not queried by this branch:** `platform_assessments`, `platform_assessment_domains`, `platform_assessment_items`, `platform_assessment_bands`, `platform_assessment_attempts`, `platform_assessment_responses` (applied as `20260818154055_platform_assessment_sandbox`). `internal.training_series_split_backup` is a migration artifact; RLS is off; `internal` is not the app’s API schema.

Edge functions on Pilot: **none deployed**. Repo `supabase/functions/*` are leftover from the static site and are out of scope.

---

## 3. Vercel submission

### There is no current “definitive public preview” of this SHA

Probed 18 August 2026:

| URL | What it is | Share as the review app? |
|---|---|---|
| https://fathers-com-pilot.vercel.app | Next.js, **old** build. Title “Fathers.com Pilot”. Login copy: “Official Fathers.com training pilot.” | **No** |
| https://fathers-com-platform.vercel.app | Next.js from **`main`**. Login copy: “The Fathers Performance Platform”. `/admin.html` → 404. | **No** |

Both hosts 307 `/` and `/father` to `/login` when signed out. Both are Next.js. Neither is a preview of `cursor/clean-pilot-handoff-audit-7c78`.

### What to share instead

1. After the cleanup PR exists, share **that PR’s Vercel preview URL** (the one Vercel comments on the PR). That is the only public URL that matches the submitted SHA.
2. Until that preview exists, tell the team to run `npm run dev` from the PR branch.
3. Write this sentence in the email: “Do not use fathers-com-platform.vercel.app or fathers-com-pilot.vercel.app to judge this handoff. The first is `main`. The second is a stale Pilot deploy.”

### Env / project settings to mention

Required for a faithful preview:

- `NEXT_PUBLIC_SUPABASE_URL` = `https://koeplcybddrvbliuepsy.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or anon key) for **Pilot**
- `NEXT_PUBLIC_SITE_URL` = the preview URL

Optional (app degrades without them): `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `RESEND_API_KEY`, `YOUTUBE_API_KEY`, VAPID keys, Sentry DSN.

If the preview project has no Supabase env, this branch falls back to the hardcoded Pilot keys in `lib/supabase/env.ts`. That is intentional for this line. It is **not** a production pattern.

---

## 4. Supporting documents (order)

Attach or link these from the PR, in this order:

1. `handoff/00-SUBMISSION-GUIDE.md` — this file  
2. `handoff/01-EXECUTIVE-SUMMARY.md`  
3. `handoff/02-INVENTORY.md`  
4. `handoff/03-AUDIT-FINDINGS.md`  
5. `handoff/04-CHANGE-LOG.md`  
6. `handoff/05-ENGINEERING-NOTES.md`  
7. `handoff/06-VERIFICATION-CHECKLIST.md`  
8. `PILOT.md` — how to create seats and run locally  

Do not send `README.md` from `main`. Do not send `ARCHITECTURE.md` as the system description of this app (it still describes the static site).

---

## 5. Recommended message to the technical team

```text
Subject: Fathers.com clean-pilot handoff — Next.js review only (not production)

We are submitting the clean-pilot Next.js application for review. This is not
a production release and it is not the old static Fathers.com site.

Please treat these as two different things:

1) Production line — git branch `main`.
   The public host https://fathers-com-platform.vercel.app currently serves
   Next.js from `main`. It is out of scope. Do not merge this work into main
   as part of this review. Do not use that URL to evaluate this handoff.

2) Review line — git branch `clean-pilot` and the PR that targets it
   (cursor/clean-pilot-handoff-audit-7c78). That is the only code we are
   submitting. Data is the Supabase project named Pilot
   (ref koeplcybddrvbliuepsy). The Supabase project named
   fathers-com-platform is inactive and is not this review.

What is being submitted
- The Next.js 15 app in app/, with the audit cleanup in the PR
- The handoff/ documents on that branch
- Access to the Pilot Supabase project (invite to follow)

What is not being submitted
- main, and any open PR whose base is main
- Draft PR #92 (dirty, not part of this package)
- Email, push, Sentry, and cron (optional; degrade when unset)
- A claim that either public Vercel URL is this SHA

Preferred review order
1) handoff/00-SUBMISSION-GUIDE.md
2) handoff/01-EXECUTIVE-SUMMARY.md
3) The PR diff
4) handoff/02-INVENTORY.md and handoff/03-AUDIT-FINDINGS.md
5) Run locally from the PR branch (PILOT.md) or use the PR’s Vercel preview
   once it exists — not fathers-com-pilot.vercel.app (stale) and not
   fathers-com-platform.vercel.app (main)

This app is a signed-in pilot. It is not live on fathers.com.
```

---

## 6. Final checklist before you hit send

- [ ] The GitHub link is a PR (or branch) whose **base is `clean-pilot`**, not `main`.
- [ ] You are not including PRs 103–108, 93–99, or 92.
- [ ] The Vercel link, if any, is the **PR preview**, not `fathers-com-platform.vercel.app` and not `fathers-com-pilot.vercel.app`.
- [ ] The Supabase link is project **Pilot** / `koeplcybddrvbliuepsy`, not `kemqpiboqeqhbuuldmls`.
- [ ] The message says this is **not production** and **must not be merged to main**.
- [ ] `handoff/` is on the same branch you are sending.
- [ ] You have not attached service-role keys.
