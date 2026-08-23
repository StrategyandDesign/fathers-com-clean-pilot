"use client";

import Link from "next/link";
import { useState } from "react";

import { useT } from "@/components/i18n/locale-provider";
import { CompanionNudgeSuggest } from "@/components/manager/companion-nudge-suggest";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { translateAttention } from "@/lib/i18n/flash";
import type { Translate } from "@/lib/i18n/translate";
import type { ConsiderNextRow } from "@/lib/manager/consider-next";
import type { ParticipationMode } from "@/lib/participation";
import { initials } from "@/lib/ui";
import { cn } from "@/lib/utils";

function reasonText(row: ConsiderNextRow, t: Translate) {
  if (row.attentionReason) return translateAttention(row.attentionReason, t);
  return t(row.reason.key, row.reason.vars);
}

function ConsiderNextRowView({
  row,
  mode,
}: {
  row: ConsiderNextRow;
  mode: ParticipationMode;
}) {
  const t = useT();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const confirmHref =
    row.action === "issue_certificate" && row.trainingId
      ? `/manager/participants/${row.fatherId}/certificates/${row.trainingId}`
      : `/manager/participants/${row.fatherId}`;
  const confirmLabel =
    row.action === "issue_certificate"
      ? t("manager.considerNext.confirmCert")
      : t("manager.considerNext.confirmOpen");

  return (
    <li className="px-4 py-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-medium">
          {initials(row.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{row.name}</p>
          {row.action === "nudge" ? (
            <div className="mt-2">
              <CompanionNudgeSuggest
                fatherId={row.fatherId}
                template={row.template}
                reason={row.reason}
                whyTemplate={row.whyTemplate}
                canNudge={row.canNudge}
                block={row.block}
                cooldownDays={row.cooldownDays}
                returnTo="dashboard"
                compact
                mode={mode}
              />
            </div>
          ) : (
            <div className="mt-2 space-y-3">
              <p className="text-sm text-muted-foreground">{reasonText(row, t)}</p>
              <p className="text-sm text-muted-foreground">{t("manager.considerNext.youConfirm")}</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href={confirmHref}
                  className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
                >
                  {confirmLabel}
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full sm:w-auto"
                  onClick={() => setDismissed(true)}
                >
                  {t("manager.companion.dismiss")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

export function ConsiderNextCard({
  rows,
  mode = "unset",
}: {
  rows: ConsiderNextRow[];
  mode?: ParticipationMode;
}) {
  const t = useT();
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <h2 className="font-heading text-lg font-semibold">{t("manager.considerNext.title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("manager.considerNext.lead")}</p>
      <div className="mt-5">
        {rows.length === 0 ? (
          <EmptyState framed={false} className="p-0" title={t("manager.considerNext.empty")}>
            {t("manager.considerNext.emptyBody")}
          </EmptyState>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {rows.map((row) => (
              <ConsiderNextRowView key={row.fatherId} row={row} mode={mode} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
