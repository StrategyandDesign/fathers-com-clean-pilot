# Action-sequence and orphan-link audit (after Shared 1-1.117 + hardening)

Audit of `review` HEAD after hardening `e3fb476`, plus the surgical fixes in this pass. Not a production claim. Not Shared 2. Father film, checkpoint, and practice files were not rewritten.

**Start here for operators:** [PILOT.md](PILOT.md).

## Sequences

| Sequence | Result | Notes |
|---|---|---|
| Father: login → Home → training → film → checkpoint → practice → certificate | Pass | Routes and continue hrefs exist. Loop files untouched. Test Training stays off Home unless the man has progress or a certificate, or `pilot_show_test_content` is on |
| Leader: login → Review cadence → roster → participant → nudge confirm → reports/export → quality improvement packet | Pass | Cadence, roster, `#nudge` confirm, reports, CSV/PDF, and quality improvement packet stay on. Secure-export destination and send stub stay hidden unless `secure_export_enabled` is on. Fidelity exports stay hidden unless `fidelity_board_enabled` is on |
| Reviewer: login → anonymized insights only | Pass / fix | Totals stay anonymized. **Fix:** unused `Test Training` rows are now filtered from the insights filter and distribution when the demo flag is off |
| Admin: login → trust → org identity / single sign-on → Armed Forces checklist → optimization pack | Pass / fix | `/admin/trust` stays reachable. **Fix:** Account trust strip now opens Organizations when no provider is connected, so the identity door is not missing. Armed Forces and optimization checklists stay on Super-admin Account. Rehab still never receives the optimization pack |
| Public: `/verify` (valid/invalid), `/privacy`, `/terms`, `/login?next=` | Pass | Verify form and serial page exist. Privacy and Terms exist. `safeInternalPath` still rejects protocol-relative and encoded `//` / `://` shapes |
| Auth edges: Sign Out above the fold; signed-out desks → login; open-redirect rejection | Pass | Account Sign Out is `/logout`. Middleware sends signed-out `/father`, `/manager`, `/reviewer`, `/admin` to `/login`. Hardening tests cover `safeInternalPath` |

## Orphan links

| Kind | Found | Fix |
|---|---|---|
| Product `href` / nav doors | No missing `app/` page or `route.ts` | Added `tests/internal-links.test.ts` so new dead doors fail CI |
| Markdown `[text](path)` in docs, partner-kit, root | No broken markdown links | None |
| Bare path references | Four stale backtick paths | Pointed at `docs/engineering/NETWORK-REQUIREMENTS.md`, `docs/product/VERIFIED-COMPLETION.md`, `docs/engineering/DOMAIN.md`, `docs/product/EVIDENCE-BAR.md` |

## Poor descriptors

| Finding | Fix |
|---|---|
| Org and identity chrome said only "Identity" | Now "Single sign-on setup" |
| Trust strip contact line implied a different page | Link goes to `#contact-stub` on the counsel drafts section. Label is "Open counsel drafts" |
| Reviewer Insights could list unused Test Training at zeros | Filter via `hidePilotTestTraining` |
| Leader leftover catalog and unused workspace rows could list Test Training | Filter leftover catalog rows and unused workspace trainings. Keep accepted/pending/assigned rows so a Leader can still decline |

## Residuals accepted

- Empty-value `—` placeholders on older admin and result desks stay. New UI copy has no sentence em dashes.
- Super-admin Trainings can still list Test Training. That catalog is the place to unpublish or archive it.
- Live identity-provider login and live quality-improvement push stay off. Copy says not configured / flag off, not a dead send.
- `loadAdminSsoStatuses` only returns organizations with `sso_enabled` on. When every org is off, the trust strip opens `/admin/organizations` instead of a specific identity page.
- Reviewer RPC totals are unchanged. Only titled Test Training rows and the filter list are hidden.
- No Desk tick. Nothing here changes the Leader cold-open chrome.

## Tests

`npx tsx --test tests/*.test.ts`: 539 passed / 0 failed. `npm run lint`: 0 errors (existing unused-var warnings only).
