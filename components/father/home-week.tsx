import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { HOUSE_STILL_SRC } from "@/lib/brand/house-still";
import { showHomePractice } from "@/lib/father/home";
import type { Translate } from "@/lib/i18n/translate";
import { filmRuntimeMinutes } from "@/lib/trainings/runtime";
import { homePrimaryCtaClassName } from "@/lib/ui";
import { cn } from "@/lib/utils";

const eyebrowClassName =
  "text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase sm:text-xs sm:tracking-[0.18em]";

export function HomeWeek({
  sessionTitle,
  keyline,
  durationSeconds,
  practice,
  href,
  cta,
  filmDone,
  checkpointDone,
  practiceDone,
  t,
}: {
  sessionTitle: string;
  keyline?: string | null;
  durationSeconds?: number | null;
  practice?: string | null;
  href: string;
  cta: string;
  filmDone: boolean;
  checkpointDone: boolean;
  practiceDone: boolean;
  t: Translate;
}) {
  const minutes = filmRuntimeMinutes(durationSeconds);
  const line = keyline?.trim() ?? "";
  const showPractice = showHomePractice(practice, line, sessionTitle);
  const tabs = [
    { label: t("father.home.weekFilm"), done: filmDone },
    { label: t("father.home.weekCheckpoint"), done: checkpointDone },
    { label: t("father.home.weekPractice"), done: practiceDone },
  ];

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <p className={eyebrowClassName}>{t("father.home.finishThisWeek")}</p>
      <article className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="relative aspect-video">
          {/* eslint-disable-next-line @next/next/no-img-element -- house still is a local public file */}
          <img src={HOUSE_STILL_SRC} alt="" className="absolute inset-0 size-full object-cover" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 space-y-1 p-4 text-white sm:p-5">
            <h1 className="font-heading text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
              {sessionTitle}
            </h1>
            {line ? <p className="text-sm leading-snug sm:text-base">{line}</p> : null}
          </div>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          {minutes != null ? (
            <p className="text-sm text-muted-foreground">{t("father.home.cardMeta", { n: minutes })}</p>
          ) : null}
          <Link
            href={href}
            className={cn(buttonVariants({ variant: "default", size: "lg" }), homePrimaryCtaClassName)}
          >
            {cta}
          </Link>
        </div>
      </article>
      {showPractice ? (
        <section className="space-y-2">
          <p className={eyebrowClassName}>{t("father.home.practiceEyebrow")}</p>
          <p className="text-base leading-relaxed">
            {practice?.trim() ? practice : t("father.home.practiceEmpty")}
          </p>
        </section>
      ) : null}
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
