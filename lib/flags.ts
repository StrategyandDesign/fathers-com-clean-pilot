/**
 * Named product flags. Opt-in flags stay off so a flag-off pilot remains usable.
 * Rollback for Issue 4: leave CERTIFICATES_REQUIRE_CLAIM unset or set it
 * to 0 / false / off. Issue 17 test-content seats stay hidden unless
 * PILOT_SHOW_TEST_CONTENT is explicitly on.
 *
 * roster_practice_light defaults ON. Skill-use check-ins are already
 * persisted on session_progress. This flag is facilitator visibility of
 * that existing father tap (completed / not yet / dismissed / stale).
 * Set ROSTER_PRACTICE_LIGHT to 0 / false / off to hide the quiet light.
 *
 * Organization type (rehab / armed_forces_unit /
 * performance_optimization_group / other) recommends default flags only
 * via recommendedFlagsForType() in lib/organization-type.ts. It does not
 * fork Desk routes or flip these env flags.
 *
 * desk_consider_next_v1 defaults OFF until ranking is trustworthy.
 * Set DESK_CONSIDER_NEXT_V1 to 1 / true / on / yes to show Consider next
 * on /manager. Leave unset to keep the prior dashboard.
 *
 * counsel_pack_required is an organization flag on group_counsel_pack,
 * default OFF. It is not an env flag. Super-admin turns it on per
 * organization. When ON, Account counsel shows a checklist until
 * Super-admin records an attached-pack mark (metadata only).
 *
 * leader_assessment_answers defaults OFF. Leaders see custom assessment
 * completion flags only (started, finished, stalled). Question text and
 * answer payloads stay off the Leader desk unless the platform env
 * LEADER_ASSESSMENT_ANSWERS is on or Super-admin turns the org flag on.
 * Rehab recommendations keep this off.
 *
 * fidelity_board_enabled defaults OFF. Leave unset to keep the prior
 * desk. Set FIDELITY_BOARD_ENABLED to 1 / true / on / yes to show the
 * living fidelity checklist and Certified Facilitator registry under
 * Account and Desk. No new ribbon item.
 *
 * sso_enabled is an organization flag on group_sso, default OFF. It is
 * not an env flag. Super-admin turns it on per organization and links
 * an OpenID Connect or SAML 2.0 identity provider. Email and password
 * stay for non-SSO orgs, Super-admin break-glass, and fathers.
 *
 * secure_export_enabled defaults OFF. Leave unset so prior reports stay
 * as they are. Set SECURE_EXPORT_ENABLED to 1 / true / on / yes to show
 * destination metadata and the confirm-first send stub. Quality
 * improvement packet download stays on Reports either way. No live
 * network push to a customer URL, S3 bucket, webhook, or EHR.
 *
 * vertical_pack_armed_forces defaults OFF. Leave unset so father, Leader,
 * and public surfaces stay as they are. Super-admin can still open the
 * materials checklist at /admin/verticals/armed-forces. Set
 * VERTICAL_PACK_ARMED_FORCES to 1 / true / on / yes to show the event
 * closeout preset on Reports. This flag does not flip SHOW_MILITARY.
 * Organization type armed_forces_unit recommends the pack only.
 *
 * vertical_pack_optimization defaults OFF. Leave unset so the rehab
 * pilot stays as it is. Super-admin can still open the forum-moderator
 * checklist at /admin/verticals/optimization. Set
 * VERTICAL_PACK_OPTIMIZATION to 1 / true / on / yes to apply the
 * bonded-group copy skin, confidentiality defaults, and commitment
 * board on Performance Optimization Group desks. Rehab organizations never receive this pack.
 * Organization type
 * performance_optimization_group recommends the pack only.
 */
export const CERTIFICATES_REQUIRE_CLAIM = "certificates_require_claim";
export const PILOT_SHOW_TEST_CONTENT = "pilot_show_test_content";
export const ROSTER_PRACTICE_LIGHT = "roster_practice_light";
export const DESK_CONSIDER_NEXT_V1 = "desk_consider_next_v1";
export const LEADER_ASSESSMENT_ANSWERS = "leader_assessment_answers";
export const FIDELITY_BOARD_ENABLED = "fidelity_board_enabled";
export const SSO_ENABLED = "sso_enabled";
export const SECURE_EXPORT_ENABLED = "secure_export_enabled";
export const VERTICAL_PACK_ARMED_FORCES = "vertical_pack_armed_forces";
export const VERTICAL_PACK_OPTIMIZATION = "vertical_pack_optimization";
/** Archive / static-site veteran surface. Stays false. This pack does not flip it. */
export const SHOW_MILITARY = false;

function envFlag(name: string) {
  const raw = process.env[name]?.trim().toLowerCase() ?? "";
  return raw === "1" || raw === "true" || raw === "on" || raw === "yes";
}

function envFlagOff(name: string) {
  const raw = process.env[name]?.trim().toLowerCase() ?? "";
  return raw === "0" || raw === "false" || raw === "off" || raw === "no";
}

export function certificatesRequireClaim() {
  return envFlag("CERTIFICATES_REQUIRE_CLAIM");
}

export function pilotShowTestContent() {
  return envFlag("PILOT_SHOW_TEST_CONTENT");
}

export function rosterPracticeLight() {
  return !envFlagOff("ROSTER_PRACTICE_LIGHT");
}

export function deskConsiderNextV1() {
  return envFlag("DESK_CONSIDER_NEXT_V1");
}

export function leaderAssessmentAnswers() {
  return envFlag("LEADER_ASSESSMENT_ANSWERS");
}

export function fidelityBoardEnabled() {
  return envFlag("FIDELITY_BOARD_ENABLED");
}

export function secureExportEnabled() {
  return envFlag("SECURE_EXPORT_ENABLED");
}

export function verticalPackArmedForces() {
  return envFlag("VERTICAL_PACK_ARMED_FORCES");
}

export function verticalPackOptimization() {
  return envFlag("VERTICAL_PACK_OPTIMIZATION");
}
