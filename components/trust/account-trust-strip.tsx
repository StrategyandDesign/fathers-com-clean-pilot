import { TrustStatusStrip } from "@/components/trust/trust-status-strip";
import {
  loadAdminCounselPackStates,
  loadManagerCounselPackStates,
} from "@/lib/counsel/data";
import { getI18n } from "@/lib/i18n/server";
import { buildTrustStatusView } from "@/lib/trust/status";

export async function AccountTrustStrip({
  role,
  userId,
}: {
  role: "manager" | "admin";
  userId: string;
}) {
  const { t } = await getI18n();
  const states =
    role === "manager"
      ? await loadManagerCounselPackStates(userId)
      : await loadAdminCounselPackStates();

  return (
    <TrustStatusStrip
      model={buildTrustStatusView({
        sso: null,
        states,
        counselHref: role === "manager" ? "/manager/account/counsel" : "/admin/account/counsel",
      })}
      t={t}
    />
  );
}
