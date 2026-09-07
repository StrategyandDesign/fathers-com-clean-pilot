import { actionSkillText } from "@/lib/father/action-commitment";

/** Father-facing "Did you use this skill?" card. Off: the ask felt condescending. */
export const SKILL_USE_PROMPT_ENABLED = false;

export const SKILL_USES = ["used", "later", "dismissed"] as const;

export type SkillUse = (typeof SKILL_USES)[number];

export const SKILL_USE_FOLLOW_UP_MS = 12 * 60 * 60 * 1000;

export type SkillUseCandidate = {
  sessionId: string;
  sessionTitle: string;
  skill: string;
  completedAt: string | null;
  skillUse: SkillUse | null;
};

export type SkillUsePrompt = {
  sessionId: string;
  sessionTitle: string;
  skill: string;
};

export function isSkillUse(value: unknown): value is SkillUse {
  return value === "used" || value === "later" || value === "dismissed";
}

export function parseSkillUse(value: unknown): SkillUse | null {
  return isSkillUse(value) ? value : null;
}

export function nextSkillUse(current: SkillUse | null, next: SkillUse): SkillUse {
  if (current === "used") return "used";
  return next;
}

export function skillUseFollowUpDue(
  completedAt: string | null | undefined,
  now: Date = new Date(),
  waitMs: number = SKILL_USE_FOLLOW_UP_MS
) {
  if (!completedAt) return true;
  const time = Date.parse(completedAt);
  if (Number.isNaN(time)) return true;
  return now.getTime() - time >= waitMs;
}

export function pickSkillUseFollowUp(
  candidates: SkillUseCandidate[],
  now: Date = new Date()
): SkillUsePrompt | null {
  const open = candidates
    .filter(
      (row) =>
        row.skillUse === null && skillUseFollowUpDue(row.completedAt, now)
    )
    .sort((left, right) => {
      const leftTime = Date.parse(left.completedAt ?? "") || 0;
      const rightTime = Date.parse(right.completedAt ?? "") || 0;
      return rightTime - leftTime;
    });
  const row = open[0];
  if (!row) return null;
  return {
    sessionId: row.sessionId,
    sessionTitle: row.sessionTitle,
    skill: row.skill,
  };
}

const IMPERATIVE_START =
  /^(practice|keep|name|show|stay|protect|use|be|listen|ask|notice|pause|correct|speak|give|hold|return|watch|try|catch|say|step|meet|own|go|stack|train|plan|live)\b/i;
const HAS_CLAUSE_VERB =
  /\b(is|are|was|were|be|builds?|keeps?|opens?|beats?|buy|stands?|did|does|can|will)\b/i;
const ALREADY_SENTENCE_START =
  /^(welcome|this|that|there|here|if|when|your|one|few|same|small|short|the|rupture|steadiness|frequency)\b/i;

function tidySkillLine(raw: string) {
  return raw.replace(/\s+/g, " ").trim().replace(/[.?!]+$/g, "");
}

export function isSkillUseStatementReady(raw: string) {
  const text = tidySkillLine(raw);
  if (!text) return false;
  return (
    IMPERATIVE_START.test(text) ||
    HAS_CLAUSE_VERB.test(text) ||
    ALREADY_SENTENCE_START.test(text)
  );
}

const OVERVIEW_TITLE =
  /training\s+overview|^overview$|introduction/i;
const WELCOME_SKILL = /^welcome\b/i;

export function isOverviewSession(session: { title?: string | null }) {
  return OVERVIEW_TITLE.test((session.title ?? "").replace(/\s+/g, " ").trim());
}

export function hasActionSkill(session: {
  title?: string | null;
  keyline?: string | null;
  action_prompt?: string | null;
}) {
  if (isOverviewSession(session)) return false;
  const skill = actionSkillText(session);
  if (!skill) return false;
  if (WELCOME_SKILL.test(skill)) return false;
  return true;
}

/** Hide skill-use on overview sessions and sessions with no action skill yet. */
export function shouldAskSkillUse(session: {
  title?: string | null;
  keyline?: string | null;
  action_prompt?: string | null;
}) {
  return hasActionSkill(session);
}

/** Turn a catalog keyline into a statement under “Did you use this skill?” */
export function formatSkillUseStatement(raw: string) {
  const text = tidySkillLine(raw);
  if (!text) return "";
  if (isSkillUseStatementReady(text)) {
    return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
  }
  return `Practice ${text.charAt(0).toLowerCase()}${text.slice(1)}.`;
}

export function countSkillsUsed(
  rows: Array<{ skill_use?: string | null; skillUse?: SkillUse | null }>
) {
  return rows.filter((row) => parseSkillUse(row.skill_use ?? row.skillUse) === "used")
    .length;
}

export const PRACTICE_LIGHTS = ["completed", "not_yet", "dismissed", "stale"] as const;

export type PracticeLight = (typeof PRACTICE_LIGHTS)[number];

/** "Not yet" becomes stale after a week so the roster stays a flag, not a count. */
export const PRACTICE_LIGHT_STALE_MS = 7 * 24 * 60 * 60 * 1000;

export type PracticeLightRow = {
  skill_use?: string | null;
  skillUse?: SkillUse | null;
  skill_use_at?: string | null;
  skillUseAt?: string | null;
  completed_at?: string | null;
};

export function isPracticeLight(value: unknown): value is PracticeLight {
  return (
    value === "completed" ||
    value === "not_yet" ||
    value === "dismissed" ||
    value === "stale"
  );
}

function skillUseStamp(row: PracticeLightRow) {
  return row.skill_use_at ?? row.skillUseAt ?? row.completed_at ?? null;
}

function isStampStale(
  stamp: string | null | undefined,
  now: Date,
  staleMs: number
) {
  if (!stamp) return true;
  const time = Date.parse(stamp);
  if (Number.isNaN(time)) return true;
  return now.getTime() - time >= staleMs;
}

export function practiceLightFromSkillUse(
  skillUse: SkillUse | null | undefined,
  skillUseAt?: string | null,
  now: Date = new Date(),
  staleMs: number = PRACTICE_LIGHT_STALE_MS
): PracticeLight | null {
  if (skillUse === "used") return "completed";
  if (skillUse === "dismissed") return "dismissed";
  if (skillUse === "later") {
    return isStampStale(skillUseAt, now, staleMs) ? "stale" : "not_yet";
  }
  return null;
}

export function latestSkillUseRow<T extends PracticeLightRow>(rows: T[]): T | null {
  const answered = rows.filter((row) => parseSkillUse(row.skill_use ?? row.skillUse));
  if (answered.length === 0) return null;
  return [...answered].sort((left, right) => {
    const leftTime = Date.parse(skillUseStamp(left) ?? "") || 0;
    const rightTime = Date.parse(skillUseStamp(right) ?? "") || 0;
    return rightTime - leftTime;
  })[0];
}

export function latestPracticeLight(
  rows: PracticeLightRow[],
  now: Date = new Date(),
  staleMs: number = PRACTICE_LIGHT_STALE_MS
): PracticeLight | null {
  const row = latestSkillUseRow(rows);
  if (!row) return null;
  return practiceLightFromSkillUse(
    parseSkillUse(row.skill_use ?? row.skillUse),
    skillUseStamp(row),
    now,
    staleMs
  );
}

export function practiceLightCsvValue(status: PracticeLight | null | undefined) {
  if (status === "not_yet") return "not yet";
  if (status === "completed" || status === "dismissed" || status === "stale") {
    return status;
  }
  return "";
}

export function isPracticeSkipped(status: PracticeLight | null | undefined) {
  return status === "dismissed" || status === "stale";
}
