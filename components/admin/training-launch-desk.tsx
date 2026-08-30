import Link from "next/link";

import { markTrainingPreviewed, releaseTraining, setDevelopmentStatus, setTrainingPublished } from "@/lib/admin/actions";
import {
  TRAINING_LAUNCH_HANDOFF,
  TRAINING_LAUNCH_LIST_LEAD,
  launchNowLabel,
  stageContinueLabel,
  trainingLaunchPlan,
  type TrainingLaunchInput,
} from "@/lib/admin/launch";
import { isLegacyCatalogTraining, RELEASE_CONFIRM } from "@/lib/admin/release";
import { stagePaths } from "@/lib/admin/stage";
import type { AdminTrainingRow } from "@/lib/admin/types";
import { hasHardcodedSkillPack } from "@/lib/father/session-questions";
import { hasTrainingOverview } from "@/lib/father/training-door";
import { ReleaseTargets } from "@/components/admin/release-targets";
import { TrainingLaunchCollapse } from "@/components/admin/training-launch-collapse";
import { TrainingLaunchSteps } from "@/components/admin/training-launch-steps";
import { Button, buttonVariants } from "@/components/ui/button";
import { fieldClassName } from "@/lib/ui";
import { cn } from "@/lib/utils";

function launchOptions(training: AdminTrainingRow, rightsBlocker?: string | null) {
  return {
    sessionHasHardcoded: (session: TrainingLaunchInput["sessions"][number]) =>
      hasHardcodedSkillPack(session, training),
    rightsBlocker,
  };
}

function walkHrefFor(training: AdminTrainingRow) {
  const paths = stagePaths(training.id);
  if (hasTrainingOverview(training)) return paths.overview;
  if (training.sessions[0]) return paths.session(training.sessions[0].id);
  return paths.edit;
}

