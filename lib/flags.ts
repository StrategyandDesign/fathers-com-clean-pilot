/**
 * Named product flags. Defaults stay off so a flag-off pilot remains usable.
 * Rollback for Issue 4: leave CERTIFICATES_REQUIRE_CLAIM unset or set it
 * to 0 / false / off. Issue 17 test-content seats stay hidden unless
 * PILOT_SHOW_TEST_CONTENT is explicitly on.
 */
export const CERTIFICATES_REQUIRE_CLAIM = "certificates_require_claim";
export const PILOT_SHOW_TEST_CONTENT = "pilot_show_test_content";

function envFlag(name: string) {
  const raw = process.env[name]?.trim().toLowerCase() ?? "";
  return raw === "1" || raw === "true" || raw === "on" || raw === "yes";
}

export function certificatesRequireClaim() {
  return envFlag("CERTIFICATES_REQUIRE_CLAIM");
}

export function pilotShowTestContent() {
  return envFlag("PILOT_SHOW_TEST_CONTENT");
}
