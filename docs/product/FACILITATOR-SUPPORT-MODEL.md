# Facilitator support model

## Default: facilitator-supported, self-paced film

Courses are film-first and self-paced. A man watches on his schedule, passes the checkpoint, completes that week's lived practice, and earns a verifiable Certificate of Completion when he finishes the work. Completion is film plus checkpoint plus practice, not seat time. Courses stay free to the man.

A Certified Facilitator (or Certified Organization) claims his seat. That claim gates enrollment and certificate accountability. The facilitator is available for questions, further insight, and accountability. The facilitator is not required to sit in session, co-watch on Zoom, or run a live class for the man to complete.

## Optional: live cohort mode

Some organizations may later offer live cohort sessions as an optional layer. Cohort remains a program grouping and reporting unit either way. Live attendance is never required for default completion. Do not write copy that implies co-watch or live class is part of earning the certificate unless an org is explicitly in optional live cohort mode.

## What permissions stay

- Claim / seat gate (facilitator or org claims the man)
- Roster visibility for claimed men
- Training progress visibility: film, checkpoint, and practice flags only. No checkpoint answers, scores, or practice log text.
- Custom assessment answers (`leader_assessment_answers`) default off. Leaders see started, finished, or stalled. They do not see question text or written answers unless Super-admin turns the org flag on, or `LEADER_ASSESSMENT_ANSWERS` is set to 1 / true / on / yes. Reviewers stay on cohort totals either way. Rehab recommendations keep this off.
- Leader roster practice light (`roster_practice_light`) defaults on once skill-use check-ins exist. Flags: completed, not yet, dismissed, stale. No answer text. Set `ROSTER_PRACTICE_LIGHT` to 0 / false / off to hide it.
- Consider next (`desk_consider_next_v1`) stays off until ranking is trustworthy. When on, `/manager` shows one suggested action per stuck man (quiet, practice skipped, certificate ready, assessment stalled, or an existing open item). Nothing sends or issues until the Leader confirms. Set `DESK_CONSIDER_NEXT_V1` to 1 / true / on / yes to turn it on. Leave unset to keep the prior dashboard.
- Fidelity board (`fidelity_board_enabled`) stays off. When on, `/manager/fidelity` is a living supervision checklist from the partner-kit list, and `/manager/team/facilitators` records Certified Facilitator attestation. Set `FIDELITY_BOARD_ENABLED` to 1 / true / on / yes to show it. Leave unset to keep the prior desk. No new ribbon item.
- Single sign-on (`sso_enabled`) stays off per organization. Super-admin turns it on and links an OpenID Connect or SAML 2.0 identity provider. Email and password stay for non-SSO orgs, Super-admin break-glass, and fathers. No new ribbon item.
- Secure export (`secure_export_enabled`) stays off. Reports keep CSV and PDF. Leaders can download a quality improvement packet on `/manager/reports`. When on, destination metadata and a confirm-first send stub appear. Set `SECURE_EXPORT_ENABLED` to 1 / true / on / yes to show them. This desk does not send files to an outside host. No new ribbon item.
- Armed Forces pack (`vertical_pack_armed_forces`) stays off. Super-admin can open `/admin/verticals/armed-forces` either way. When on, Reports shows an event closeout preset (attendance and completion aggregates only). Set `VERTICAL_PACK_ARMED_FORCES` to 1 / true / on / yes to show it. This does not flip `SHOW_MILITARY`. No new ribbon item.
- Optimization pack (`vertical_pack_optimization`) stays off. Super-admin can open `/admin/verticals/optimization` either way. When on, a Performance Optimization Group gets the confidentiality copy skin, invitation-only join framing, and a practice-flag commitment board. Rehab organizations never receive this pack. Set `VERTICAL_PACK_OPTIMIZATION` to 1 / true / on / yes to turn it on. No new ribbon item. No public go-to-market until the forum-moderator review checklist is signed off.
- Review cadence on `/manager` keeps open items, pending actions, and certificates ready glanceable. The Leader roster shows film, checkpoint, and practice lights plus one next action. Nothing sends or issues until the Leader confirms.
- Quiet alerts (for example, inactivity) so a named man can be reached
- Announcements to the claimed group
- Review of written finals and certificate approval / attestation
- Org certification sponsorship (funds the organization and facilitator layer, not a seat gift to one man)

## What is not required

- Live attendance
- Facilitator co-watch of every film
- Synchronous Zoom sessions for completion
- Treating "cohort" as a mandatory live class rather than a program grouping

## Copy vocabulary

Prefer **Facilitator-supported** over **Facilitator-led**. Prefer **who claimed your seat** or **your Certified Facilitator** over **who led your cohort**. Prefer **Watch on your schedule** / **Self-paced film** over language that requires sitting in a live session.

## Verified-only completion
Film preview and the free Profile/plan do not issue proof. Claim is required before enrollment counts toward a Certificate of Completion and a public serial. Preview sittings cannot be converted into serials.
