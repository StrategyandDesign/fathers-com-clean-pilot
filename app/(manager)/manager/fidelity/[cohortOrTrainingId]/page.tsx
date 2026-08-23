import { notFound } from "next/navigation";

import { FidelityBoardView } from "@/components/fidelity/fidelity-board";
import { Flash } from "@/components/manager/flash";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/session";
import { ensureFidelityBoard, resolveFidelityTarget } from "@/lib/fidelity/data";
import { fidelityBoardEnabled } from "@/lib/flags";
import { getI18n } from "@/lib/i18n/server";

export default async function ManagerFidelityBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ cohortOrTrainingId: string }>;
  searchParams: Promise<{ error?: string; notice?: string; group?: string }>;
}) {
  const { cohortOrTrainingId } = await params;
  const flash = await searchParams;
  const { user } = await requireRole("manager");
  const { t } = await getI18n();

  if (!fidelityBoardEnabled()) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{t("fidelity.title")}</h1>
        <EmptyState title={t("fidelity.flagOffTitle")}>{t("fidelity.flagOffBody")}</EmptyState>
      </div>
    );
  }

  const target = await resolveFidelityTarget(user.id, cohortOrTrainingId, flash.group);
  if (!target) notFound();

  const board = await ensureFidelityBoard({
    managerId: user.id,
    groupId: target.groupId,
    trainingId: target.trainingId,
  });
  if (!board) {
    return (
      <div className="space-y-6">
        <Flash error={flash.error} notice={flash.notice} />
        <EmptyState title={t("fidelity.notReadyTitle")}>{t("fidelity.notReadyBody")}</EmptyState>
      </div>
    );
  }

  return (
    <>
      <Flash error={flash.error} notice={flash.notice} />
      <FidelityBoardView
        board={board}
        returnTo={`/manager/fidelity/${cohortOrTrainingId}`}
        t={t}
      />
    </>
  );
}
