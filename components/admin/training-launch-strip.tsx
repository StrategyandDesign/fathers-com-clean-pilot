import Link from "next/link";

import { releaseTraining, setDevelopmentStatus, setTrainingPublished } from "@/lib/admin/actions";
import { trainingLaunchPlan } from "@/lib/admin/launch";
import { isLegacyCatalogTraining, RELEASE_CONFIRM } from "@/lib/admin/release";
import type { AdminTrainingRow } from "@/lib/admin/types";
import { hasHardcodedSkillPack } from "@/lib/father/session-questions";
import { ReleaseTargets } from "@/components/admin/release-targets";
import { Button, buttonVariants } from "@/components/ui/button";
import { fieldClassName } from "@/lib/ui";
import { cn } from "@/lib/utils";

export function TrainingLaunchStrip({
  training,
  rightsBlocker,
}: {
  training: AdminTrainingRow;
  rightsBlocker?: string | null;
}) {
  const plan = trainingLaunchPlan(training, {
    sessionHasHardcoded: (session) => hasHardcodedSkillPack(session, training),
    rightsBlocker,
  });
  const sticky = plan.current !== "release";
  const showReleaseForm = plan.kind === "release" && plan.enabled;
  const legacy = isLegacyCatalogTraining(training);

  return (
    <section
      id="launch"
      className={cn(
        "scroll-mt-[calc(4.5rem+env(safe-area-inset-top))] space-y-4 rounded-xl border border-primary/40 bg-card p-4 sm:p-6",
        sticky &&
          "sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 bg-card/95 shadow-lg backdrop-blur-md"
      )}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold">Launch</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Stage, then Ready, then Publish, then Release. Publish does not
            notify Leaders. Release does.
          </p>
        </div>
      </div>

      <ol className="flex flex-wrap gap-2">
        {plan.steps.map((step, index) => (
          <li
            key={step.key}
            aria-current={step.state === "current" ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
              step.state === "done" && "border-primary/40 text-primary",
              step.state === "current" && "border-primary bg-primary/10 text-foreground",
              step.state === "locked" && "border-border text-muted-foreground"
            )}
          >
            <span className="tabular-nums">{index + 1}</span>
            <span>{step.label}</span>
            {step.state === "done" ? <span>Done</span> : null}
            {step.state === "current" ? (
              <span className="sr-only">Current step</span>
            ) : null}
            {step.state === "locked" ? (
              <span className="sr-only">Locked</span>
            ) : null}
          </li>
        ))}
      </ol>

      {plan.blocker ? <p className="text-sm text-foreground">{plan.blocker}</p> : null}

      {plan.current === "done" ? (
        <p className="text-sm text-muted-foreground">
          Released to organizations.{" "}
          <a href="#release" className="underline underline-offset-4">
            See organizations
          </a>
          .
        </p>
      ) : plan.archived ? (
        <a
          href="#development"
          className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
        >
          Recover on the development desk
        </a>
      ) : plan.kind === "stage" ? (
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
    </section>
  );
}
