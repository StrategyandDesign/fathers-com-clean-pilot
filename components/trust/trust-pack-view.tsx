import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { TRUST_PACK_ARTIFACTS } from "@/lib/trust/pack";
import {
  TRUST_CERTIFICATION_STATUS,
  TRUST_PACK_REVIEWED_ON,
  TRUST_PACK_VERSION,
  TRUST_PILOT_PASSWORD_STATUS,
  TRUST_ROADMAP_STATUS,
} from "@/lib/trust/questionnaire";
import type { Translate } from "@/lib/i18n/translate";
import { interactiveLinkClassName } from "@/lib/ui";
import { cn } from "@/lib/utils";

function downloadHref(slug: string) {
  return `/api/trust/pack/${slug}`;
}

export function TrustPackView({ t }: { t: Translate }) {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          href="/admin/account"
          className={cn("text-sm text-muted-foreground", interactiveLinkClassName)}
        >
          {t("trust.packBack")}
        </Link>
        <h1 className="font-heading mt-3 text-2xl font-semibold tracking-tight">
          {t("trust.packTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("trust.packLead")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("trust.packInternalNote")}</p>
      </div>

      <section className="rounded-xl border border-border/70 bg-card/60 p-4 sm:p-6">
        <p className="text-sm text-muted-foreground">
          {t("trust.packVersionLabel")}: {TRUST_PACK_VERSION}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("trust.packReviewedLabel")}: {TRUST_PACK_REVIEWED_ON}
        </p>
      </section>

      <section className="rounded-xl border border-border/70 bg-card/60 p-4 sm:p-6">
        <h2 className="font-heading text-lg font-semibold">{t("trust.packCertTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{TRUST_CERTIFICATION_STATUS}</p>
      </section>

      <section className="rounded-xl border border-border/70 bg-card/60 p-4 sm:p-6">
        <h2 className="font-heading text-lg font-semibold">{t("trust.packPilotTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{TRUST_PILOT_PASSWORD_STATUS}</p>
      </section>

      <section className="rounded-xl border border-border/70 bg-card/60 p-4 sm:p-6">
        <h2 className="font-heading text-lg font-semibold">{t("trust.packRoadmapTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{TRUST_ROADMAP_STATUS}</p>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="font-heading text-lg font-semibold">{t("trust.packDownloadsTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("trust.packDownloadsLead")}</p>
        <ul className="mt-4 space-y-4">
          {TRUST_PACK_ARTIFACTS.map((artifact) => (
            <li key={artifact.slug}>
              <p className="font-medium">{artifact.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{artifact.summary}</p>
              <Link
                href={downloadHref(artifact.slug)}
                className={cn(buttonVariants({ variant: "outline" }), "mt-3 w-full sm:w-auto")}
              >
                {t("trust.packDownload")}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
