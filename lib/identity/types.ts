export const SSO_ENABLED = "sso_enabled";

export const IDENTITY_PROTOCOLS = ["oidc", "saml"] as const;
export type IdentityProtocol = (typeof IDENTITY_PROTOCOLS)[number];

export const PROVISION_ACTIONS = ["provision", "deprovision", "role_change"] as const;
export type ProvisionAction = (typeof PROVISION_ACTIONS)[number];

export const IDENTITY_STAFF_ROLES = ["manager", "reviewer"] as const;
export type IdentityStaffRole = (typeof IDENTITY_STAFF_ROLES)[number];

export type RoleClaimMap = {
  claim: string;
  values: Record<string, IdentityStaffRole>;
};

export type OrgIdentityProvider = {
  id: string;
  groupId: string;
  protocol: IdentityProtocol;
  issuer: string;
  clientId: string | null;
  clientSecretRef: string | null;
  metadataUrl: string | null;
  emailDomains: string[];
  roleClaimMap: RoleClaimMap;
  displayName: string;
  supabaseProviderId: string | null;
};

export type OrgSsoStatus = {
  groupId: string;
  enabled: boolean;
  connected: boolean;
  protocol: IdentityProtocol | null;
  providerName: string | null;
  issuer: string | null;
  roleClaimMap: RoleClaimMap | null;
  lastDeprovisionAt: string | null;
};

export type OrgStaffProvisionEvent = {
  id: string;
  groupId: string;
  profileId: string;
  actorId: string | null;
  action: ProvisionAction;
  at: string;
  payload: Record<string, unknown>;
};

export const DEFAULT_ROLE_CLAIM_MAP: RoleClaimMap = {
  claim: "role",
  values: {
    leader: "manager",
    manager: "manager",
    reviewer: "reviewer",
  },
};

export const DEPROVISION_WINDOW =
  "Desk access is blocked on the next page load. Refresh tokens stop immediately. Access tokens expire within one hour.";
