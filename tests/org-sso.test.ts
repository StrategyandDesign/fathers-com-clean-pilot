import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { SSO_ENABLED } from "../lib/flags";
import {
  buildOrgSsoStatus,
  collectIdentityClaims,
  emailDomain,
  findProviderForEmail,
  keepExistingRoleOnSso,
  mapStaffRoleFromClaims,
  normalizeEmailDomains,
  orgSsoEnabled,
  parseIdentityProtocol,
  parseRoleClaimMap,
  parseSsoEnabled,
  protocolLabel,
  shouldOfferOrganizationSignIn,
  ssoConnectionFromStatus,
} from "../lib/identity/sso";
import { identityScimToken, parseScimUserPayload, scimAuthorized } from "../lib/identity/scim";
import { recommendedFlagsForType } from "../lib/organization-type";
import { isMissingStaffDeskFunction } from "../lib/identity/staff-desk";
import { canRemoveStaff } from "../lib/org-staff/types";
import { buildTrustStatusView, trustStatusLines } from "../lib/trust/status";
import { createTranslator } from "../lib/i18n/translate";
import { en } from "../lib/i18n/messages/en";
import { emptyCounselPackState } from "../lib/counsel/pack";

const EM_DASH = "—";
const t = createTranslator("en");

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

const provider = {
  id: "idp-1",
  groupId: "org-1",
  protocol: "oidc" as const,
  issuer: "https://idp.example",
  clientId: "desk",
  clientSecretRef: "AUTH_SSO_SECRET",
  metadataUrl: null,
  emailDomains: ["nwa.example"],
  roleClaimMap: parseRoleClaimMap(undefined),
  displayName: "NWA Directory",
  supabaseProviderId: "11111111-1111-1111-1111-111111111111",
};

describe("sso_enabled flag", () => {
  it("defaults off so login and membership stay unchanged", () => {
    assert.equal(SSO_ENABLED, "sso_enabled");
    assert.equal(parseSsoEnabled(undefined), false);
    assert.equal(parseSsoEnabled(false), false);
    assert.equal(orgSsoEnabled({}), false);
    assert.equal(orgSsoEnabled({ org: false }), false);
    assert.equal(shouldOfferOrganizationSignIn([]), false);
    assert.equal(
      shouldOfferOrganizationSignIn([{ enabled: false, connected: false }]),
      false
    );
    assert.equal(recommendedFlagsForType("rehab").ssoEnabled, false);
    const flags = readRepo("lib/flags.ts");
    const env = readRepo(".env.example");
    const login = readRepo("app/(auth)/login/page.tsx");
    assert.match(flags, /sso_enabled/);
    assert.match(flags, /defaults OFF|default OFF/);
    assert.match(env, /sso_enabled lives on group_sso/);
    assert.match(login, /anyOrganizationSsoReady/);
    assert.match(login, /organizationSignIn \?/);
    assert.match(login, /signIn/);
    assert.match(login, /auth.password/);
    assert.doesNotMatch(login, /\bSSO\b/);
    assert.match(readRepo("docs/engineering/PILOT.md"), /sso_enabled/);
    assert.match(readRepo("docs/product/FACILITATOR-SUPPORT-MODEL.md"), /sso_enabled/);
  });

  it("offers organization sign-in only when the flag is on and a provider is linked", () => {
    const off = buildOrgSsoStatus({ groupId: "org-1", enabled: false, provider });
    const incomplete = buildOrgSsoStatus({ groupId: "org-1", enabled: true, provider: null });
    const on = buildOrgSsoStatus({ groupId: "org-1", enabled: true, provider });
    assert.equal(off.connected, false);
    assert.equal(incomplete.connected, false);
    assert.equal(on.connected, true);
    assert.equal(shouldOfferOrganizationSignIn([off, incomplete]), false);
    assert.equal(shouldOfferOrganizationSignIn([on]), true);
    assert.equal(
      findProviderForEmail("brenda@nwa.example", [provider], [on])?.id,
      "idp-1"
    );
    assert.equal(
      findProviderForEmail("father@nwa", [provider], [on]),
      null
    );
  });
});

