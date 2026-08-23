import { TrustStatusStrip } from "@/components/trust/trust-status-strip";
import type { CounselPackState } from "@/lib/counsel/pack";
import { loadOrgSsoStatus } from "@/lib/identity/data";
import { ssoConnectionFromStatus } from "@/lib/identity/sso";
import { getI18n } from "@/lib/i18n/server";
import { buildTrustStatusView } from "@/lib/trust/status";

export async function OrgTrustStrip({ state }: { state: CounselPackState }) {
  const { t } = await getI18n();
  const sso = await loadOrgSsoStatus(state.groupId);

  return (
    <TrustStatusStrip
      model={buildTrustStatusView({
        sso: ssoConnectionFromStatus(sso),
        states: [state],
        counselHref: "/admin/account/counsel",
        ssoHref: `/admin/organizations/${state.groupId}/identity`,
      })}
      t={t}
      headingKey="trust.orgTitle"
    />
  );
}
