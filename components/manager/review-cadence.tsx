import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { Translate } from "@/lib/i18n/translate";
import type { CompanionBriefing, ReviewCadence } from "@/lib/manager/companion";
import { interactiveSurfaceClassName } from "@/lib/ui";
import { cn } from "@/lib/utils";

export function ReviewCadenceStrip({
  cadence,
  readyCertificates,
  t,
}: {
  cadence: ReviewCadence;
  readyCertificates: CompanionBriefing["readyCertificates"];
  t: Translate;
}) {
  const counts = [
    {
      href: "#open-items",
      label: t("manager.dashboard.cadenceOpen"),
      value: cadence.openItems,
    },
    {
      href: "#pending-actions",
      label: t("manager.dashboard.cadencePending"),
      value: cadence.pendingActions,
    },
    {
      href: "#certificates-ready",
      label: t("manager.dashboard.cadenceCertificates"),
      value: cadence.certificatesReady,
    },
  ];

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <h2 className="font-heading text-lg font-semibold">{t("manager.dashboard.cadenceTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("manager.dashboard.cadenceLead")}</p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {counts.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "block rounded-lg border border-border bg-black/30 p-4",
                interactiveSurfaceClassName
              )}
            >
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">{item.value}</p>
            </Link>
          </li>
        ))}
      </ul>
      {readyCertificates.length > 0 ? (
        <ul
          id="certificates-ready"
          className="mt-5 divide-y divide-border overflow-hidden rounded-lg border border-border"
        >
          {readyCertificates.slice(0, 3).map((item) => (
            <li key={`${item.fatherId}-${item.title}`}>
              <Link
                href={`/manager/participants/${item.fatherId}/certificates/${item.trainingId}`}
                className={cn(
                  "flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
                  interactiveSurfaceClassName
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{item.name}</span>
                  <span className="block text-sm text-muted-foreground">{item.title}</span>
                </span>
                <span
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "pointer-events-none w-full sm:w-auto"
                  )}
                >
                  {t("manager.companion.issueCerts")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p id="certificates-ready" className="sr-only">
          {t("manager.dashboard.cadenceCertificates")}
        </p>
      )}
    </section>
  );
}