export function TrainingLaunchDesk({
  training,
  rightsBlocker,
  surface = "detail",
}: {
  training: AdminTrainingRow;
  rightsBlocker?: string | null;
  surface?: "detail" | "stage";
}) {
  const plan = trainingLaunchPlan(training, launchOptions(training, rightsBlocker));
  const showReleaseForm = surface === "detail" && plan.kind === "release" && plan.enabled;
  const legacy = isLegacyCatalogTraining(training);
  const editHref = `/admin/trainings/${training.id}`;
  const walkHref = walkHrefFor(training);
  const nowLabel = launchNowLabel(plan.current);

  return (
    <TrainingLaunchCollapse
      trainingId={training.id}
      surface={surface}
      title={surface === "stage" ? "Next step" : "Launch"}
      nowLabel={nowLabel}
    >
      <div>
        <p className="text-sm text-muted-foreground">{TRAINING_LAUNCH_HANDOFF}</p>
        <p className="mt-2 font-medium">{nowLabel}</p>
      </div>

      <TrainingLaunchSteps steps={plan.steps} />

      {plan.blocker ? <p className="text-sm text-foreground">{plan.blocker}</p> : null}

      {plan.current === "done" ? (
        <p className="text-sm text-muted-foreground">
          Released to organizations. Leaders accept, then Include or assign fathers.{" "}
          <Link href={`${plan.href}`} className="underline underline-offset-4">
            See organizations
          </Link>
          .
        </p>
      ) : plan.archived ? (
        <Link
          href={plan.href}
          className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
        >
          {plan.detailLabel}
        </Link>
      ) : surface === "stage" && plan.current === "stage" && training.sessions.length === 0 ? (
        <Link href={editHref} className={cn(buttonVariants(), "w-full sm:w-auto")}>
          Add a session
        </Link>
      ) : surface === "stage" && plan.current === "stage" ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link href={walkHref} className={cn(buttonVariants(), "w-full sm:w-auto")}>
            Walk as Father
          </Link>
          <form action={markTrainingPreviewed}>
            <input type="hidden" name="training_id" value={training.id} />
            <Button type="submit" variant="outline" className="w-full sm:w-auto">
              Mark Stage walk complete
            </Button>
          </form>
        </div>
      ) : surface === "stage" ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href={`/admin/trainings/${training.id}#launch`}
            className={cn(buttonVariants(), "w-full sm:w-auto")}
          >
            {stageContinueLabel(plan.current)}
          </Link>
          <Link
            href={editHref}
            className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
          >
            Edit training
          </Link>
        </div>
      ) : plan.kind === "fix" && plan.current === "stage" ? (
        <Link href={plan.stageHref} className={cn(buttonVariants(), "w-full sm:w-auto")}>
          {plan.detailLabel}
        </Link>
      ) : plan.kind === "fix" ? (
        <Link href={plan.href} className={cn(buttonVariants(), "w-full sm:w-auto")}>
          {plan.detailLabel}
        </Link>
      ) : plan.kind === "ready" ? (
        <form action={setDevelopmentStatus}>
          <input type="hidden" name="training_id" value={training.id} />
          <Button
            type="submit"
            name="development_status"
            value="ready_for_review"
            className="w-full sm:w-auto"
            disabled={!plan.enabled}
          >
            {plan.detailLabel}
          </Button>
        </form>
      ) : plan.kind === "publish" ? (
        <form action={setTrainingPublished}>
          <input type="hidden" name="training_id" value={training.id} />
          <input type="hidden" name="published" value="true" />
          <Button type="submit" className="w-full sm:w-auto" disabled={!plan.enabled}>
            {plan.detailLabel}
          </Button>
        </form>
      ) : showReleaseForm ? (
        <form action={releaseTraining} className="space-y-4">
          <input type="hidden" name="training_id" value={training.id} />
          <ReleaseTargets organizations={training.releaseTargets} defaultScope="all" />
          {legacy ? (
            <label className="block space-y-2">
              <span className="text-sm text-muted-foreground">
                Type <span className="font-medium text-foreground">{RELEASE_CONFIRM}</span> to
                confirm
              </span>
              <input className={fieldClassName} name="confirm" autoComplete="off" required />
            </label>
          ) : null}
          <Button type="submit" className="w-full sm:w-auto">
            {plan.detailLabel}
          </Button>
        </form>
      ) : plan.enabled ? (
        <a href="#release" className={cn(buttonVariants(), "w-full sm:w-auto")}>
          {plan.detailLabel}
        </a>
      ) : (
        <Button type="button" className="w-full sm:w-auto" disabled>
          {plan.detailLabel}
        </Button>
      )}
    </TrainingLaunchCollapse>
  );
}

export function TrainingLaunchWalkCue({
  training,
}: {
  training: AdminTrainingRow;
}) {
  const plan = trainingLaunchPlan(training, launchOptions(training));
  const editHref = `/admin/trainings/${training.id}`;

  return (
    <section className="space-y-3 rounded-xl border border-primary/40 bg-card p-4">
      <div>
        <h2 className="font-heading text-base font-semibold">Launch</h2>
        <p className="mt-1 text-sm text-muted-foreground">{TRAINING_LAUNCH_LIST_LEAD}</p>
        <p className="mt-2 text-sm font-medium">{launchNowLabel(plan.current)}</p>
      </div>
      <TrainingLaunchSteps steps={plan.steps} compact />
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {plan.current === "stage" ? (
          <form action={markTrainingPreviewed}>
            <input type="hidden" name="training_id" value={training.id} />
            <Button type="submit" className="w-full sm:w-auto">
              Mark Stage walk complete
            </Button>
          </form>
        ) : (
          <Link
            href={`${editHref}#launch`}
            className={cn(buttonVariants(), "w-full sm:w-auto")}
          >
            {stageContinueLabel(plan.current)}
          </Link>
        )}
        <Link
          href={editHref}
          className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
        >
          Edit training
        </Link>
      </div>
    </section>
  );
}
