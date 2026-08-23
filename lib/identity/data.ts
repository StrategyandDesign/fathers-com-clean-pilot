import { cache } from "react";

import {
  buildOrgSsoStatus,
  isProvisionAction,
  parseIdentityProvider,
  parseSsoEnabled,
  shouldOfferOrganizationSignIn,
} from "@/lib/identity/sso";
import type {
  OrgIdentityProvider,
  OrgSsoStatus,
  OrgStaffProvisionEvent,
} from "@/lib/identity/types";
import { createClient } from "@/lib/supabase/server";

type IdentityClient = Awaited<ReturnType<typeof createClient>>;

function missingRelation(error: { message?: string; code?: string } | null, name: string) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    new RegExp(name, "i").test(error.message ?? "")
  );
}

export async function anyOrganizationSsoReady(supabase?: IdentityClient) {
  const client = supabase ?? (await createClient());
  const { data, error } = await client.rpc("any_sso_ready");
  if (error) {
    if (missingRelation(error, "any_sso_ready")) return false;
    return false;
  }
  return data === true;
}

export async function lookupEnabledSsoProvider(email: string, supabase?: IdentityClient) {
  const client = supabase ?? (await createClient());
  const { data, error } = await client.rpc("lookup_enabled_sso_provider", { p_email: email });
  if (error || !data) {
    if (error && !missingRelation(error, "lookup_enabled_sso_provider")) {
      throw error;
    }
    return null;
  }
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
  if (!row?.group_id) return null;
  return {
    groupId: String(row.group_id),
    protocol: typeof row.protocol === "string" ? row.protocol : null,
    issuer: typeof row.issuer === "string" ? row.issuer : null,
    displayName: typeof row.display_name === "string" ? row.display_name : null,
    supabaseProviderId:
      typeof row.supabase_provider_id === "string" ? row.supabase_provider_id : null,
    emailDomain: typeof row.email_domain === "string" ? row.email_domain : null,
    roleClaimMap: row.role_claim_map,
  };
}

export async function loadGroupSsoEnabled(groupId: string, supabase?: IdentityClient) {
  if (!groupId) return false;
  const client = supabase ?? (await createClient());
  const { data, error } = await client
    .from("group_sso")
    .select("enabled")
    .eq("group_id", groupId)
    .maybeSingle();
  if (error) {
    if (missingRelation(error, "group_sso")) return false;
    throw error;
  }
  return parseSsoEnabled(data?.enabled);
}

export async function loadOrgIdentityProvider(groupId: string, supabase?: IdentityClient) {
  if (!groupId) return null;
  const client = supabase ?? (await createClient());
  const { data, error } = await client
    .from("org_identity_providers")
    .select(
      "id, group_id, protocol, issuer, client_id, client_secret_ref, metadata_url, email_domains, role_claim_map, display_name, supabase_provider_id"
    )
    .eq("group_id", groupId)
    .maybeSingle();
  if (error) {
    if (missingRelation(error, "org_identity_providers")) return null;
    throw error;
  }
  return parseIdentityProvider((data ?? null) as Record<string, unknown> | null);
}

export async function loadLastDeprovisionAt(groupId: string, supabase?: IdentityClient) {
  if (!groupId) return null;
  const client = supabase ?? (await createClient());
  const { data, error } = await client
    .from("org_staff_provision_events")
    .select("created_at")
    .eq("group_id", groupId)
    .eq("action", "deprovision")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    if (missingRelation(error, "org_staff_provision_events")) return null;
    throw error;
  }
  return typeof data?.created_at === "string" ? data.created_at : null;
}

export async function loadOrgSsoStatus(groupId: string, supabase?: IdentityClient): Promise<OrgSsoStatus> {
  const client = supabase ?? (await createClient());
  const [enabled, provider, lastDeprovisionAt] = await Promise.all([
    loadGroupSsoEnabled(groupId, client),
    loadOrgIdentityProvider(groupId, client),
    loadLastDeprovisionAt(groupId, client),
  ]);
  return buildOrgSsoStatus({ groupId, enabled, provider, lastDeprovisionAt });
}

export const loadOrgSsoStatuses = cache(async (groupIds: string[]) => {
  const ids = [...new Set(groupIds.filter(Boolean))];
  const supabase = await createClient();
  const statuses = await Promise.all(ids.map((id) => loadOrgSsoStatus(id, supabase)));
  return statuses;
});

export async function loadManagerSsoStatuses(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_staff")
    .select("group_id, disabled_at")
    .eq("profile_id", userId)
    .eq("staff_role", "manager");
  if (error) {
    if (missingRelation(error, "organization_staff")) return [];
    throw error;
  }
  const ids = [
    ...new Set(
      ((data ?? []) as Array<{ group_id: string; disabled_at?: string | null }>)
        .filter((row) => !row.disabled_at)
        .map((row) => row.group_id)
    ),
  ];
  return loadOrgSsoStatuses(ids);
}

export async function loadAdminSsoStatuses() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("group_sso").select("group_id, enabled");
  if (error) {
    if (missingRelation(error, "group_sso")) return [];
    throw error;
  }
  const rows = (data ?? []) as Array<{ group_id: string; enabled: boolean }>;
  const enabledIds = rows.filter((row) => row.enabled).map((row) => row.group_id);
  if (enabledIds.length === 0) return [];
  return loadOrgSsoStatuses(enabledIds);
}

export async function loadProvisionEvents(groupId: string, limit = 20): Promise<OrgStaffProvisionEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("org_staff_provision_events")
    .select("id, group_id, profile_id, actor_id, action, created_at, payload")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (missingRelation(error, "org_staff_provision_events")) return [];
    throw error;
  }
  return ((data ?? []) as Array<Record<string, unknown>>).flatMap((row) => {
    if (!isProvisionAction(row.action) || typeof row.id !== "string") return [];
    return [
      {
        id: row.id,
        groupId: String(row.group_id),
        profileId: String(row.profile_id),
        actorId: typeof row.actor_id === "string" ? row.actor_id : null,
        action: row.action,
        at: typeof row.created_at === "string" ? row.created_at : "",
        payload:
          row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
            ? (row.payload as Record<string, unknown>)
            : {},
      },
    ];
  });
}

export function combinedSsoConnection(statuses: OrgSsoStatus[]) {
  const connected = statuses.find((status) => status.connected);
  if (!connected) return { connected: false, providerName: null };
  return { connected: true, providerName: connected.providerName };
}

export function organizationSignInOffered(statuses: OrgSsoStatus[]) {
  return shouldOfferOrganizationSignIn(statuses);
}

export type { OrgIdentityProvider };
