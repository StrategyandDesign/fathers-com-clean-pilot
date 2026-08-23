import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { Translate } from "@/lib/i18n/translate";
import type { CompanionBriefing, PendingActionItem, ReviewCadence } from "@/lib/manager/companion";
import { interactiveSurfaceClassName } from "@/lib/ui";
import { cn } from "@/lib/utils";

export function ReviewCadenceStrip({
  cadence,
  pendingItems,
  readyCertificates,
  t,
}: {
  cadence: ReviewCadence;
  pendingItems: PendingActionItem[];
  readyCertificates: CompanionBriefing["readyCertificates"];
  t: Translate;
}) {
  const counts = [
    {
      href: "#open-items",
      label: t("manager.dashboard.cadenceOpen"),
      hint: t("manager.dashboard.cadenceOpenHint"),
      value: cadence.openItems,
    },
    {
      href: "#pending-actions",
      label: t("manager.dashboard.cadencePending"),
      hint: t("manager.dashboard.cadencePendingHint"),
      value: cadence.pendingActions,
    },
    {
      href: "#certificates-ready",
      label: t("manager.dashboard.cadenceCertificates"),
      hint: t("manager.dashboard.cadenceCertificatesHint"),
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
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.hint}</p>
            </Link>
          </li>
        ))}
      </ul>
      <div id="pending-actions" className="mt-5 scroll-mt-24">
        <h3 className="text-sm font-semibold">{t("manager.dashboard.pendingWaiting")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("manager.dashboard.pendingWaitingLead")}</p>
        {pendingItems.length > 0 ? (
          <ul className="mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border">
            {pendingItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
                    interactiveSurfaceClassName
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{item.title}</span>
                    <span className="block text-sm text-muted-foreground">{item.detail}</span>
                  </span>
                  <span
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "pointer-events-none w-full sm:w-auto"
                    )}
                  >
                    {item.kind === "certificate"
                      ? t("manager.dashboard.pendingCert")
                      : t("manager.dashboard.pendingReview")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
            {t("manager.dashboard.pendingEmpty")}
          </p>
        )}
      </div>
      {readyCertificates.length > 0 ? (
        <ul
          id="certificates-ready"
          className="mt-5 scroll-mt-24 divide-y divide-border overflow-hidden rounded-lg border border-border"
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
