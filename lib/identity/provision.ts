import { resolveRole, type AppRole } from "@/lib/auth/roles";
import { lookupEnabledSsoProvider } from "@/lib/identity/data";
import {
  collectIdentityClaims,
  isIdentityStaffRole,
  keepExistingRoleOnSso,
  mapStaffRoleFromClaims,
} from "@/lib/identity/sso";
import { isMissingStaffDeskFunction } from "@/lib/identity/staff-desk";
import { createClient } from "@/lib/supabase/server";

export { isMissingStaffDeskFunction } from "@/lib/identity/staff-desk";

type AuthUser = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
  identities?: Array<{ identity_data?: Record<string, unknown> | null }> | null;
};

export async function applySsoFirstLogin(user: AuthUser | null) {
  if (!user) return { role: null as AppRole | null, provisioned: false };
  const current = resolveRole(user);
  if (current === "admin") {
    return { role: "admin" as const, provisioned: false };
  }

  const email = user.email ?? "";
  const match = email ? await lookupEnabledSsoProvider(email) : null;
  if (!match) {
    return { role: current, provisioned: false };
  }

  const mapped = mapStaffRoleFromClaims(
    collectIdentityClaims(user),
    match.roleClaimMap
  );
  const nextRole = keepExistingRoleOnSso(current, mapped);
  if (!mapped || !isIdentityStaffRole(mapped) || nextRole === "admin") {
    return { role: current, provisioned: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("apply_sso_first_login", {
    p_group_id: match.groupId,
    p_staff_role: mapped,
  });
  if (error) {
    const text = error.message ?? "";
    if (/revoked/i.test(text)) {
      await supabase.auth.signOut();
      return { role: null, provisioned: false, revoked: true as const };
    }
    if (/sso_enabled is off/i.test(text)) {
      return { role: current, provisioned: false };
    }
    throw error;
  }
  return { role: mapped, provisioned: true };
}

export async function staffDeskIsActive(profileId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("staff_has_active_desk", {
    profile_id: profileId,
  });
  if (error) {
    if (isMissingStaffDeskFunction(error)) return true;
    throw error;
  }
  return data !== false;
}
