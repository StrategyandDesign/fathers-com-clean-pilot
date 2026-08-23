/**
 * Living fidelity checklist from partner-kit/supervision-checklist.md.
 * Education supervision only. Not a clinical chart.
 */

export const FIDELITY_BOARD_ENABLED = "fidelity_board_enabled";
export const SUPERVISION_TEMPLATE_SLUG = "supervised-first-cohort";
export const SUPERVISION_TEMPLATE_TITLE = "Supervised first cohort";
export const SUPERVISION_TEMPLATE_SOURCE = "partner-kit/supervision-checklist.md";

export const FIDELITY_NOTE_MAX = 280;

export const FIDELITY_SECTION_KEYS = [
  "session_one",
  "mid_cohort",
  "the_final",
  "credential",
] as const;

export type FidelitySectionKey = (typeof FIDELITY_SECTION_KEYS)[number];

export type FidelityTemplateItem = {
  key: string;
  section: FidelitySectionKey;
  sort: number;
  prompt: string;
};

export const SUPERVISION_CHECKLIST_ITEMS: readonly FidelityTemplateItem[] = [
  {
    key: "session_one.greet_by_name",
    section: "session_one",
    sort: 1,
    prompt: "Every man greeted by name at the door.",
  },
  {
    key: "session_one.zero_cost_promise",
    section: "session_one",
    sort: 2,
    prompt: "The zero-cost promise said out loud.",
  },
  {
    key: "session_one.profile_and_commitment",
    section: "session_one",
    sort: 3,
    prompt: "Every man leaves with a Profile started and one stated commitment.",
  },
  {
    key: "session_one.next_session_confirmed",
    section: "session_one",
    sort: 4,
    prompt: "Next session confirmed before dismissal.",
  },
  {
    key: "mid_cohort.wins_opened",
    section: "mid_cohort",
    sort: 5,
    prompt: "Wins opened the room; every man reported.",
  },
  {
    key: "mid_cohort.practice_over_lecture",
    section: "mid_cohort",
    sort: 6,
    prompt: "Practice time exceeded lecture time.",
  },
  {
    key: "mid_cohort.absent_called",
    section: "mid_cohort",
    sort: 7,
    prompt: "Any absent man was called the same day he missed. Ask for the story.",
  },
  {
    key: "mid_cohort.attendance_trend",
    section: "mid_cohort",
    sort: 8,
    prompt: "Attendance trend reviewed against session one.",
  },
  {
    key: "the_final.finals_read",
    section: "the_final",
    sort: 9,
    prompt: "Finals read personally, feedback given man by man.",
  },
  {
    key: "the_final.ceremony_scheduled",
    section: "the_final",
    sort: 10,
    prompt: "Ceremony scheduled before program exit, room and guests arranged.",
  },
  {
    key: "the_final.verification_sheet",
    section: "the_final",
    sort: 11,
    prompt: "Verification sheet produced for any requiring coordinator.",
  },
  {
    key: "credential.rhythm_holds",
    section: "credential",
    sort: 12,
    prompt: "The supervisor has seen the rhythm hold without prompting.",
  },
  {
    key: "credential.coaching_notes",
    section: "credential",
    sort: 13,
    prompt: "One coaching note per session, in writing, kept simple.",
  },
];

export const FIDELITY_SECTION_LABEL_KEY: Record<FidelitySectionKey, string> = {
  session_one: "fidelity.sectionSessionOne",
  mid_cohort: "fidelity.sectionMidCohort",
  the_final: "fidelity.sectionTheFinal",
  credential: "fidelity.sectionCredential",
};

export function isFidelitySectionKey(value: unknown): value is FidelitySectionKey {
  return (
    typeof value === "string" &&
    (FIDELITY_SECTION_KEYS as readonly string[]).includes(value)
  );
}

export function supervisionItemByKey(key: string) {
  return SUPERVISION_CHECKLIST_ITEMS.find((item) => item.key === key) ?? null;
}

export function clipFidelityNote(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";
  return raw.slice(0, FIDELITY_NOTE_MAX);
}

export function isFidelityItemComplete(item: { completedAt?: string | null; completed_at?: string | null }) {
  return Boolean(item.completedAt || item.completed_at);
}

export function fidelityProgress(items: Array<{ completedAt?: string | null; completed_at?: string | null }>) {
  const total = items.length;
  const completed = items.filter(isFidelityItemComplete).length;
  return { completed, total, remaining: Math.max(0, total - completed) };
}

export function itemsForSection(
  items: readonly FidelityTemplateItem[],
  section: FidelitySectionKey
) {
  return items.filter((item) => item.section === section).slice().sort((a, b) => a.sort - b.sort);
}
