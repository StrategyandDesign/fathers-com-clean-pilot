# Single sign-on offboarding

How to take a Leader or Reviewer off an organization desk after `sso_enabled` ships. Badge Shared 1-1.113. Not Shared 2.

## Protocols a questionnaire can cite

- OpenID Connect or SAML 2.0 through Auth identity-provider linking (`signInWithSSO` with provider id or email domain)
- Role map stored on `org_identity_providers.role_claim_map` (default claim `role`, values `leader`/`manager` → Leader, `reviewer` → Reviewer). Never maps to Super-admin. Fathers are not provisioned this way.
- Last deprovision drill hook: newest `org_staff_provision_events` row with `action = deprovision`, or Super-admin Record deprovision drill on `/admin/organizations/[id]/identity`

## Window

Desk access is blocked on the next page load. Refresh tokens stop immediately (`auth.sessions` deleted). Access tokens expire within one hour.

## Live revoke

1. Super-admin opens `/admin/organizations/[id]/identity`.
2. Choose Revoke desk access on that person. The last Leader cannot be revoked.
3. Confirm `organization_staff.disabled_at` is set and a deprovision event exists.
4. Disable the person in the customer identity provider so they cannot start a new organization sign-in.

## SCIM when the customer identity provider supports it

Set `IDENTITY_SCIM_TOKEN` and `SUPABASE_SERVICE_ROLE_KEY`. Point the IdP at `POST /api/identity/scim/Users` with `Authorization: Bearer $IDENTITY_SCIM_TOKEN` and `X-Group-Id`.

- `active: true` provisions or changes role
- `active: false` or `DELETE /api/identity/scim/Users/[id]` deprovisions

When the token is unset, those routes return 404 and local/pilot stay unchanged.

## Deprovision drill

Use Record deprovision drill on the Identity page without removing a live seat. That writes the questionnaire hook. Then run one live revoke in a staging org and confirm the person lands on login with desk access revoked.
