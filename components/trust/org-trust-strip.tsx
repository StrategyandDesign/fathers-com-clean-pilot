import { TrustStatusStrip } from "@/components/trust/trust-status-strip";
import type { CounselPackState } from "@/lib/counsel/pack";
import { getI18n } from "@/lib/i18n/server";
import { buildTrustStatusView } from "@/lib/trust/status";

export async function OrgTrustStrip({ state }: { state: CounselPackState }) {
  const { t } = await getI18n();

  return (
    <TrustStatusStrip
      model={buildTrustStatusView({
        sso: null,
        states: [state],
        counselHref: "/admin/account/counsel",
      })}
      t={t}
      headingKey="trust.orgTitle"
    />
  );
}
