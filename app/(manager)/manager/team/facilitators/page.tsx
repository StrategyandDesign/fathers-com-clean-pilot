import { FacilitatorRegistryView } from "@/components/fidelity/facilitator-registry";
import { Flash } from "@/components/manager/flash";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/session";
import { loadFacilitatorRegistry } from "@/lib/fidelity/data";
import { fidelityBoardEnabled } from "@/lib/flags";
import { getI18n } from "@/lib/i18n/server";

export default async function ManagerFacilitatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const flash = await searchParams;
  const { user } = await requireRole("manager");
  const { t } = await getI18n();

  if (!fidelityBoardEnabled()) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("fidelity.registryTitle")}
        </h1>
        <EmptyState title={t("fidelity.flagOffTitle")}>{t("fidelity.flagOffBody")}</EmptyState>
      </div>
    );
  }

  const rows = await loadFacilitatorRegistry(user.id);

  return (
    <>
      <Flash error={flash.error} notice={flash.notice} />
      <FacilitatorRegistryView rows={rows} t={t} />
    </>
  );
}
