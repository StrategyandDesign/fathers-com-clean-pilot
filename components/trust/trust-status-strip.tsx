import Link from "next/link";

import {
  trustStatusLines,
  type TrustStatusView,
} from "@/lib/trust/status";
import type { Translate } from "@/lib/i18n/translate";
import { interactiveLinkClassName } from "@/lib/ui";
import { cn } from "@/lib/utils";

export function TrustStatusStrip({
  model,
  t,
  headingKey = "trust.title",
}: {
  model: TrustStatusView;
  t: Translate;
  headingKey?: "trust.title" | "trust.orgTitle";
}) {
  const lines = trustStatusLines(model, t);

  return (
    <section className="space-y-1.5 border-y border-border/60 py-4 text-sm text-muted-foreground">
      <h2 className="font-heading text-sm font-medium text-muted-foreground">{t(headingKey)}</h2>
      <p>{t("trust.lead")}</p>
      {lines.map((line) => (
        <p key={line.key} data-trust-line={line.key}>
          <span>{line.label}: </span>
          <span>{line.value}</span>
          {line.note ? <span> {line.note}</span> : null}
          {line.href && line.linkLabel ? (
            <>
              {" "}
              <Link
                href={line.href}
                className={cn(
                  "text-muted-foreground underline underline-offset-4 hover:text-foreground",
                  interactiveLinkClassName
                )}
              >
                {line.linkLabel}
              </Link>
            </>
          ) : null}
        </p>
      ))}
    </section>
  );
}
