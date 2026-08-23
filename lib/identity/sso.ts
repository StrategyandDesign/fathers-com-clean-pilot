import { isAppRole, type AppRole } from "@/lib/auth/roles";
import {
  DEFAULT_ROLE_CLAIM_MAP,
  IDENTITY_PROTOCOLS,
  IDENTITY_STAFF_ROLES,
  PROVISION_ACTIONS,
  SSO_ENABLED,
  type IdentityProtocol,
  type IdentityStaffRole,
  type OrgIdentityProvider,
  type OrgSsoStatus,
  type ProvisionAction,
  type RoleClaimMap,
} from "@/lib/identity/types";

export { SSO_ENABLED, type IdentityStaffRole } from "@/lib/identity/types";

export function parseSsoEnabled(value: unknown): boolean {
  return value === true;
}

export function orgSsoEnabled(input: { org?: boolean | null }): boolean {
  return input.org === true;
}

export function isIdentityProtocol(value: unknown): value is IdentityProtocol {
  return (
    typeof value === "string" &&
    (IDENTITY_PROTOCOLS as readonly string[]).includes(value)
  );
}

export function parseIdentityProtocol(value: unknown): IdentityProtocol | null {
  return isIdentityProtocol(value) ? value : null;
}

export function isProvisionAction(value: unknown): value is ProvisionAction {
  return (
    typeof value === "string" &&
    (PROVISION_ACTIONS as readonly string[]).includes(value)
  );
}

export function isIdentityStaffRole(value: unknown): value is IdentityStaffRole {
  return (
    typeof value === "string" &&
    (IDENTITY_STAFF_ROLES as readonly string[]).includes(value)
  );
}

export function emailDomain(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0 || at === trimmed.length - 1) return null;
  const domain = trimmed.slice(at + 1).replace(/\.+$/, "");
  return domain || null;
}

export function normalizeEmailDomains(value: unknown): string[] {
  const raw =
    typeof value === "string"
      ? value.split(/[,\s]+/)
      : Array.isArray(value)
        ? value
        : [];
  const seen = new Set<string>();
  for (const item of raw) {
    const domain = String(item ?? "")
      .trim()
      .toLowerCase()
      .replace(/^@/, "")
      .replace(/\.+$/, "");
    if (domain && domain.includes(".")) seen.add(domain);
  }
  return [...seen];
}

export function parseRoleClaimMap(value: unknown): RoleClaimMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...DEFAULT_ROLE_CLAIM_MAP, values: { ...DEFAULT_ROLE_CLAIM_MAP.values } };
  }
  const row = value as { claim?: unknown; values?: unknown; map?: unknown };
  const claim =
    typeof row.claim === "string" && row.claim.trim() ? row.claim.trim() : "role";
  const source =
    row.values && typeof row.values === "object" && !Array.isArray(row.values)
      ? row.values
      : row.map && typeof row.map === "object" && !Array.isArray(row.map)
        ? row.map
        : DEFAULT_ROLE_CLAIM_MAP.values;
  const values: Record<string, IdentityStaffRole> = {};
  for (const [key, mapped] of Object.entries(source as Record<string, unknown>)) {
    const role = String(mapped ?? "")
      .trim()
      .toLowerCase();
    if (role === "admin" || role === "father") continue;
    if (isIdentityStaffRole(role)) {
      values[key.trim().toLowerCase()] = role;
    }
  }
  if (Object.keys(values).length === 0) {
    return { claim, values: { ...DEFAULT_ROLE_CLAIM_MAP.values } };
  }
  return { claim, values };
}

function readClaim(source: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".").filter(Boolean);
  let current: unknown = source;
  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function claimValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "number" && Number.isFinite(value)) return [String(value)];
  if (Array.isArray(value)) {
    return value.flatMap((item) => claimValues(item));
  }
  return [];
}

export function mapStaffRoleFromClaims(
  claims: Record<string, unknown> | null | undefined,
  roleClaimMap?: unknown
): IdentityStaffRole | null {
  if (!claims) return null;
  const map = parseRoleClaimMap(roleClaimMap);
  const raw = readClaim(claims, map.claim);
  for (const value of claimValues(raw)) {
    const mapped = map.values[value.trim().toLowerCase()];
    if (mapped) return mapped;
  }
  return null;
}

export function keepExistingRoleOnSso(
  currentRole: AppRole | null | undefined,
  mapped: IdentityStaffRole | null
): AppRole | null {
  if (currentRole === "admin") return "admin";
  if (mapped) return mapped;
  if (isAppRole(currentRole)) return currentRole;
  return null;
}

export function shouldOfferOrganizationSignIn(statuses: Pick<OrgSsoStatus, "enabled" | "connected">[]) {
  return statuses.some((status) => status.enabled && status.connected);
}

