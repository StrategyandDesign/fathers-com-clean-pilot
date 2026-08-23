import { CounselPackView } from "@/components/counsel/counsel-pack-view";
import { Flash } from "@/components/manager/flash";
import { requireRole } from "@/lib/auth/session";
import { loadAdminCounselPackStates } from "@/lib/counsel/data";
import { getI18n } from "@/lib/i18n/server";

export default async function AdminCounselPackPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const flash = await searchParams;
  await requireRole("admin");
  const { t } = await getI18n();
  const states = await loadAdminCounselPackStates();

  return (
    <>
      <Flash error={flash.error} notice={flash.notice} />
      <CounselPackView backHref="/admin/account" states={states} t={t} admin />
    </>
  );
}
