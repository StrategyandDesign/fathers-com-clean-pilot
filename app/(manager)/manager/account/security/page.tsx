import Link from "next/link";

import { Flash } from "@/components/manager/flash";
import { requireRole } from "@/lib/auth/session";
import { loadManagerSsoStatuses } from "@/lib/identity/data";
import { protocolLabel } from "@/lib/identity/sso";
import { getI18n } from "@/lib/i18n/server";
import { formatShortDate } from "@/lib/manager/types";
import { interactiveLinkClassName } from "@/lib/ui";

export default async function ManagerAccountSecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const flash = await searchParams;
  const { user } = await requireRole("manager");
  const { t } = await getI18n();
  const statuses = await loadManagerSsoStatuses(user.id);
  const status = statuses.find((row) => row.connected) ?? statuses[0] ?? null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <p className="text-sm text-muted-foreground">
        <Link href="/manager/account" className={interactiveLinkClassName}>
          {t("identity.backAccount")}
        </Link>
      </p>
      <Flash error={flash.error} notice={flash.notice} />
      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{t("identity.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("identity.accountLead")}</p>
        <dl className="mt-5 space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">{t("trust.ssoLabel")}</dt>
            <dd className="mt-1">
              {status?.enabled ? t("identity.flagOn") : t("identity.flagOff")}
              {status?.enabled && !status.connected ? ` ${t("identity.notConfigured")}` : ""}
            </dd>
          </div>
          {status?.connected ? (
            <>
              <div>
                <dt className="text-muted-foreground">{t("identity.protocol")}</dt>
                <dd className="mt-1">{protocolLabel(status.protocol)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("identity.issuer")}</dt>
                <dd className="mt-1 break-all">{status.issuer}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("identity.roleMap")}</dt>
                <dd className="mt-1 font-mono text-xs">
                  {JSON.stringify(status.roleClaimMap ?? {}, null, 0)}
                </dd>
              </div>
            </>
          ) : null}
          <div>
            <dt className="text-muted-foreground">{t("identity.lastDeprovision")}</dt>
            <dd className="mt-1">
              {status?.lastDeprovisionAt
                ? t("identity.lastDeprovisionAt", { date: formatShortDate(status.lastDeprovisionAt) })
                : t("identity.lastDeprovisionNone")}
            </dd>
          </div>
        </dl>
        <p className="mt-5 text-sm text-muted-foreground">{t("identity.window")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("identity.fathersNote")}</p>
      </section>
    </div>
  );
}
