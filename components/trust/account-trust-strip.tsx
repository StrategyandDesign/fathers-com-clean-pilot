import { TrustStatusStrip } from "@/components/trust/trust-status-strip";
import {
  loadAdminCounselPackStates,
  loadManagerCounselPackStates,
} from "@/lib/counsel/data";
import { combinedSsoConnection, loadAdminSsoStatuses, loadManagerSsoStatuses } from "@/lib/identity/data";
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
  const [states, statuses] = await Promise.all([
    role === "manager"
      ? loadManagerCounselPackStates(userId)
      : loadAdminCounselPackStates(),
    role === "manager" ? loadManagerSsoStatuses(userId) : loadAdminSsoStatuses(),
  ]);
  const connected = statuses.find((status) => status.connected);

  return (
    <TrustStatusStrip
      model={buildTrustStatusView({
        sso: combinedSsoConnection(statuses),
        states,
        counselHref: role === "manager" ? "/manager/account/counsel" : "/admin/account/counsel",
        ssoHref:
          role === "manager"
            ? "/manager/account/security"
            : connected
              ? `/admin/organizations/${connected.groupId}/identity`
              : "/admin/organizations",
      })}
      t={t}
    />
  );
}
