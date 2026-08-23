import type { Metadata } from "next";
import Link from "next/link";

import { CertificateDisclaimer } from "@/components/certificates/disclaimer";
import { CertificateVerifyForm } from "@/components/certificates/verify-form";
import { buttonVariants } from "@/components/ui/button";
import { parseVerifySerial } from "@/lib/certificates/copy";
import { lookupPublicCertificate } from "@/lib/certificates/verify";
import { getI18n } from "@/lib/i18n/server";
import { allowActionRateLimit } from "@/lib/security/rate-limit";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ serial: string }>;
}): Promise<Metadata> {
  const { t } = await getI18n();
  const { serial } = await params;
  const parsed = parseVerifySerial(serial);
  return {
    title: parsed ? t("verify.metaTitleSerial", { serial: parsed }) : t("verify.metaTitle"),
    description: t("verify.metaDescription"),
  };
}

export default async function VerifySerialPage({
  params,
}: {
  params: Promise<{ serial: string }>;
}) {
  const { serial: serialParam } = await params;
  const { t } = await getI18n();
  const serial = parseVerifySerial(serialParam);
  const allowed = await allowActionRateLimit("certificates.verify");

  if (!allowed) {
    return (
      <article className="space-y-6">
        <div>
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
            {t("verify.eyebrow")}
          </p>
          <h1 className="font-heading mt-2 text-2xl font-semibold tracking-tight">
            {t("verify.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("verify.rateLimited")}</p>
        </div>
        <CertificateDisclaimer>{t("verify.disclaimer")}</CertificateDisclaimer>
      </article>
    );
  }

  const record = serial ? await lookupPublicCertificate(serial) : null;

  return (
    <article className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
          {t("verify.eyebrow")}
        </p>
        <h1 className="font-heading mt-2 text-2xl font-semibold tracking-tight">
          {record ? t("verify.foundTitle") : t("verify.missingTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {record ? t("verify.foundLead") : t("verify.missingLead")}
        </p>
      </div>

      {record ? (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <dl className="space-y-3 text-sm">
            <VerifyField label={t("verify.serialLabel")} value={record.serialNumber} mono />
            {record.recipientName ? (
              <VerifyField label={t("verify.recipient")} value={record.recipientName} />
            ) : null}
            <VerifyField label={t("verify.training")} value={record.trainingTitle} />
            {record.completedOn ? (
              <VerifyField label={t("verify.completed")} value={record.completedOn} />
            ) : null}
            {record.issuerName ? (
              <VerifyField label={t("verify.issuedBy")} value={record.issuerName} />
            ) : null}
          </dl>
        </div>
      ) : (
        <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          {serial
            ? t("verify.missingHint", { serial })
            : t("verify.invalidHint")}
        </p>
      )}

      <CertificateDisclaimer>{t("verify.disclaimer")}</CertificateDisclaimer>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <p className="text-sm text-muted-foreground">{t("verify.another")}</p>
        <div className="mt-3">
          <CertificateVerifyForm
            serial={serial || decodeURIComponent(serialParam)}
            label={t("verify.serialLabel")}
            placeholder={t("verify.serialPlaceholder")}
            submit={t("verify.submit")}
          />
        </div>
      </div>

      <Link href="/verify" className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}>
        {t("verify.back")}
      </Link>
    </article>
  );
}

function VerifyField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs tracking-[0.12em] text-muted-foreground uppercase">{label}</dt>
      <dd className={mono ? "mt-1 font-mono text-sm" : "mt-1"}>{value}</dd>
    </div>
  );
}
