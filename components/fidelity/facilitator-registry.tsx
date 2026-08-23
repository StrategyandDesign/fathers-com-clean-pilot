import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { saveFacilitatorCredential } from "@/lib/fidelity/actions";
import {
  FACILITATOR_CREDENTIAL_STATUSES,
  FACILITATOR_EVIDENCE_MAX,
  FACILITATOR_STATUS_LABEL_KEY,
} from "@/lib/fidelity/credentials";
import type { FacilitatorRegistryRow } from "@/lib/fidelity/data";
import type { Translate } from "@/lib/i18n/translate";
import { formatShortDate } from "@/lib/manager/types";
import { fieldClassName, interactiveLinkClassName } from "@/lib/ui";
import { cn } from "@/lib/utils";

function earnedInputValue(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export function FacilitatorRegistryView({
  rows,
  t,
}: {
  rows: FacilitatorRegistryRow[];
  t: Translate;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/manager/account" className={cn("text-sm text-muted-foreground", interactiveLinkClassName)}>
            {t("fidelity.backAccount")}
          </Link>
          <h1 className="font-heading mt-3 text-2xl font-semibold tracking-tight">
            {t("fidelity.registryTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("fidelity.registryLead")}</p>
        </div>
        <Link
          href="/api/manager/facilitators/export"
          className={cn(buttonVariants({ variant: "outline" }), "w-full shrink-0 sm:w-auto")}
        >
          {t("fidelity.downloadRegistry")}
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState title={t("fidelity.registryEmptyTitle")}>{t("fidelity.registryEmptyBody")}</EmptyState>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => (
            <li
              key={`${row.orgId}:${row.userId}`}
              className="rounded-xl border border-border bg-card p-4 sm:p-6"
            >
              <p className="font-heading text-lg font-semibold">{row.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{row.orgName}</p>
              {row.attestedByName ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("fidelity.attestedBy", {
                    name: row.attestedByName,
                    date: formatShortDate(row.earnedAt),
                  })}
                </p>
              ) : null}
              <form action={saveFacilitatorCredential} className="mt-5 space-y-4">
                <input type="hidden" name="org_id" value={row.orgId} />
                <input type="hidden" name="user_id" value={row.userId} />
                <input type="hidden" name="return_to" value="/manager/team/facilitators" />
                <label className="block space-y-2">
                  <span className="text-sm text-muted-foreground">{t("fidelity.credentialStatus")}</span>
                  <select
                    className={fieldClassName}
                    name="status"
                    defaultValue={row.status || "training"}
                  >
                    {FACILITATOR_CREDENTIAL_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {t(FACILITATOR_STATUS_LABEL_KEY[status])}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm text-muted-foreground">{t("fidelity.earnedOn")}</span>
                  <input
                    className={fieldClassName}
                    type="date"
                    name="earned_at"
                    defaultValue={earnedInputValue(row.earnedAt)}
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm text-muted-foreground">{t("fidelity.evidence")}</span>
                  <input
                    className={fieldClassName}
                    name="evidence_path"
                    defaultValue={row.evidencePath}
                    maxLength={FACILITATOR_EVIDENCE_MAX}
                    placeholder={t("fidelity.evidenceHint")}
                  />
                </label>
                <Button type="submit" className="w-full sm:w-auto">
                  {t("fidelity.saveAttestation")}
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
