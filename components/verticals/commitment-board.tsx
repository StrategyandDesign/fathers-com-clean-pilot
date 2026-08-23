import { ProgressLight } from "@/components/manager/progress-lights";
import { translatePracticeLight } from "@/lib/i18n/flash";
import type { Translate } from "@/lib/i18n/translate";
import {
  summarizeCommitmentBoard,
  type CommitmentBoardRow,
} from "@/lib/verticals/optimization/commitment";

export function CommitmentBoard({
  rows,
  t,
  audience,
}: {
  rows: CommitmentBoardRow[];
  t: Translate;
  audience: "leader" | "father";
}) {
  const summary = summarizeCommitmentBoard(rows);

  return (
    <section className="rounded-xl border border-border/70 bg-card/60 p-4 sm:p-6">
      <h2 className="font-heading text-lg font-semibold">
        {t(audience === "father" ? "optimization.boardFatherTitle" : "optimization.boardTitle")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t(audience === "father" ? "optimization.boardFatherLead" : "optimization.boardLead")}
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        {t("optimization.boardSummary", {
          completed: summary.completed,
          men: summary.men,
        })}
      </p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("optimization.boardEmpty")}</p>
      ) : (
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border/70">
          {rows.map((row) => {
            const label =
              row.flag === "none"
                ? t("optimization.boardNone")
                : translatePracticeLight(row.flag, t);
            return (
              <li key={row.fatherId} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <span className="min-w-0 truncate text-sm">{row.displayName}</span>
                {row.flag === "none" ? (
                  <span className="text-sm text-muted-foreground">{label}</span>
                ) : (
                  <ProgressLight compact tone={row.flag} label={label} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
