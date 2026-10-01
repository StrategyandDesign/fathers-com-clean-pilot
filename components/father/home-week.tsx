import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { youtubeStillUrl } from "@/lib/father/types";
import type { Translate } from "@/lib/i18n/translate";
import { homePrimaryCtaClassName } from "@/lib/ui";
import { cn } from "@/lib/utils";

const eyebrowClassName =
  "text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase sm:text-xs sm:tracking-[0.18em]";

export function HomeWeek({
  sessionTitle,
  videoUrl,
  practice,
  href,
  cta,
  filmDone,
  checkpointDone,
  practiceDone,
  t,
}: {
  sessionTitle: string;
  videoUrl?: string | null;
  practice?: string | null;
  href: string;
  cta: string;
  filmDone: boolean;
  checkpointDone: boolean;
  practiceDone: boolean;
  t: Translate;
}) {
  const still = youtubeStillUrl(videoUrl);
  const tabs = [
    { label: t("father.home.weekFilm"), done: filmDone },
    { label: t("father.home.weekCheckpoint"), done: checkpointDone },
    { label: t("father.home.weekPractice"), done: practiceDone },
  ];

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <p className={eyebrowClassName}>{t("father.home.finishThisWeek")}</p>
      <article className="overflow-hidden rounded-xl border border-border bg-card">
        {still ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={still} alt="" className="aspect-video w-full object-cover" />
        ) : (
          <div className="aspect-video w-full bg-foreground" />
        )}
        <div className="space-y-4 p-4 sm:p-5">
          <h1 className="font-heading text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
            {sessionTitle}
          </h1>
          <Link
            href={href}
            className={cn(buttonVariants({ variant: "default", size: "lg" }), homePrimaryCtaClassName)}
          >
            {cta}
          </Link>
        </div>
      </article>
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
