import { CounselPackView } from "@/components/counsel/counsel-pack-view";
import { Flash } from "@/components/manager/flash";
import { requireRole } from "@/lib/auth/session";
import { loadManagerCounselPackStates } from "@/lib/counsel/data";
import { getI18n } from "@/lib/i18n/server";

export default async function ManagerCounselPackPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const flash = await searchParams;
  const { user } = await requireRole("manager");
  const { t } = await getI18n();
  const states = await loadManagerCounselPackStates(user.id);

  return (
    <>
      <Flash error={flash.error} notice={flash.notice} />
      <CounselPackView backHref="/manager/account" states={states} t={t} />
    </>
  );
}
