import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ARMED_FORCES_CHECKLIST_ITEMS } from "@/lib/verticals/armed-forces/checklist";
import { ARMED_FORCES_PACK_ARTIFACTS } from "@/lib/verticals/armed-forces/pack";
import { SHOW_MILITARY } from "@/lib/flags";
import type { Translate } from "@/lib/i18n/translate";
import { interactiveLinkClassName } from "@/lib/ui";
import { cn } from "@/lib/utils";

function downloadHref(slug: string) {
  return `/api/admin/verticals/armed-forces/${slug}`;
}

export function ArmedForcesChecklistView({ t }: { t: Translate }) {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          href="/admin/account"
          className={cn("text-sm text-muted-foreground", interactiveLinkClassName)}
        >
          {t("armedForces.back")}
        </Link>
        <h1 className="font-heading mt-3 text-2xl font-semibold tracking-tight">
          {t("armedForces.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("armedForces.lead")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("armedForces.comingHome")}</p>
      </div>

      <section className="rounded-xl border border-border/70 bg-card/60 p-4 sm:p-6">
        <h2 className="font-heading text-lg font-semibold">{t("armedForces.gatesTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("armedForces.gatesBody")}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("armedForces.showMilitaryLine", { state: SHOW_MILITARY ? "true" : "false" })}
        </p>
      </section>

      <section className="rounded-xl border border-border/70 bg-card/60 p-4 sm:p-6">
        <h2 className="font-heading text-lg font-semibold">{t("armedForces.checklistTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("armedForces.checklistLead")}</p>
        <ol className="mt-4 space-y-4">
          {ARMED_FORCES_CHECKLIST_ITEMS.map((item, index) => (
            <li key={item.key}>
              <p className="font-medium">
                {index + 1}. {item.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="font-heading text-lg font-semibold">{t("armedForces.downloadsTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("armedForces.downloadsLead")}</p>
        <ul className="mt-4 space-y-4">
          {ARMED_FORCES_PACK_ARTIFACTS.map((artifact) => (
            <li key={artifact.slug}>
              <p className="font-medium">{artifact.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{artifact.summary}</p>
              <Link
                href={downloadHref(artifact.slug)}
                className={cn(buttonVariants({ variant: "outline" }), "mt-3 w-full sm:w-auto")}
              >
                {t("armedForces.download")}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
