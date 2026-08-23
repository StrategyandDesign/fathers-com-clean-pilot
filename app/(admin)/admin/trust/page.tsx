import { TrustPackView } from "@/components/trust/trust-pack-view";
import { Flash } from "@/components/manager/flash";
import { requireRole } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";

export default async function AdminTrustPackPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const flash = await searchParams;
  await requireRole("admin");
  const { t } = await getI18n();
  return (
    <>
      <Flash error={flash.error} notice={flash.notice} />
      <TrustPackView t={t} />
    </>
  );
}
