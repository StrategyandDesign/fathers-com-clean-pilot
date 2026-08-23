import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { Translate } from "@/lib/i18n/translate";
import { cn } from "@/lib/utils";

export function FidelityDeskCard({ t }: { t: Translate }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <h2 className="font-heading text-lg font-semibold">{t("fidelity.deskTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("fidelity.deskLead")}</p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link href="/manager/fidelity" className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}>
          {t("fidelity.openBoard")}
        </Link>
        <Link
          href="/manager/team/facilitators"
          className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
        >
          {t("fidelity.openRegistry")}
        </Link>
      </div>
    </section>
  );
}
