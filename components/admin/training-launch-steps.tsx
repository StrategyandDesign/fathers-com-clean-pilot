import type { TrainingLaunchStep } from "@/lib/admin/launch";
import { cn } from "@/lib/utils";

export function TrainingLaunchSteps({
  steps,
  compact = false,
}: {
  steps: TrainingLaunchStep[];
  compact?: boolean;
}) {
  return (
    <ol className="flex flex-wrap gap-2">
      {steps.map((step, index) => (
        <li
          key={step.key}
          aria-current={step.state === "current" ? "step" : undefined}
          className={cn(
            "flex items-center gap-2 rounded-lg border text-sm",
            compact ? "px-2.5 py-1.5" : "px-3 py-2",
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
          {step.state === "locked" ? <span className="sr-only">Locked</span> : null}
        </li>
      ))}
    </ol>
  );
}
