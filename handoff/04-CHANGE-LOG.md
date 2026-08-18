# Change log

Branch: `cursor/clean-pilot-handoff-audit-7c78`  
Base: `origin/clean-pilot` @ `b950131`

No changes were made on `main`.

## Deleted

| Path | Why |
|---|---|
| `components/assessments/assigned-list.tsx` | Zero importers |
| `components/father/group-membership.tsx` | Zero importers; org mark is `OrganizationMark` in `role-shell.tsx` |
| `components/father/session-steps.tsx` | Zero importers; chrome is `session-header.tsx` |
| `components/father/session-complete-mark.tsx` | Zero importers |
| `lib/father/evaluate.ts` | Zero importers; scoring is `@/lib/profile/score` |

## Modified

| Path | Why |
|---|---|
| `README.md` | This branch is Next.js clean-pilot, not the static site |
| `PILOT.md` | Live-host table from 18 Aug 2026 probes |
| `.env.example` | Cron schedule matches `vercel.json` |
| `.gitignore` | Ignore local static-builder stub HTML |

## Added

| Path | Why |
|---|---|
| `handoff/00-SUBMISSION-GUIDE.md` | What to send the review team |
| `handoff/01-EXECUTIVE-SUMMARY.md` | State, cleanup, risks |
| `handoff/02-INVENTORY.md` | Routes, folders, schema, env |
| `handoff/03-AUDIT-FINDINGS.md` | Findings and resolutions |
| `handoff/04-CHANGE-LOG.md` | This file |
| `handoff/05-ENGINEERING-NOTES.md` | How to run, gaps |
| `handoff/06-VERIFICATION-CHECKLIST.md` | Confirm the cleanup |

## Not changed (on purpose)

- All `app/` pages and API routes
- Auth / RLS
- Schema / migrations
- Root static HTML and Python builders
