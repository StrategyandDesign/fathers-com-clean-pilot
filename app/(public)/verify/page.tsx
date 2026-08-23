import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CertificateDisclaimer } from "@/components/certificates/disclaimer";
import { CertificateVerifyForm } from "@/components/certificates/verify-form";
import { certificateVerifyPath, parseVerifySerial } from "@/lib/certificates/copy";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("verify.metaTitle"),
    description: t("verify.metaDescription"),
  };
}

export default async function VerifyIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ serial?: string }>;
}) {
  const params = await searchParams;
  const serial = parseVerifySerial(params.serial);
  if (serial) {
    redirect(certificateVerifyPath(serial));
  }

  const { t } = await getI18n();

  return (
    <article className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
          {t("verify.eyebrow")}
        </p>
        <h1 className="font-heading mt-2 text-2xl font-semibold tracking-tight">
          {t("verify.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("verify.lead")}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <CertificateVerifyForm
          serial={typeof params.serial === "string" ? params.serial : ""}
          label={t("verify.serialLabel")}
          placeholder={t("verify.serialPlaceholder")}
          submit={t("verify.submit")}
        />
      </div>

      <CertificateDisclaimer>{t("verify.disclaimer")}</CertificateDisclaimer>
    </article>
  );
}
