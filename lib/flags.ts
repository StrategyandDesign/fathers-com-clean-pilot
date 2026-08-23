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
 */
export const CERTIFICATES_REQUIRE_CLAIM = "certificates_require_claim";
export const PILOT_SHOW_TEST_CONTENT = "pilot_show_test_content";
export const ROSTER_PRACTICE_LIGHT = "roster_practice_light";
export const DESK_CONSIDER_NEXT_V1 = "desk_consider_next_v1";

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
