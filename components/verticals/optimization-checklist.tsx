import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { OPTIMIZATION_CHECKLIST_ITEMS } from "@/lib/verticals/optimization/checklist";
import { OPTIMIZATION_PACK_ARTIFACTS } from "@/lib/verticals/optimization/pack";
import { verticalPackOptimization } from "@/lib/flags";
import type { Translate } from "@/lib/i18n/translate";
import { interactiveLinkClassName } from "@/lib/ui";
import { cn } from "@/lib/utils";

function downloadHref(slug: string) {
  return `/api/admin/verticals/optimization/${slug}`;
}

export function OptimizationChecklistView({ t }: { t: Translate }) {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          href="/admin/account"
          className={cn("text-sm text-muted-foreground", interactiveLinkClassName)}
        >
          {t("optimization.back")}
        </Link>
        <h1 className="font-heading mt-3 text-2xl font-semibold tracking-tight">
          {t("optimization.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("optimization.lead")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("optimization.deferral")}</p>
      </div>

      <section className="rounded-xl border border-border/70 bg-card/60 p-4 sm:p-6">
        <h2 className="font-heading text-lg font-semibold">{t("optimization.flagTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("optimization.flagBody")}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("optimization.flagLine", { state: verticalPackOptimization() ? "on" : "off" })}
        </p>
      </section>

      <section className="rounded-xl border border-border/70 bg-card/60 p-4 sm:p-6">
        <h2 className="font-heading text-lg font-semibold">{t("optimization.checklistTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("optimization.checklistLead")}</p>
        <ol className="mt-4 space-y-4">
          {OPTIMIZATION_CHECKLIST_ITEMS.map((item, index) => (
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
        <h2 className="font-heading text-lg font-semibold">{t("optimization.downloadsTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("optimization.downloadsLead")}</p>
        <ul className="mt-4 space-y-4">
          {OPTIMIZATION_PACK_ARTIFACTS.map((artifact) => (
            <li key={artifact.slug}>
              <p className="font-medium">{artifact.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{artifact.summary}</p>
              <Link
                href={downloadHref(artifact.slug)}
                className={cn(buttonVariants({ variant: "outline" }), "mt-3 w-full sm:w-auto")}
              >
                {t("optimization.download")}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