describe("identity claim mapping", () => {
  it("maps IdP claims to Leader or Reviewer and never Super-admin", () => {
    assert.equal(parseIdentityProtocol("oidc"), "oidc");
    assert.equal(parseIdentityProtocol("saml"), "saml");
    assert.equal(protocolLabel("oidc"), "OpenID Connect");
    assert.equal(protocolLabel("saml"), "SAML 2.0");
    assert.deepEqual(normalizeEmailDomains("NWA.example, @other.org"), [
      "nwa.example",
      "other.org",
    ]);
    assert.equal(emailDomain("Brenda@NWA.example"), "nwa.example");
    assert.equal(
      mapStaffRoleFromClaims({ role: "Leader" }, undefined),
      "manager"
    );
    assert.equal(
      mapStaffRoleFromClaims({ groups: ["Reviewer"] }, { claim: "groups", values: { reviewer: "reviewer" } }),
      "reviewer"
    );
    assert.equal(
      mapStaffRoleFromClaims({ role: "admin" }, { claim: "role", values: { admin: "admin" } }),
      null
    );
    assert.equal(keepExistingRoleOnSso("admin", "manager"), "admin");
    assert.equal(keepExistingRoleOnSso("father", "manager"), "manager");
    assert.equal(keepExistingRoleOnSso("father", null), "father");
    const claims = collectIdentityClaims({
      identities: [{ identity_data: { role: "reviewer" } }],
    });
    assert.equal(mapStaffRoleFromClaims(claims), "reviewer");
  });

  it("keeps role decisions on app_metadata after first login", () => {
    const roles = readRepo("lib/auth/roles.ts");
    const provision = readRepo("lib/identity/provision.ts");
    const sql = readRepo("supabase/migrations/20260823120000_org_identity_sso.sql");
    assert.match(roles, /app_metadata/);
    assert.match(roles, /Never read user_metadata/);
    assert.match(provision, /apply_sso_first_login/);
    assert.match(sql, /raw_app_meta_data/);
    assert.match(sql, /jsonb_build_object\('role', p_staff_role::text\)/);
    assert.match(sql, /org_identity_providers/);
    assert.match(sql, /org_staff_provision_events/);
    assert.match(sql, /disabled_at/);
    assert.match(sql, /delete from auth.sessions/);
  });
});

describe("revoke and SCIM mapping", () => {
  it("keeps the last leader and records deprovision", () => {
    assert.equal(
      canRemoveStaff({ targetId: "a", targetRole: "manager", managerCount: 1 }),
      false
    );
    const actions = readRepo("lib/identity/actions.ts");
    const membership = readRepo("lib/org-staff/membership.ts");
    assert.match(actions, /revoke_organization_staff/);
    assert.match(actions, /Revoke desk access|Sessions will not refresh/);
    assert.match(membership, /disabled_at/);
    assert.match(readRepo("lib/auth/session.ts"), /staffDeskIsActive/);
    assert.equal(isMissingStaffDeskFunction({ code: "PGRST202", message: "Could not find the function" }), true);
    assert.equal(isMissingStaffDeskFunction({ code: "42883", message: "function public.foo does not exist" }), true);
    assert.equal(isMissingStaffDeskFunction({ code: "XX000", message: "staff_has_active_desk is not in the schema cache" }), true);
    assert.equal(isMissingStaffDeskFunction({ code: "42501", message: "permission denied" }), false);
    assert.match(readRepo("docs/engineering/SSO-OFFBOARDING.md"), /Last deprovision/);
  });

  it("parses a SCIM-shaped user and stays quiet when the token is unset", () => {
    assert.equal(identityScimToken(), null);
    assert.equal(scimAuthorized("Bearer secret"), false);
    const provisioned = parseScimUserPayload({
      userName: "leader@nwa.example",
      active: true,
      groupId: "org-1",
      role: "manager",
    });
    assert.equal(provisioned?.action, "provision");
    assert.equal(provisioned?.staffRole, "manager");
    const gone = parseScimUserPayload({
      emails: [{ value: "leader@nwa.example", primary: true }],
      active: false,
      group_id: "org-1",
    });
    assert.equal(gone?.action, "deprovision");
    const route = readRepo("app/api/identity/scim/Users/route.ts");
    assert.match(route, /identityScimToken/);
    assert.match(route, /status: 404/);
  });
});

describe("single sign-on copy hygiene", () => {
  it("expands single sign-on and keeps em dashes out", () => {
    const model = buildTrustStatusView({
      sso: ssoConnectionFromStatus(
        buildOrgSsoStatus({ groupId: "org-1", enabled: false, provider: null })
      ),
      states: [emptyCounselPackState("org-1", "NWA")],
      counselHref: "/manager/account/counsel",
      ssoHref: "/manager/account/security",
    });
    const sso = trustStatusLines(model, t).find((line) => line.key === "sso");
    assert.ok(sso);
    assert.equal(sso.label, "Single sign-on");
    assert.equal(sso.value, "Not connected.");
    assert.equal(sso.note, "Off unless Super-admin turns sso_enabled on.");
    assert.equal(sso.href, "/manager/account/security");
    assert.doesNotMatch(sso.label + sso.value + sso.note, /\bSSO\b/);
    assert.equal((sso.note ?? "").includes(EM_DASH), false);
    assert.equal(en.auth.orgContinue.includes(EM_DASH), false);
    assert.doesNotMatch(en.auth.orgContinue, /\bSSO\b/);
    assert.match(en.identity.adminLead, /OpenID Connect or SAML 2.0/);
    const identity = readRepo("app/(admin)/admin/organizations/[id]/identity/page.tsx");
    assert.doesNotMatch(identity, /\bSSO\b/);
    assert.equal(identity.includes(EM_DASH), false);
    assert.match(identity, /single sign-on/);
    assert.match(readRepo("app/(manager)/manager/account/security/page.tsx"), /identity.title/);
  });
});
