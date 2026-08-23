import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  COUNSEL_PACK_ARTIFACTS,
  counselPackChecklistComplete,
  counselPackLegalLabel,
  counselPackNeedsEmptyState,
  type CounselPackState,
} from "@/lib/counsel/pack";
import type { Translate } from "@/lib/i18n/translate";
import { formatShortDate } from "@/lib/manager/types";
import { interactiveLinkClassName } from "@/lib/ui";
import { cn } from "@/lib/utils";

function downloadHref(slug: string) {
  return `/api/counsel/pack/${slug}`;
}

export function CounselPackView({
  backHref,
  states,
  t,
  admin = false,
}: {
  backHref: string;
  states: CounselPackState[];
  t: Translate;
  admin?: boolean;
}) {
  const showChecklist = states.some(counselPackNeedsEmptyState);
  const attachedNotes = states.filter((state) => state.attachedAt);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link href={backHref} className={cn("text-sm text-muted-foreground", interactiveLinkClassName)}>
          {t("counsel.backAccount")}
        </Link>
        <h1 className="font-heading mt-3 text-2xl font-semibold tracking-tight">
          {t("counsel.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("counsel.lead")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("counsel.notCovered")}</p>
      </div>

      {showChecklist ? (
        <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="font-heading text-lg font-semibold">{t("counsel.checklistTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("counsel.checklistLead")}</p>
          <ul className="mt-4 list-disc space-y-2 ps-5 text-sm text-muted-foreground">
            {COUNSEL_PACK_ARTIFACTS.map((artifact) => (
              <li key={artifact.slug}>{artifact.title}</li>
            ))}
            <li>{t("counsel.checklistAttach")}</li>
          </ul>
        </section>
      ) : null}

      {states.some((state) => state.required && state.attachedAt) ? (
        <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="font-heading text-lg font-semibold">{t("counsel.attachedTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("counsel.attachedLead")}</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {attachedNotes.map((state) => (
              <li key={state.groupId}>
                {t("counsel.attachedRow", {
                  name: state.groupName,
                  date: formatShortDate(state.attachedAt),
                })}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!showChecklist && !states.some((state) => state.required) ? (
        <p className="text-sm text-muted-foreground">{t("counsel.flagOff")}</p>
      ) : null}

      {admin && states.some((state) => state.required && !counselPackChecklistComplete(state)) ? (
        <p className="text-sm text-muted-foreground">{t("counsel.adminChecklistHint")}</p>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold">{t("counsel.downloadsTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("counsel.downloadsLead")}</p>
        </div>
        <ul className="space-y-3">
          {COUNSEL_PACK_ARTIFACTS.map((artifact) => (
            <li
              key={artifact.slug}
              className="rounded-xl border border-border bg-card p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{artifact.title}</p>
                <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                  {counselPackLegalLabel(artifact.legalStatus)}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{artifact.summary}</p>
              <Link
                href={downloadHref(artifact.slug)}
                className={cn(buttonVariants({ variant: "outline" }), "mt-4 w-full sm:w-auto")}
              >
                {t("counsel.download")}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
