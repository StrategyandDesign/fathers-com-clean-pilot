import Link from "next/link";

import { Flash } from "@/components/manager/flash";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/session";
import { loadFidelityTargets } from "@/lib/fidelity/data";
import { fidelityBoardEnabled } from "@/lib/flags";
import { getI18n } from "@/lib/i18n/server";
import { interactiveSurfaceClassName } from "@/lib/ui";
import { cn } from "@/lib/utils";

export default async function ManagerFidelityPage({
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
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{t("fidelity.title")}</h1>
        <EmptyState title={t("fidelity.flagOffTitle")}>{t("fidelity.flagOffBody")}</EmptyState>
      </div>
    );
  }

  const targets = await loadFidelityTargets(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{t("fidelity.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("fidelity.lead")}</p>
        </div>
        <Link
          href="/manager/team/facilitators"
          className={cn(buttonVariants({ variant: "outline" }), "w-full shrink-0 sm:w-auto")}
        >
          {t("fidelity.openRegistry")}
        </Link>
      </div>
      <Flash error={flash.error} notice={flash.notice} />

      {targets.length === 0 ? (
        <EmptyState
          title={t("fidelity.emptyTitle")}
          actionHref="/manager"
          actionLabel={t("fidelity.emptyAction")}
        >
          {t("fidelity.emptyBody")}
        </EmptyState>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {targets.map((target) => (
            <li key={`${target.kind}:${target.id}`}>
              <Link
                href={target.href}
                className={cn("flex items-center justify-between gap-3 px-4 py-4", interactiveSurfaceClassName)}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{target.title}</span>
                  <span className="block text-sm text-muted-foreground">{target.subtitle}</span>
                </span>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {t("fidelity.progress", { completed: target.completed, total: target.total })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
