import { ChevronDown } from "lucide-react";

import { setLeaderAssessmentAnswers } from "@/lib/assessments/leader-answers-actions";
import { Button } from "@/components/ui/button";
import { checkboxOptionClassName, interactiveControlClassName } from "@/lib/ui";
import { cn } from "@/lib/utils";

export function LeaderAnswersOrgCard({
  groupId,
  enabled,
  returnTo,
}: {
  groupId: string;
  enabled: boolean;
  returnTo: string;
}) {
  return (
    <details className="group overflow-hidden rounded-xl border border-border bg-card open:[&_svg]:rotate-180">
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-6",
          interactiveControlClassName,
          "[&::-webkit-details-marker]:hidden"
        )}
      >
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold">Custom assessment answers</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {enabled
              ? "leader_assessment_answers is on. Leaders can read answer bodies."
              : "leader_assessment_answers is off. Leaders see completion status only."}
          </p>
        </div>
        <ChevronDown
          aria-hidden
          className="size-5 shrink-0 text-muted-foreground transition-transform duration-150"
        />
      </summary>
      <div className="space-y-5 border-t border-border px-4 py-5 sm:px-6 sm:pb-6">
        <p className="text-sm text-muted-foreground">
          Defaults off for the rehab spine. When off, Leaders see started, finished, or
          stalled. Question text and answers stay with the father. Reviewers stay on
          cohort totals either way.
        </p>
        <form action={setLeaderAssessmentAnswers} className="space-y-3">
          <input type="hidden" name="group_id" value={groupId} />
          <input type="hidden" name="return_to" value={returnTo} />
          <label className={checkboxOptionClassName}>
            <input
              type="checkbox"
              name="leader_assessment_answers"
              defaultChecked={enabled}
              className="size-4 accent-primary"
            />
            <span>
              <span className="block font-medium">Let Leaders read custom assessment answers</span>
              <span className="block text-sm text-muted-foreground">
                On is education telemetry, not a clinical chart. Leave off unless counsel
                asks for it.
              </span>
            </span>
          </label>
          <Button type="submit" variant="outline" className="w-full sm:w-auto">
            Save answer visibility
          </Button>
        </form>
      </div>
    </details>
  );
}