export function findProviderForEmail(
  email: unknown,
  providers: OrgIdentityProvider[],
  statuses: Pick<OrgSsoStatus, "groupId" | "enabled" | "connected">[]
): OrgIdentityProvider | null {
  const domain = emailDomain(email);
  if (!domain) return null;
  const ready = new Set(
    statuses
      .filter((status) => status.enabled && status.connected)
      .map((status) => status.groupId)
  );
  return (
    providers.find(
      (provider) =>
        ready.has(provider.groupId) &&
        provider.emailDomains.includes(domain)
    ) ?? null
  );
}

export function identityIsConnected(provider: Pick<OrgIdentityProvider, "issuer" | "protocol"> | null | undefined) {
  return Boolean(provider?.issuer?.trim() && isIdentityProtocol(provider.protocol));
}

export function ssoConnectionFromStatus(status: Pick<OrgSsoStatus, "enabled" | "connected" | "providerName"> | null) {
  if (!status?.enabled || !status.connected) {
    return { connected: false, providerName: null };
  }
  return {
    connected: true,
    providerName: status.providerName,
  };
}

export function protocolLabel(protocol: IdentityProtocol | null) {
  if (protocol === "saml") return "SAML 2.0";
  if (protocol === "oidc") return "OpenID Connect";
  return null;
}

export function parseIdentityProvider(row: Record<string, unknown> | null | undefined): OrgIdentityProvider | null {
  if (!row) return null;
  const protocol = parseIdentityProtocol(row.protocol);
  const issuer = typeof row.issuer === "string" ? row.issuer.trim() : "";
  const groupId = typeof row.group_id === "string" ? row.group_id : typeof row.groupId === "string" ? row.groupId : "";
  const id = typeof row.id === "string" ? row.id : "";
  if (!protocol || !issuer || !groupId || !id) return null;
  const displayName =
    typeof row.display_name === "string" && row.display_name.trim()
      ? row.display_name.trim()
      : typeof row.displayName === "string" && row.displayName.trim()
        ? row.displayName.trim()
        : issuer;
  return {
    id,
    groupId,
    protocol,
    issuer,
    clientId:
      typeof row.client_id === "string" && row.client_id.trim()
        ? row.client_id.trim()
        : typeof row.clientId === "string" && row.clientId.trim()
          ? row.clientId.trim()
          : null,
    clientSecretRef:
      typeof row.client_secret_ref === "string" && row.client_secret_ref.trim()
        ? row.client_secret_ref.trim()
        : typeof row.clientSecretRef === "string" && row.clientSecretRef.trim()
          ? row.clientSecretRef.trim()
          : null,
    metadataUrl:
      typeof row.metadata_url === "string" && row.metadata_url.trim()
        ? row.metadata_url.trim()
        : typeof row.metadataUrl === "string" && row.metadataUrl.trim()
          ? row.metadataUrl.trim()
          : null,
    emailDomains: normalizeEmailDomains(row.email_domains ?? row.emailDomains),
    roleClaimMap: parseRoleClaimMap(row.role_claim_map ?? row.roleClaimMap),
    displayName,
    supabaseProviderId:
      typeof row.supabase_provider_id === "string" && row.supabase_provider_id.trim()
        ? row.supabase_provider_id.trim()
        : typeof row.supabaseProviderId === "string" && row.supabaseProviderId.trim()
          ? row.supabaseProviderId.trim()
          : null,
  };
}

export function buildOrgSsoStatus(input: {
  groupId: string;
  enabled?: unknown;
  provider?: OrgIdentityProvider | null;
  lastDeprovisionAt?: string | null;
}): OrgSsoStatus {
  const provider = input.provider ?? null;
  const enabled = parseSsoEnabled(input.enabled);
  const connected = enabled && identityIsConnected(provider);
  return {
    groupId: input.groupId,
    enabled,
    connected,
    protocol: connected ? provider?.protocol ?? null : null,
    providerName: connected ? provider?.displayName ?? null : null,
    issuer: connected ? provider?.issuer ?? null : null,
    roleClaimMap: connected ? provider?.roleClaimMap ?? null : null,
    lastDeprovisionAt: input.lastDeprovisionAt ?? null,
  };
}

export function collectIdentityClaims(
  user: {
    app_metadata?: Record<string, unknown> | null;
    user_metadata?: Record<string, unknown> | null;
    identities?: Array<{ identity_data?: Record<string, unknown> | null }> | null;
  } | null
): Record<string, unknown> {
  const claims: Record<string, unknown> = {};
  for (const identity of user?.identities ?? []) {
    Object.assign(claims, identity.identity_data ?? {});
  }
  Object.assign(claims, user?.user_metadata ?? {});
  Object.assign(claims, user?.app_metadata ?? {});
  return claims;
}

export { SSO_ENABLED as FLAG_NAME };
