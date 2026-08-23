import Link from "next/link";
import { notFound } from "next/navigation";

import {
  recordDeprovisionDrill,
  revokeOrganizationStaffAccess,
  saveOrganizationIdentityProvider,
  setOrganizationSso,
} from "@/lib/identity/actions";
import { loadAdminOrganization } from "@/lib/admin/data";
import { Flash } from "@/components/manager/flash";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/session";
import { loadOrgIdentityProvider, loadOrgSsoStatus, loadProvisionEvents } from "@/lib/identity/data";
import { DEFAULT_ROLE_CLAIM_MAP, DEPROVISION_WINDOW } from "@/lib/identity/types";
import { protocolLabel } from "@/lib/identity/sso";
import { canRemoveStaff } from "@/lib/org-staff/types";
import { formatShortDate } from "@/lib/manager/types";
import { checkboxOptionClassName, fieldClassName, interactiveLinkClassName } from "@/lib/ui";

export default async function AdminOrganizationIdentityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { id } = await params;
  const flash = await searchParams;
  await requireRole("admin");
  const detail = await loadAdminOrganization(id);
  if (!detail) notFound();

  const { group, staff } = detail;
  const [status, provider, events] = await Promise.all([
    loadOrgSsoStatus(group.id),
    loadOrgIdentityProvider(group.id),
    loadProvisionEvents(group.id),
  ]);
  const managerCount = staff.filter((row) => row.staffRole === "manager").length;
  const roleMapJson = JSON.stringify(provider?.roleClaimMap ?? DEFAULT_ROLE_CLAIM_MAP, null, 2);

  return (
    <div className="space-y-6">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <Link href={`/admin/organizations/${group.id}`} className={interactiveLinkClassName}>
          {group.name}
        </Link>
        <span className="text-white/20">|</span>
        <span>Single sign-on setup</span>
      </p>
      <Flash error={flash.error} notice={flash.notice} />

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Single sign-on setup</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Turn sso_enabled on, link one OpenID Connect or SAML 2.0 provider, and revoke
          organization staff. Secrets stay in Auth. Super-admin keeps email and password.
          Fathers stay on invite code and email.
        </p>
        <form action={setOrganizationSso} className="mt-5 space-y-3">
          <input type="hidden" name="group_id" value={group.id} />
          <label className={checkboxOptionClassName}>
            <input
              type="checkbox"
              name="sso_enabled"
              defaultChecked={status.enabled}
              className="size-4 accent-primary"
            />
            <span>
              <span className="block font-medium">Turn sso_enabled on</span>
              <span className="block text-sm text-muted-foreground">
                Off is the default. Staff keep email and password until this is on and an
                identity provider is linked.
              </span>
            </span>
          </label>
          <Button type="submit" variant="outline" className="w-full sm:w-auto">
            Save single sign-on flag
          </Button>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="font-heading text-lg font-semibold">Identity provider</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Link the same issuer Super-admin registers in Auth. Paste the provider id or
          email domain used there. Client secrets stay in Auth, not on this form.
        </p>
        <form action={saveOrganizationIdentityProvider} className="mt-5 space-y-4">
          <input type="hidden" name="group_id" value={group.id} />
          <label className="block space-y-2">
            <span className="text-sm text-muted-foreground">Display name</span>
            <input
              className={fieldClassName}
              name="display_name"
              defaultValue={provider?.displayName ?? ""}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-muted-foreground">Protocol</span>
            <select
              className={fieldClassName}
              name="protocol"
              defaultValue={provider?.protocol ?? "oidc"}
              required
            >
              <option value="oidc">OpenID Connect</option>
              <option value="saml">SAML 2.0</option>
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-muted-foreground">Issuer</span>
            <input
              className={fieldClassName}
              name="issuer"
              defaultValue={provider?.issuer ?? ""}
              required
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-muted-foreground">Client id</span>
            <input
              className={fieldClassName}
              name="client_id"
              defaultValue={provider?.clientId ?? ""}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-muted-foreground">Client secret reference</span>
            <input
              className={fieldClassName}
              name="client_secret_ref"
              defaultValue={provider?.clientSecretRef ?? ""}
              placeholder="Auth secret name only"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-muted-foreground">Metadata URL</span>
            <input
              className={fieldClassName}
              name="metadata_url"
              defaultValue={provider?.metadataUrl ?? ""}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-muted-foreground">Auth provider id</span>
            <input
              className={fieldClassName}
              name="supabase_provider_id"
              defaultValue={provider?.supabaseProviderId ?? ""}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-muted-foreground">Email domains</span>
            <input
              className={fieldClassName}
              name="email_domains"
              defaultValue={(provider?.emailDomains ?? []).join(", ")}
              placeholder="org.example"
              required
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-muted-foreground">Role claim map</span>
            <textarea
              className={`${fieldClassName} min-h-32 font-mono text-xs`}
              name="role_claim_map"
              defaultValue={roleMapJson}
            />
          </label>
          <Button type="submit" className="w-full sm:w-auto">
            Save identity provider
          </Button>
        </form>
        {status.connected ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Connected. {protocolLabel(status.protocol)}. Issuer {status.issuer}.
          </p>
        ) : null}
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="font-heading text-lg font-semibold">Revoke organization staff</h2>
        <p className="mt-1 text-sm text-muted-foreground">{DEPROVISION_WINDOW}</p>
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border">
          {staff.map((row) => (
            <li
              key={`${row.profileId}-${row.staffRole}`}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{row.name}</p>
                <p className="text-sm text-muted-foreground">
                  {row.staffRole === "manager" ? "Leader" : "Reviewer"}
                  {row.listedOwner ? " · listed owner" : ""}
                </p>
              </div>
              <form action={revokeOrganizationStaffAccess}>
                <input type="hidden" name="group_id" value={group.id} />
                <input type="hidden" name="profile_id" value={row.profileId} />
                <input type="hidden" name="return_to" value={`/admin/organizations/${group.id}/identity`} />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={
                    !canRemoveStaff({
                      targetId: row.profileId,
                      targetRole: row.staffRole,
                      managerCount,
                    })
                  }
                >
                  Revoke desk access
                </Button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="font-heading text-lg font-semibold">Provision events</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Last deprovision is the drill hook for a security questionnaire.
          {status.lastDeprovisionAt
            ? ` Last deprovision ${formatShortDate(status.lastDeprovisionAt)}.`
            : " No deprovision recorded yet."}
        </p>
        <form action={recordDeprovisionDrill} className="mt-4">
          <input type="hidden" name="group_id" value={group.id} />
          <Button type="submit" variant="outline" className="w-full sm:w-auto">
            Record deprovision drill
          </Button>
        </form>
        {events.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No provision events yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border">
            {events.map((event) => (
              <li key={event.id} className="px-4 py-3 text-sm">
                <p className="font-medium">{event.action}</p>
                <p className="text-muted-foreground">{formatShortDate(event.at)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
