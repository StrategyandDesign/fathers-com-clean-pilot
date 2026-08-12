# Certified Organization onboarding: the runbook to ten

Purpose: onboard Returning Home, Inc. first, then scale the identical motion to
ten organizations without bespoke work. Every step names its owner and its tool.
Finding, verified against the schema and ROLES.md: no Supabase change is
required to run ten organizations. Roles are org-scoped, the registry and
claims are multi-org by design, and enrollments roll up per cohort by claim_id.

## Preconditions (once, before org one)
1. Resend SMTP configured. The built-in sender caps at 2 emails per hour; a
   cohort intake will exceed that in minutes. Owner: Alon. Blocker.
2. Demo scoring replaced (LAUNCH.md). Blocker for any Efficacy Report.
3. Norms number resolved (POSITIONING.md 8). Until then, no printed or
   reported norms count anywhere. Owner: Micah with Dr. Canfield.
4. Canonical domain set (docs/DOMAIN.md) before any print run.

## Per-organization sequence
1. Certify the organization. Registrar creates the org in admin.html. The
   registry stamps NCF-O-2026-#### and the public verification view goes live,
   status always shown. Owner: NCF Registrar. Time: minutes.
2. Grant org_admin, scoped to the org. Their admin sees seats, invites, and
   participation counts, never individual answers or scores. Owner: Registrar.
3. Credential facilitators (target 2 to 3 per site). Facilitator course, exam,
   then the supervised first cohort completes the credential: NCF-F-2026-####,
   public registry, annual renewal. circle_leader granted per org. Owner: NCF
   curriculum staff. This is the throttle; see capacity note.
4. Hand over the partner kit (partner-kit/README.md): parent insert, caseworker
   one-pager, case plan language card, consent form if the pilot lane applies,
   QSOA draft if the partner is a Part 2 program (counsel finalizes).
5. Open the cohort. Facilitator places claims by sign-in email from the
   Facilitator Desk (lead.html). Free Profile and plan are already open to
   every man; claims unlock the course and the Certificate.
6. Run the course. Men watch on their schedule; facilitator available for
   questions and accountability. Checkpoints, written final the facilitator
   reads at approval. Live cohort attendance is optional if the org offers it.
7. Ceremony and issuance. issue-certificate stamps FC-2026-###### and writes
   the auditable row. Ceremony before program exit is the pilot hypothesis.
8. Efficacy Report per cohort from the rollup. Do not publish numbers until
   preconditions 2 and 3 clear.

## Capacity math for ten organizations
Ten orgs at 3 facilitators is 30 credentials, each requiring a supervised first
cohort. Supervision coverage, not software, is the scaling constraint. Plan
supervisor assignments before opening org six. Certificates issue by admin or
instructor roles; add instructor grants before volume arrives so the Registrar
is not a bottleneck.

## Shipped in v4.6.0
Roster verification: the Facilitator Desk exports one CSV of claimed men,
certificate serials, and status. Requires the 20260810 roster migration
(owner: Alon). Until applied, the Desk shows its standard pending line.
