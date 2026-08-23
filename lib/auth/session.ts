import { redirect } from "next/navigation";

import { ROLE_HOME, resolveProfileRole, type AppRole } from "@/lib/auth/roles";
import { staffDeskIsActive } from "@/lib/identity/provision";
import { createClient } from "@/lib/supabase/server";

export async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, role: null as AppRole | null, deactivated: false, revoked: false };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("deactivated_at, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!error && profile?.deactivated_at) {
    await supabase.auth.signOut();
    return { user: null, role: null as AppRole | null, deactivated: true, revoked: false };
  }

  const role = resolveProfileRole(profile?.role, user);
  if ((role === "manager" || role === "reviewer") && !(await staffDeskIsActive(user.id))) {
    await supabase.auth.signOut();
    return { user: null, role: null as AppRole | null, deactivated: false, revoked: true };
  }

  return {
    user,
    role,
    deactivated: false,
    revoked: false,
  };
}

export async function requireRole(allowed: AppRole) {
  const { user, role, deactivated, revoked } = await getAuthContext();

  if (deactivated) {
    redirect("/login?error=This account has been deactivated.");
  }

  if (revoked) {
    redirect("/login?error=This desk access has been revoked.");
  }

  if (!user || !role) {
    redirect("/login");
  }

  if (role !== allowed) {
    redirect(ROLE_HOME[role]);
  }

  return { user, role };
}

/** Father walk, or Leader practice of the same Film → Check-in → Action path. */
export async function requireWalkUser() {
  const { user, role, deactivated, revoked } = await getAuthContext();

  if (deactivated) {
    redirect("/login?error=This account has been deactivated.");
  }

  if (revoked) {
    redirect("/login?error=This desk access has been revoked.");
  }

  if (!user || !role) {
    redirect("/login");
  }

  if (role !== "father" && role !== "manager") {
    redirect(ROLE_HOME[role]);
  }

  return { user, role };
}
