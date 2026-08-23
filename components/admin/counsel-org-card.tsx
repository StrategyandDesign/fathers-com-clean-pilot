import { ChevronDown } from "lucide-react";

import {
  clearCounselPackAttached,
  markCounselPackAttached,
  setCounselPackRequired,
} from "@/lib/counsel/actions";
import type { CounselPackState } from "@/lib/counsel/pack";
import { Button } from "@/components/ui/button";
import { formatShortDate } from "@/lib/manager/types";
import { checkboxOptionClassName, interactiveControlClassName } from "@/lib/ui";
import { cn } from "@/lib/utils";

export function CounselOrgCard({
  state,
  returnTo,
}: {
  state: CounselPackState;
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
          <h2 className="font-heading text-lg font-semibold">Counsel pack</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {state.required
              ? state.attachedAt
                ? `Requirement on. Attached mark recorded ${formatShortDate(state.attachedAt)}.`
                : "Requirement on. Checklist waits for an attached mark."
              : "Requirement off. Leaders can still download drafts."}
          </p>
        </div>
        <ChevronDown
          aria-hidden
          className="size-5 shrink-0 text-muted-foreground transition-transform duration-150"
        />
      </summary>
      <div className="space-y-5 border-t border-border px-4 py-5 sm:px-6 sm:pb-6">
        <p className="text-sm text-muted-foreground">
          counsel_pack_required defaults off. Turning it on shows a checklist on Account
          counsel until you record that counsel attached executed copies outside this
          product. That mark is metadata only. It is not a signature and it does not
          execute the drafts.
        </p>
        <form action={setCounselPackRequired} className="space-y-3">
          <input type="hidden" name="group_id" value={state.groupId} />
          <input type="hidden" name="return_to" value={returnTo} />
          <label className={checkboxOptionClassName}>
            <input
              type="checkbox"
              name="counsel_pack_required"
              defaultChecked={state.required}
              className="size-4 accent-primary"
            />
            <span>
              <span className="block font-medium">Require the counsel pack checklist</span>
              <span className="block text-sm text-muted-foreground">
                Off leaves the downloads available without a requirement checklist.
              </span>
            </span>
          </label>
          <Button type="submit" variant="outline" className="w-full sm:w-auto">
            Save counsel requirement
          </Button>
        </form>

        {state.attachedAt ? (
          <form action={clearCounselPackAttached} className="space-y-3">
            <input type="hidden" name="group_id" value={state.groupId} />
            <input type="hidden" name="return_to" value={returnTo} />
            <p className="text-sm text-muted-foreground">
              Super-admin recorded an attached mark on {formatShortDate(state.attachedAt)}.
              The in-product files remain drafts.
            </p>
            <Button type="submit" variant="outline" className="w-full sm:w-auto">
              Clear attached mark
            </Button>
          </form>
        ) : (
          <form action={markCounselPackAttached} className="space-y-3">
            <input type="hidden" name="group_id" value={state.groupId} />
            <input type="hidden" name="return_to" value={returnTo} />
            <p className="text-sm text-muted-foreground">
              Record that counsel provided executed copies outside this product. Do not
              treat this as signing the drafts below.
            </p>
            <Button type="submit" variant="outline" className="w-full sm:w-auto">
              Mark counsel pack attached
            </Button>
          </form>
        )}
      </div>
    </details>
  );
}
