"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthContext, requireRole } from "@/lib/auth/session";
import { getAppUrl } from "@/lib/email/send";
import { lookupEnabledSsoProvider } from "@/lib/identity/data";
import {
  isIdentityProtocol,
  normalizeEmailDomains,
  parseRoleClaimMap,
} from "@/lib/identity/sso";
import { allowActionRateLimit } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function ok(path: string, notice: string): never {
  redirect(`${path}?notice=${encodeURIComponent(notice)}`);
}

function identityPath(groupId: string) {
  return `/admin/organizations/${groupId}/identity`;
}

function revalidateIdentity(groupId: string) {
  revalidatePath("/manager/account");
  revalidatePath("/manager/account/security");
  revalidatePath("/admin/account");
  revalidatePath("/admin/organizations");
  revalidatePath(`/admin/organizations/${groupId}`);
  revalidatePath(identityPath(groupId));
  revalidatePath("/login");
}

export async function startOrganizationSignIn(formData: FormData) {
  if (!(await allowActionRateLimit("auth.sso"))) {
    redirect(
      `/login?error=${encodeURIComponent("Too many attempts. Wait a few minutes and try again.")}`
    );
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    redirect(
      `/login?error=${encodeURIComponent("Enter the work email your organization uses for single sign-on.")}`
    );
  }

  const match = await lookupEnabledSsoProvider(email);
  if (!match) {
    redirect(
      `/login?error=${encodeURIComponent("No organization identity provider is on for that email. Use email and password, or ask Super-admin to turn sso_enabled on.")}`
    );
  }

  const supabase = await createClient();
  const redirectTo = `${getAppUrl()}/auth/callback`;
  const request = match.supabaseProviderId
    ? { providerId: match.supabaseProviderId, options: { redirectTo } }
    : { domain: match.emailDomain ?? email.split("@")[1], options: { redirectTo } };

  const { data, error } = await supabase.auth.signInWithSSO(request);
  if (error || !data?.url) {
    redirect(
      `/login?error=${encodeURIComponent(
        error?.message ||
          "Could not start organization sign-in. Super-admin must finish identity-provider linking in Auth."
      )}`
    );
  }
  redirect(data.url);
}

export async function setOrganizationSso(formData: FormData) {
  const { user } = await requireRole("admin");
  const groupId = String(formData.get("group_id") ?? "").trim();
  const path = groupId ? identityPath(groupId) : "/admin/organizations";
  if (!groupId) fail("/admin/organizations", "Choose an organization.");
  if (!(await allowActionRateLimit("org.identity"))) fail(path, "flash.tooMany");

  const enabled = String(formData.get("sso_enabled") ?? "") === "on";
  const supabase = await createClient();
  const { error } = await supabase.from("group_sso").upsert(
    {
      group_id: groupId,
      enabled,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    },
    { onConflict: "group_id" }
  );
  if (error) fail(path, error.message);
  revalidateIdentity(groupId);
  ok(
    path,
    enabled
      ? "sso_enabled is on. Staff can use the organization identity provider when it is linked."
      : "sso_enabled is off. Staff keep email and password."
  );
}

export async function saveOrganizationIdentityProvider(formData: FormData) {
  const { user } = await requireRole("admin");
  const groupId = String(formData.get("group_id") ?? "").trim();
  const path = groupId ? identityPath(groupId) : "/admin/organizations";
  if (!groupId) fail("/admin/organizations", "Choose an organization.");
  if (!(await allowActionRateLimit("org.identity"))) fail(path, "flash.tooMany");

  const protocol = String(formData.get("protocol") ?? "").trim();
  const issuer = String(formData.get("issuer") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const clientId = String(formData.get("client_id") ?? "").trim();
  const clientSecretRef = String(formData.get("client_secret_ref") ?? "").trim();
  const metadataUrl = String(formData.get("metadata_url") ?? "").trim();
  const supabaseProviderId = String(formData.get("supabase_provider_id") ?? "").trim();
  const emailDomains = normalizeEmailDomains(formData.get("email_domains"));
  let roleClaimMap;
  try {
    const raw = String(formData.get("role_claim_map") ?? "").trim();
    roleClaimMap = parseRoleClaimMap(raw ? JSON.parse(raw) : undefined);
  } catch {
    fail(path, "Role claim map must be JSON.");
  }

  if (!isIdentityProtocol(protocol)) fail(path, "Choose OpenID Connect or SAML 2.0.");
  if (issuer.length < 3) fail(path, "Enter the issuer.");
  if (emailDomains.length === 0) fail(path, "Enter at least one email domain.");

  const supabase = await createClient();
  const { error } = await supabase.from("org_identity_providers").upsert(
    {
      group_id: groupId,
      protocol,
      issuer,
      display_name: displayName || issuer,
      client_id: clientId || null,
      client_secret_ref: clientSecretRef || null,
      metadata_url: metadataUrl || null,
      supabase_provider_id: supabaseProviderId || null,
      email_domains: emailDomains,
      role_claim_map: roleClaimMap,
      updated_at: new Date().toISOString(),
      created_by: user.id,
    },
    { onConflict: "group_id" }
  );
  if (error) fail(path, error.message);
  revalidateIdentity(groupId);
  ok(path, "Identity provider saved. Staff still use email and password until sso_enabled is on.");
}

export async function revokeOrganizationStaffAccess(formData: FormData) {
  const { user } = await getAuthContext();
  if (!user) redirect("/login");
  const groupId = String(formData.get("group_id") ?? "").trim();
  const profileId = String(formData.get("profile_id") ?? "").trim();
  const path =
    String(formData.get("return_to") ?? "").trim() ||
    (groupId ? identityPath(groupId) : "/admin/organizations");
  if (!groupId || !profileId) fail(path, "Choose a person to revoke.");
  if (!(await allowActionRateLimit("org.staff"))) fail(path, "flash.tooMany");

  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_organization_staff", {
    p_group_id: groupId,
    p_profile_id: profileId,
  });
  if (error) fail(path, error.message);
  revalidateIdentity(groupId);
  revalidatePath("/manager");
  revalidatePath("/reviewer");
  ok(path, "Desk access revoked. Sessions will not refresh.");
}

export async function recordDeprovisionDrill(formData: FormData) {
  const { user } = await requireRole("admin");
  const groupId = String(formData.get("group_id") ?? "").trim();
  const path = groupId ? identityPath(groupId) : "/admin/organizations";
  if (!groupId) fail("/admin/organizations", "Choose an organization.");
  if (!(await allowActionRateLimit("org.identity"))) fail(path, "flash.tooMany");

  const supabase = await createClient();
  const { error } = await supabase.from("org_staff_provision_events").insert({
    group_id: groupId,
    profile_id: user.id,
    actor_id: user.id,
    action: "deprovision",
    payload: { source: "deprovision_drill", drill: true },
  });
  if (error) fail(path, error.message);
  revalidateIdentity(groupId);
  ok(path, "Deprovision drill recorded. Use Revoke desk access for a live seat.");
}
