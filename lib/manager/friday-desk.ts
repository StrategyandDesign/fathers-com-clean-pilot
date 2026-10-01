import type { TrainingProgress } from "@/lib/manager/types";

export const FRIDAY_QUIET_DAYS = 7;

export type WeekMarks = {
  film: boolean;
  checkpoint: boolean;
  practice: boolean;
};

export function weekIsComplete(week: WeekMarks) {
  return week.film && week.checkpoint && week.practice;
}

export function weekMarksFromCards(cards: TrainingProgress[]): WeekMarks {
  const active =
    cards.find((card) => card.assigned && !card.gated && card.total > 0 && card.completed < card.total) ??
    cards.find((card) => card.assigned && !card.gated && card.total > 0 && card.completed >= card.total) ??
    cards.find((card) => card.assigned && !card.gated) ??
    null;

  if (active && active.total > 0 && active.completed >= active.total) {
    return { film: true, checkpoint: true, practice: true };
  }

  const progress = active?.current?.progress ?? null;
  return {
    film: Boolean(progress?.film_completed),
    checkpoint: Boolean(progress?.checkin_completed),
    practice: Boolean(progress?.action_completed),
  };
}

/** Started and unfinished, or quiet for a week with the week still open. */
export function isFridayStall(week: WeekMarks, daysQuiet: number) {
  if (weekIsComplete(week)) return false;
  if (week.film || week.checkpoint || week.practice) return true;
  return daysQuiet >= FRIDAY_QUIET_DAYS;
}

export type FridayMan = {
  fatherId: string;
  name: string;
  claimed: boolean | null;
  stalled: boolean;
  daysQuiet: number;
};

/** One named man. Oldest quiet stall who already has a claimed seat. */
export function pickFridayMan<T extends FridayMan>(men: T[]): T | null {
  const stalls = men.filter((man) => man.claimed === true && man.stalled);
  if (stalls.length === 0) return null;
  return [...stalls].sort((left, right) => {
    const quiet = right.daysQuiet - left.daysQuiet;
    if (quiet !== 0) return quiet;
    return left.name.localeCompare(right.name);
  })[0];
}

export function fridayCopyLine(name: string) {
  return `Checking in on ${name} — film, checkpoint, practice. Need anything to finish this week?`;
}

export function markLabel(done: boolean) {
  return done ? "Y" : "N";
}

export function claimedLabel(claimed: boolean | null) {
  if (claimed == null) return "";
  return claimed ? "yes" : "no";
}

export function completeAndClaimedLabel(completed: boolean, claimed: boolean | null) {
  if (claimed == null) return "";
  return completed && claimed ? "yes" : "no";
}
