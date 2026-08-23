import type { PracticeLight } from "@/lib/father/skill-use";
import { cn } from "@/lib/utils";

export type ProgressLightTone = "done" | "pending" | PracticeLight;

const TONE_CLASS: Record<ProgressLightTone, string> = {
  done: "bg-primary",
  pending: "bg-white/20",
  completed: "bg-primary",
  not_yet: "bg-amber-400/80",
  dismissed: "bg-white/35",
  stale: "bg-orange-500/80",
};

export function progressLightTone(status: PracticeLight): ProgressLightTone {
  return status;
}

export function ProgressLight({
  tone,
  label,
  compact = false,
}: {
  tone: ProgressLightTone;
  label: string;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center",
        compact ? "gap-1" : "gap-2",
        compact ? "text-[11px] tracking-wide" : "text-sm"
      )}
      title={label}
    >
      <span
        className={cn("size-2 shrink-0 rounded-full", TONE_CLASS[tone])}
        aria-hidden
      />
      <span className={tone === "done" || tone === "completed" ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </span>
  );
}

export function ProgressLights({
  filmDone,
  checkpointDone,
  practice,
  filmLabel,
  checkpointLabel,
  practiceLabel,
  showPractice,
  compact = false,
}: {
  filmDone: boolean;
  checkpointDone: boolean;
  practice: PracticeLight | null;
  filmLabel: string;
  checkpointLabel: string;
  practiceLabel: string | null;
  showPractice: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex flex-wrap",
        compact ? "gap-x-2.5 gap-y-1" : "gap-x-4 gap-y-2 sm:gap-5"
      )}
    >
      <ProgressLight
        compact={compact}
        tone={filmDone ? "done" : "pending"}
        label={filmLabel}
      />
      <ProgressLight
        compact={compact}
        tone={checkpointDone ? "done" : "pending"}
        label={checkpointLabel}
      />
      {showPractice && practice && practiceLabel ? (
        <ProgressLight compact={compact} tone={practice} label={practiceLabel} />
      ) : null}
    </span>
  );
}
