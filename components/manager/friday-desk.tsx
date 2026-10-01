import Link from "next/link";

import { CopyButton } from "@/components/manager/copy-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { claimFatherSeat } from "@/lib/manager/claim-actions";
import {
  fridayCopyLine,
  markLabel,
  type WeekMarks,
} from "@/lib/manager/friday-desk";
import type { Translate } from "@/lib/i18n/translate";
import { cn } from "@/lib/utils";

export type FridayDeskRow = {
  fatherId: string;
  name: string;
  claimed: boolean | null;
  week: WeekMarks;
  stalled: boolean;
};

function Mark({ done }: { done: boolean }) {
  return <span className="font-medium tabular-nums text-foreground">{markLabel(done)}</span>;
}

export function FridayDesk({
  rows,
  claimKnown,
  nudge,
  t,
}: {
  rows: FridayDeskRow[];
  claimKnown: boolean;
  nudge: FridayDeskRow | null;
  t: Translate;
}) {
  const claimedRows = rows.filter((row) => row.claimed === true);
  const unclaimed = rows.filter((row) => row.claimed === false);
  const weekDone = claimedRows.filter(
    (row) => row.week.film && row.week.checkpoint && row.week.practice
  ).length;
  const stalled = claimedRows.filter((row) => row.stalled).length;
  const line = nudge ? fridayCopyLine(nudge.name) : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("manager.desk.title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground">
          {t("manager.desk.directorDoor")}
        </p>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("manager.desk.coachDoor")}
        </p>
      </div>

      <p className="text-sm text-muted-foreground">
        {claimKnown
          ? t("manager.desk.counts", {
              claimed: claimedRows.length,
              done: weekDone,
              stalled,
            })
          : t("manager.desk.countsUnknown", { men: rows.length })}
      </p>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 sm:px-5">
          <h2 className="font-heading text-lg font-semibold">{t("manager.desk.rosterTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("manager.desk.rosterLead")}</p>
        </div>
        {!claimKnown ? (
          <p className="border-b border-border px-4 py-3 text-sm text-muted-foreground sm:px-5">
            {t("manager.desk.claimUnknown")}
          </p>
        ) : null}
        {rows.length === 0 ? (
          <p className="px-4 py-4 text-sm text-muted-foreground sm:px-5">{t("manager.desk.rosterEmpty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="px-4 py-2 font-medium sm:px-5">{t("manager.desk.colName")}</th>
                  <th className="px-3 py-2 font-medium">{t("manager.desk.colClaimed")}</th>
                  <th className="px-3 py-2 font-medium">{t("manager.desk.colFilm")}</th>
                  <th className="px-3 py-2 font-medium">{t("manager.desk.colCheckpoint")}</th>
                  <th className="px-3 py-2 font-medium">{t("manager.desk.colPractice")}</th>
                </tr>
              </thead>
              <tbody>
                {(claimKnown ? claimedRows : rows).map((row) => (
                  <tr key={row.fatherId} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 sm:px-5">
                      <Link href={`/manager/participants/${row.fatherId}`} className="font-medium">
                        {row.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      {row.claimed == null ? t("common.emDash") : row.claimed ? t("father.home.markYes") : t("father.home.markNo")}
                    </td>
                    <td className="px-3 py-2">
                      <Mark done={row.week.film} />
                    </td>
                    <td className="px-3 py-2">
                      <Mark done={row.week.checkpoint} />
                    </td>
                    <td className="px-3 py-2">
                      <Mark done={row.week.practice} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {claimKnown && claimedRows.length === 0 && rows.length > 0 ? (
          <p className="px-4 py-3 text-sm text-muted-foreground sm:px-5">{t("manager.desk.rosterEmpty")}</p>
        ) : null}
        {unclaimed.length > 0 ? (
          <div className="border-t border-border px-4 py-4 sm:px-5">
            <h3 className="text-sm font-medium">{t("manager.desk.unclaimedTitle")}</h3>
            <ul className="mt-3 space-y-2">
              {unclaimed.map((row) => (
                <li key={row.fatherId} className="flex flex-wrap items-center justify-between gap-2">
                  <span>{row.name}</span>
                  <form action={claimFatherSeat}>
                    <input type="hidden" name="father_id" value={row.fatherId} />
                    <Button type="submit" size="sm" variant="outline">
                      {t("manager.desk.claim")}
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="font-heading text-lg font-semibold">{t("manager.desk.nudgeTitle")}</h2>
        {nudge ? (
          <div className="mt-3 space-y-3">
            <p className="text-sm">
              <span className="text-muted-foreground">{t("manager.desk.statusLabel")}</span>{" "}
              {t("manager.desk.statusStalled")}
            </p>
            <p className="font-medium">{nudge.name}</p>
            <p className="text-sm leading-relaxed">{line}</p>
            <CopyButton value={line} label={t("manager.desk.copyLine")} className="w-full sm:w-auto" />
          </div>
        ) : (
          <p className="mt-3 text-sm">
            <span className="text-muted-foreground">{t("manager.desk.statusLabel")}</span>{" "}
            {t("manager.desk.statusClear")}
          </p>
        )}
      </section>

      <div>
        <Link href="/api/manager/reports/export?format=csv" className={cn(buttonVariants(), "w-full sm:w-auto")}>
          {t("manager.desk.export")}
        </Link>
      </div>
    </div>
  );
}
