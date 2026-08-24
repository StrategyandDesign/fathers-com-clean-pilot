import Link from "next/link";

import { setDevelopmentStatus, setTrainingPublished } from "@/lib/admin/actions";
import type { TrainingLaunchPlan } from "@/lib/admin/launch";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TrainingLaunchRowAction({ plan }: { plan: TrainingLaunchPlan }) {
  const buttonClass = "w-full md:w-auto";
  const primary = plan.kind !== "view";

  let control = (
    <Link
      href={plan.href}
      className={cn(
        buttonVariants({ variant: primary ? "default" : "outline", size: "sm" }),
        buttonClass
      )}
    >
      {plan.label}
    </Link>
  );

  if (plan.kind === "ready" && plan.enabled) {
    control = (
      <form action={setDevelopmentStatus}>
        <input type="hidden" name="training_id" value={plan.trainingId} />
        <Button
          type="submit"
          name="development_status"
          value="ready_for_review"
          size="sm"
          className={buttonClass}
        >
          {plan.label}
        </Button>
      </form>
    );
  } else if (plan.kind === "publish" && plan.enabled) {
    control = (
      <form action={setTrainingPublished}>
        <input type="hidden" name="training_id" value={plan.trainingId} />
        <input type="hidden" name="published" value="true" />
        <Button type="submit" size="sm" className={buttonClass}>
          {plan.label}
        </Button>
      </form>
    );
  }

  return (
    <div className="flex w-full flex-col items-stretch gap-1 md:items-end">
      {control}
      {plan.shortBlocker ? (
        <p className="text-xs text-muted-foreground">{plan.shortBlocker}</p>
      ) : null}
    </div>
  );
}
