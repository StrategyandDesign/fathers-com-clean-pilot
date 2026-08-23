import type { PracticeLight } from "@/lib/father/skill-use";

export const COMMITMENT_FLAGS = ["completed", "not_yet", "dismissed", "stale", "none"] as const;

export type CommitmentFlag = (typeof COMMITMENT_FLAGS)[number];

export type CommitmentBoardRow = {
  fatherId: string;
  displayName: string;
  flag: CommitmentFlag;
};

export function firstDisplayName(name: string, fatherId: string): string {
  const trimmed = name.trim();
  if (!trimmed) return `Father ${fatherId.slice(0, 8)}`;
  const first = trimmed.split(/\s+/)[0];
  return first || `Father ${fatherId.slice(0, 8)}`;
}

export function practiceLightToCommitmentFlag(
  status: PracticeLight | "" | null | undefined
): CommitmentFlag {
  if (status === "completed" || status === "not_yet" || status === "dismissed" || status === "stale") {
    return status;
  }
  return "none";
}

export function buildCommitmentBoard(
  participants: Array<{
    fatherId: string;
    name: string;
    practiceLight?: PracticeLight | null;
  }>
): CommitmentBoardRow[] {
  return participants
    .map((row) => ({
      fatherId: row.fatherId,
      displayName: firstDisplayName(row.name, row.fatherId),
      flag: practiceLightToCommitmentFlag(row.practiceLight),
    }))
    .sort((left, right) => left.displayName.localeCompare(right.displayName));
}

export function commitmentBoardHasGrades(rows: readonly CommitmentBoardRow[]): boolean {
  return rows.some((row) => /grade|score|percent/i.test(`${row.displayName} ${row.flag}`));
}

export function summarizeCommitmentBoard(rows: readonly CommitmentBoardRow[]) {
  return {
    men: rows.length,
    completed: rows.filter((row) => row.flag === "completed").length,
    notYet: rows.filter((row) => row.flag === "not_yet").length,
    dismissed: rows.filter((row) => row.flag === "dismissed").length,
    stale: rows.filter((row) => row.flag === "stale").length,
    none: rows.filter((row) => row.flag === "none").length,
  };
}
