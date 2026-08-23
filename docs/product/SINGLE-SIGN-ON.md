# Single sign-on

Org-gated OpenID Connect or SAML 2.0 sign-in for Leaders and Reviewers. Badge Shared 1-1.113. Not Shared 2.

## Flag

`sso_enabled` lives on `group_sso`, default off. Super-admin turns it on per organization. It is not an env flag. Organization type never turns it on.

When the flag is off, login stays email and password. Super-admin break-glass stays email and password. Fathers stay invite-code plus email.

## Where it lives

Leaders read status on `/manager/account/security`. Super-admin configures `/admin/organizations/[id]/identity`. The Account trust strip from Issue 16 now reads the real connection and links here.

There is no new ribbon item and no marketing page.

## What it does

1. Super-admin links one identity provider (issuer, client refs, protocol, email domains, role claim map) and turns `sso_enabled` on.
2. Staff with a matching work email use Continue with your organization. Auth identity-provider linking (`signInWithSSO`) starts OpenID Connect or SAML 2.0.
3. First login maps IdP claims into `app_metadata.role` and `organization_staff`. Authorization still reads `app_metadata` only.
4. Revoke desk access disables `organization_staff` and deletes Auth sessions. Desk access is blocked on the next page load. Refresh tokens stop immediately. Access tokens expire within one hour.

SCIM 2.0 inbound is accepted at `/api/identity/scim/Users` when `IDENTITY_SCIM_TOKEN` is set. Otherwise use the offboarding runbook in `docs/engineering/SSO-OFFBOARDING.md`.
