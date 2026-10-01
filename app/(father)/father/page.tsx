import { HomeWeek } from "@/components/father/home-week";
import { homePracticeCue } from "@/lib/father/home";
import { Flash } from "@/components/manager/flash";
import { requireRole } from "@/lib/auth/session";
import { loadFatherHome } from "@/lib/father/data";
import { hasStartedTrainingWork, hasTrainingOverview, trainingContinueHref } from "@/lib/father/training-door";
import { getI18n } from "@/lib/i18n/server";
import { loadFatherParticipationMode } from "@/lib/participation-data";
import { participationCopyKey } from "@/lib/participation";

export default async function FatherHomePage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; error?: string; notice?: string }>;
}) {
  const { error, notice } = await searchParams;
  const { user } = await requireRole("father");
  const { t } = await getI18n();
  const [{ pathCards, next }, participationMode] = await Promise.all([
    loadFatherHome(user.id),
    loadFatherParticipationMode(user.id),
  ]);

  const nextCard = next
    ? pathCards.find((card) => card.training.id === next.training.id)
    : undefined;
  const nextCompleted = nextCard?.completed ?? 0;
  const started = hasStartedTrainingWork(nextCompleted, next?.progress, nextCard?.sessionDots);
  const continueSession = Boolean(
    next?.progress?.film_completed ||
      next?.progress?.checkin_completed ||
      next?.progress?.action_completed ||
      next?.progress?.status === "in_progress"
  );
  const startWithOverview = Boolean(
    next && hasTrainingOverview(next.training) && !started
  );

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      {error || notice ? <Flash error={error} notice={notice} /> : null}
      {next ? (
        <HomeWeek
          sessionTitle={next.session.title}
          keyline={next.session.keyline}
          durationSeconds={next.session.duration_seconds}
          practice={homePracticeCue(next.session)}
          href={trainingContinueHref({
            training: next.training,
            next: next.session,
            nextProgress: next.progress,
            completed: nextCompleted,
            sessionDots: nextCard?.sessionDots,
          })}
          cta={
            startWithOverview
              ? t("father.trainings.watchOverview")
              : continueSession
                ? t("father.home.continueSession")
                : t("father.home.start")
          }
          filmDone={Boolean(next.progress?.film_completed)}
          checkpointDone={Boolean(next.progress?.checkin_completed)}
          practiceDone={Boolean(next.progress?.action_completed)}
          t={t}
        />
      ) : (
        <section className="space-y-3">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {t("father.home.finishThisWeek")}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            {pathCards.length === 0
              ? t(participationCopyKey(participationMode, "father.home.nothingAssignedBody"))
              : t("father.home.doneForNowBody")}
          </p>
        </section>
      )}
    </div>
  );
}
