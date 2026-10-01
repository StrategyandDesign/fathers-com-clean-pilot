import Link from "next/link";

import { FilmRuntime } from "@/components/father/film-runtime";
import { buttonVariants } from "@/components/ui/button";
import type { Translate } from "@/lib/i18n/translate";
import { homePrimaryCtaClassName } from "@/lib/ui";
import { cn } from "@/lib/utils";

const eyebrowClassName =
  "text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase sm:text-xs sm:tracking-[0.18em]";

export function HomeWeek({
  sessionTitle,
  keyline,
  practice,
  durationSeconds,
  href,
  cta,
  filmDone,
  checkpointDone,
  practiceDone,
  t,
}: {
  sessionTitle: string;
  keyline?: string | null;
  practice?: string | null;
  durationSeconds?: number | null;
  href: string;
  cta: string;
  filmDone: boolean;
  checkpointDone: boolean;
  practiceDone: boolean;
  t: Translate;
}) {
  const tabs = [
    { label: t("father.home.weekFilm"), done: filmDone },
    { label: t("father.home.weekCheckpoint"), done: checkpointDone },
    { label: t("father.home.weekPractice"), done: practiceDone },
  ];

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <p className={eyebrowClassName}>{t("father.home.finishThisWeek")}</p>
      <h1 className="font-heading text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
        {sessionTitle}
      </h1>
      <section className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
        <p className={eyebrowClassName}>{t("father.home.weekFilm")}</p>
        {keyline ? <p className="text-base leading-relaxed">{keyline}</p> : null}
        <FilmRuntime seconds={durationSeconds} t={t} />
        <Link
          href={href}
          className={cn(buttonVariants({ variant: "default", size: "lg" }), homePrimaryCtaClassName)}
        >
          {cta}
        </Link>
      </section>
      <section className="space-y-2">
        <p className={eyebrowClassName}>{t("father.home.practiceEyebrow")}</p>
        <p className="text-base leading-relaxed">
          {practice?.trim() ? practice : t("father.home.practiceEmpty")}
        </p>
      </section>
      <div className="grid grid-cols-3 overflow-hidden rounded-lg bg-foreground text-background">
        {tabs.map((tab) => (
          <div key={tab.label} className="px-2 py-3 text-center">
            <p className="text-[11px] font-medium tracking-wide uppercase">{tab.label}</p>
            <p className="mt-1 text-sm font-semibold">{tab.done ? t("father.home.markYes") : t("father.home.markNo")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
