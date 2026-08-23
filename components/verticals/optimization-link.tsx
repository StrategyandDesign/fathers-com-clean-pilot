import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { getI18n } from "@/lib/i18n/server";
import { interactiveControlClassName } from "@/lib/ui";
import { cn } from "@/lib/utils";

export async function OptimizationAdminLink() {
  const { t } = await getI18n();

  return (
    <details className="group rounded-xl border border-border/70 bg-card/60 open:[&_svg]:rotate-180">
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 sm:px-5",
          interactiveControlClassName,
          "[&::-webkit-details-marker]:hidden"
        )}
      >
        <span className="min-w-0 text-sm text-muted-foreground">{t("optimization.summary")}</span>
        <ChevronDown
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground/70 transition-transform duration-150"
        />
      </summary>
      <div className="space-y-3 border-t border-border/70 px-4 py-4 sm:px-5">
        <p className="text-sm text-muted-foreground">{t("optimization.accountLead")}</p>
        <Link
          href="/admin/verticals/optimization"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          {t("optimization.open")}
        </Link>
      </div>
    </details>
  );
}
