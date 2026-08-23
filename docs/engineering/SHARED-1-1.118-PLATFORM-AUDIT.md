# Platform audit after the note-sent step

Audit only. No product changes in this note. Walked on 23 August 2026.

**NOT claiming Vercel production live.** This is a local checkout plus Pilot seats. Public Vercel hosts stay out of scope.

## What was walked

| Item | Value |
|---|---|
| Checkout | `cursor/note-sent-next-action-5318` @ `5512d75` |
| Badge | **Shared 1-1.118** on `/login` |
| Based on | `review` `1ee3853` (Shared 1-1.117 seat-walk) plus the Note sent card |
| App | `http://127.0.0.1:3000` |
| Remote | `StrategyandDesign/fathers-com-clean-pilot` |

Grokbot was pinged on [PR #23](https://github.com/StrategyandDesign/fathers-com-clean-pilot/pull/23). A parallel grok hardening pass later landed on `review` as `e3fb476` (`docs/engineering/HARDENING-1-1.117.md`). That commit was not in this walk.

## Tests

```bash
npx tsx --test tests/*.test.ts
npx tsc --noEmit
npm run lint
npx tsx tools/scan-overclaim.ts
```

| Check | Result |
|---|---|
| Unit tests | **529 passed / 0 failed** (179 suites). Three more than the 1.117 walk (`nudge-composer`) |
| `tsc --noEmit` | Clean |
| `npm run lint` | 0 errors, 6 existing unused-var warnings |
| Overclaim scan | **PASS** |

## Signed-out HTTP

| Request | Result |
|---|---|
| `GET /` | 307 `/login` |
| `GET /father` | 307 `/login?next=/father` |
| `GET /manager` | 307 `/login?next=/manager` |
| `GET /admin` | 307 `/login?next=/admin` |
| `GET /login` | 200 |
| `GET /privacy` | 200 |
| `GET /verify` | 200 |
| `GET /this-page-does-not-exist` | 404 |

## Issues 1–17

Same flag defaults as the 1.117 walk. Surfaces still present. `certificates_require_claim` stays off. `SHOW_MILITARY` stays false.

## Seat-walk

**Pass** on local Pilot seats (`12345`).

| Seat | Result |
|---|---|
| Public `/login` | Badge Shared 1-1.118. Email + password only. No SSO continue form |
| Public `/verify` | Check-a-certificate form. Completion-only / not-court / not-clinical disclaimer |
| Public `/privacy` | Sharing states completion flags, Super-admin unlock for written answers, Reviewers see cohort totals |
| `father@nwa` | Home trainings shelf intact. No optimization chrome. No Test Training. Account Sign Out above the fold |
| `manager@nwa` | Review cadence: Open items 1, Pending actions 1, Certificates ready 0. No Consider next. Roster lights: Pending Film, Pending Check-in, Practice completed. Trust strip: SSO not connected; drafts stay drafts |
| Participant note card | Heading **Note sent**. Next send opens Aug 30, 2026. **See current session** present. Send form hidden |
| `/manager/reviews` | Lands on `/manager/trainings` |
| `reviewer@nwa` | “Anonymized cohort view. No names or emails.” “All data is anonymized and aggregated.” Totals only |
| `admin@fathers` | `/admin/trust` honest not-SOC-2 / not-HITRUST status. Armed Forces page keeps the military surface off. Optimization page keeps the pack off for Rehab |

Father film, checkpoint, and practice files were not rewritten on this branch.

## Open drafts (not in this walk)

| PR | What |
|---|---|
| [#20](https://github.com/StrategyandDesign/fathers-com-clean-pilot/pull/20) | Five leftover CI hygiene fixes |
| [#21](https://github.com/StrategyandDesign/fathers-com-clean-pilot/pull/21) | Open items full width, invite code below |
| [#23](https://github.com/StrategyandDesign/fathers-com-clean-pilot/pull/23) | Note sent card (this walk includes that commit) |

## Residuals (not a fix PR)

Same residuals as the 1.117 walk, still not merge blockers:

1. Local `next dev` still paints a red **1 Issue** / **2 Issues** chip even though `devIndicators: false` is set. Production builds do not use that chrome.
2. Reviewer Insights still lists catalog row **Test Training 1** at zeros. Father Home and Leader desks hide it.

## Blockers that need a fix PR

**None.**

## NOT claiming Vercel production live

This audit is a local Pilot fallback. It is not a claim that `fathers-com-platform.vercel.app` or `fathers-com-pilot.vercel.app` serve Shared 1-1.118.
