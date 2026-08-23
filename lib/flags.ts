/**
 * Named product flags. Defaults stay off unless a later Issue 17 hygiene
 * pass turns a flag on. Rollback for Issue 4: leave
 * CERTIFICATES_REQUIRE_CLAIM unset or set it to 0 / false / off.
 */
export const CERTIFICATES_REQUIRE_CLAIM = "certificates_require_claim";

function envFlag(name: string) {
  const raw = process.env[name]?.trim().toLowerCase() ?? "";
  return raw === "1" || raw === "true" || raw === "on" || raw === "yes";
}

export function certificatesRequireClaim() {
  return envFlag("CERTIFICATES_REQUIRE_CLAIM");
}
