# Shared 1-1.117 seat-walk (Issues 1–17)

Audit only. No product changes in this note. Audited `review` HEAD `5bc55d51a8dee292e2d22a773b29de7217da439c` on 23 August 2026.

**NOT claiming Vercel production live.** This is the local `review` checkout plus Pilot seats. Public Vercel hosts stay out of scope.

## Shared badge + HEAD

| Item | Value |
|---|---|
| Badge | **Shared 1-1.117** (`shared-mark.json`, `SHARED.md`, live `VersionStamp` on `/login`) |
| HEAD | `5bc55d5` — Shared 1-1.117: Issue 11 - Bonded-group confidentiality pack |
| Tip after | Issue 11 merge. Issues 1–17 commits are on this line. |

## Tests

`npx tsx --test tests/*.test.ts`

- **526 passed / 0 failed** (178 suites)
- No skipped or cancelled tests

## Per Issue 1–17

| Issue | Surface | Status | Flag default |
|---|---|---|---|
| 1 | Counsel pack on Account (`/manager/account/counsel`, drafts labeled draft) | Present | `counsel_pack_required` **off** (org flag) |
| 2 | Leader custom-assessment answers flags-only | Present | `leader_assessment_answers` **off** |
| 3 | Org SSO + staff revoke | Present | `sso_enabled` **off** (org flag). Login has no org-continue form |
| 4 | Public `/verify` + completion-only disclaimer | Present | `certificates_require_claim` **off** |
| 5 | QI packet on Reports; destination/send stub gated | Present | `secure_export_enabled` **off** |
| 6 | Privacy / Terms copy matches flags-only + Super-admin unlock | Present | Same as Issue 2 |
| 7 | Admin Armed Forces checklist; `SHOW_MILITARY` stays false | Present | `vertical_pack_armed_forces` **off**; `SHOW_MILITARY = false` |
| 8 | Fidelity board + facilitator registry | Present, hidden | `fidelity_board_enabled` **off** |
| 9 | Overclaim lexicon (Title IV-E, MFLC, BSRT, SOC 2, HITRUST) | Present | Governed paths use honest “not certified / not approved” copy |
| 10 | `/admin/trust` questionnaire pack | Present | Honest not-SOC-2 / not-HITRUST status |
| 11 | Bonded-group / optimization pack | Present, hidden on Rehab | `vertical_pack_optimization` **off**; Rehab never receives pack |
| 12 | Desk Review cadence on `/manager` | Present (always on) | Not a flag. Consider next is separate (Issue 14) |
| 13 | Leader roster practice light (film / checkpoint / practice) | Present | `roster_practice_light` **on** |
| 14 | Consider next ranked card | Present, hidden | `desk_consider_next_v1` **off** |
| 15 | Org type taxonomy (Rehab / Armed Forces Unit / Performance Optimization Group) | Present | Types recommend flags only. They do not flip env flags |
| 16 | Account trust strip (SSO off + draft papers) | Present | Same SSO default as Issue 3 |
| 17 | `/logout`, Account Sign Out above the fold, test-content hygiene | Present | `pilot_show_test_content` **off** |

## Seat-walk

**Pass** on local Pilot seats (`12345`). App served at `http://127.0.0.1:3000`.

| Seat | Result |
|---|---|
| Public `/login` | Badge Shared 1-1.117. Email + password only. No SSO continue form |
| Public `/verify` | Check-a-certificate form + completion-only / not-court / not-clinical disclaimer |
| Public `/privacy` | Sharing states completion flags, Super-admin unlock for written answers, Reviewers see cohort totals |
| `father@nwa` | Home trainings shelf intact. No optimization / commitment-board chrome. Account Sign Out above the fold. No Test Training on Home |
| `manager@nwa` | Review cadence (open items, pending actions, certificates ready). No Consider next. Roster lights: Pending Film, Pending Check-in, Practice completed. Trust strip: SSO not connected; drafts not executed |
| `reviewer@nwa` | Anonymized totals. No names or emails. Copy: “All data is anonymized and aggregated.” |
| `admin@fathers` | `/admin/trust` honest not-certified status. Armed Forces page keeps `SHOW_MILITARY` false. Optimization page keeps pack off for Rehab |

Father film → checkpoint → practice loop files under `app/(father)/father/sessions` and `components/father/session-*` / `action-*` were **not rewritten** in Issues 1–17. Issue 11 only gated a commitment board on father Home when the optimization pack applies (off for Returning Home NWA).

New UI copy uses no em dashes. Empty-value “—” placeholders in older admin/results desks are unchanged. No false SOC 2, MFLC, Title IV-E, or Building Strong and Ready Teams approval claims on live paths.

## Residuals (not a fix PR)

These are not merge blockers for the Shared pack:

1. Local `next dev` still paints a red **1 Issue** chip in the corner even though `devIndicators: false` is set (Issue 17 intent). Production builds do not use that chrome.
2. Reviewer Insights still lists catalog row **Test Training 1** at zeros. Father Home and Leader desks hide it. Reviewer data does not call `hidePilotTestTraining`.

## Blockers that need a fix PR

**None.**

## NOT claiming Vercel production live

This audit is `review` HEAD on a local Pilot fallback. It is not a claim that `fathers-com-platform.vercel.app` or `fathers-com-pilot.vercel.app` serve Shared 1-1.117.
