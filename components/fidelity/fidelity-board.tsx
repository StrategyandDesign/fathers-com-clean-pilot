import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { saveFidelityCheckItem } from "@/lib/fidelity/actions";
import {
  FIDELITY_NOTE_MAX,
  FIDELITY_SECTION_KEYS,
  FIDELITY_SECTION_LABEL_KEY,
  fidelityProgress,
} from "@/lib/fidelity/checklist";
import type { FidelityBoard as FidelityBoardState } from "@/lib/fidelity/data";
import type { Translate } from "@/lib/i18n/translate";
import { formatShortDate } from "@/lib/manager/types";
import { fieldClassName, interactiveLinkClassName } from "@/lib/ui";
import { cn } from "@/lib/utils";

export function FidelityBoardView({
  board,
  returnTo,
  t,
}: {
  board: FidelityBoardState;
  returnTo: string;
  t: Translate;
}) {
  const progress = fidelityProgress(board.items);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/manager/fidelity" className={cn("text-sm text-muted-foreground", interactiveLinkClassName)}>
            {t("fidelity.backList")}
          </Link>
          <h1 className="font-heading mt-3 text-2xl font-semibold tracking-tight">
            {board.trainingTitle || board.groupName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {board.trainingTitle
              ? t("fidelity.boardTrainingLead", { group: board.groupName, training: board.trainingTitle })
              : t("fidelity.boardCohortLead", { group: board.groupName })}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("fidelity.progress", { completed: progress.completed, total: progress.total })}
          </p>
        </div>
        <Link
          href={`/api/manager/fidelity/export?target=${encodeURIComponent(board.trainingId ?? board.groupId)}`}
          className={cn(buttonVariants({ variant: "outline" }), "w-full shrink-0 sm:w-auto")}
        >
          {t("fidelity.downloadSummary")}
        </Link>
      </div>

      {FIDELITY_SECTION_KEYS.map((section) => {
        const items = board.items.filter((item) => item.section === section);
        if (items.length === 0) return null;
        return (
          <section key={section} className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <h2 className="font-heading text-lg font-semibold">{t(FIDELITY_SECTION_LABEL_KEY[section])}</h2>
            <ul className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border">
              {items.map((item) => {
                const done = Boolean(item.completedAt);
                return (
                  <li key={item.itemKey} className="px-4 py-4">
                    <form action={saveFidelityCheckItem} className="space-y-3">
                      <input type="hidden" name="run_id" value={board.runId} />
                      <input type="hidden" name="item_key" value={item.itemKey} />
                      <input type="hidden" name="return_to" value={returnTo} />
                      <p className="font-medium">{item.prompt}</p>
                      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          name="completed"
                          value="1"
                          defaultChecked={done}
                          className="size-4 accent-primary"
                        />
                        <span>{done ? t("fidelity.markCompleteOn") : t("fidelity.markComplete")}</span>
                      </label>
                      {done ? (
                        <p className="text-sm text-muted-foreground">
                          {t("fidelity.completedBy", {
                            name: item.completedByName,
                            date: formatShortDate(item.completedAt),
                          })}
                        </p>
                      ) : null}
                      <label className="block space-y-2">
                        <span className="text-sm text-muted-foreground">{t("fidelity.notes")}</span>
                        <input
                          className={fieldClassName}
                          name="notes"
                          defaultValue={item.notes}
                          maxLength={FIDELITY_NOTE_MAX}
                          placeholder={t("fidelity.notesHint")}
                        />
                      </label>
                      <Button type="submit" variant="outline" className="w-full sm:w-auto">
                        {t("fidelity.saveItem")}
                      </Button>
                    </form>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
