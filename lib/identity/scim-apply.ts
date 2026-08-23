import { createAdminClient } from "@/lib/supabase/admin";
import type { ScimProvisionRequest } from "@/lib/identity/scim";
import { logServerError } from "@/lib/security/public-error";

export async function applyScimProvision(request: ScimProvisionRequest) {
  const admin = createAdminClient();
  if (!admin) {
    return { ok: false as const, status: 503, error: "Service role is not configured." };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id, role")
    .eq("email", request.email)
    .maybeSingle();

  let userId = typeof profile?.id === "string" ? profile.id : null;

  if (request.action === "deprovision") {
    if (!userId) return { ok: true as const, status: 204 };
    const { error } = await admin.rpc("revoke_organization_staff", {
      p_group_id: request.groupId,
      p_profile_id: userId,
    });
    if (error) {
      logServerError("identity.scim", error);
      return { ok: false as const, status: 400, error: "Could not deprovision." };
    }
    return { ok: true as const, status: 204 };
  }

  const staffRole = request.staffRole ?? "manager";
  if (!userId) {
    const created = await admin.auth.admin.createUser({
      email: request.email,
      email_confirm: true,
      app_metadata: { role: staffRole },
      user_metadata: request.displayName ? { full_name: request.displayName } : undefined,
    });
    if (created.error || !created.data.user) {
      logServerError("identity.scim", created.error);
      return {
        ok: false as const,
        status: 400,
        error: "Could not provision.",
      };
    }
    userId = created.data.user.id;
  } else {
    await admin.auth.admin.updateUserById(userId, {
      app_metadata: { role: staffRole },
    });
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: staffRole, deactivated_at: null })
    .eq("id", userId);
  if (profileError) {
    logServerError("identity.scim", profileError);
    return { ok: false as const, status: 400, error: "Could not provision." };
  }

  const { error: staffError } = await admin.from("organization_staff").upsert(
    {
      group_id: request.groupId,
      profile_id: userId,
      staff_role: staffRole,
      disabled_at: null,
      disabled_by: null,
    },
    { onConflict: "group_id,profile_id" }
  );
  if (staffError) {
    logServerError("identity.scim", staffError);
    return { ok: false as const, status: 400, error: "Could not provision." };
  }

  const { error: eventError } = await admin.from("org_staff_provision_events").insert({
    group_id: request.groupId,
    profile_id: userId,
    actor_id: null,
    action: request.action,
    payload: {
      source: "scim",
      staffRole,
      externalId: request.externalId,
    },
  });
  if (eventError) {
    logServerError("identity.scim", eventError);
    return { ok: false as const, status: 400, error: "Could not provision." };
  }

  return { ok: true as const, status: 201, id: userId };
}
