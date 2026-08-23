/**
 * Armed Forces recruiting lexicon. Training, readiness, and skills.
 * Never therapy, counseling, behavioral health, or support group on a
 * military-facing recruiting surface, including as a denial.
 * Admin and doctrine pages may name the ban. Public recruiting stays dark
 * while SHOW_MILITARY is false.
 */

export const ARMED_FORCES_PREFERRED_WORDS = ["training", "readiness", "skills"] as const;

export const ARMED_FORCES_RECRUITING_BANNED = [
  {
    id: "therapy",
    label: "therapy",
    pattern: /\btherap(?:y|ies|eutic)\b/i,
  },
  {
    id: "counseling",
    label: "counseling",
    pattern: /\bcounsel(?:ing|ling|or|lors)?\b/i,
  },
  {
    id: "behavioral-health",
    label: "behavioral health",
    pattern: /behavio(?:u)?ral\s+health/i,
  },
  {
    id: "support-group",
    label: "support group",
    pattern: /support\s+group/i,
  },
] as const;

export const ARMED_FORCES_COMBAT_PAINT = [
  {
    id: "combat",
    label: "combat",
    pattern: /\bcombat\b/i,
  },
  {
    id: "barracks",
    label: "barracks",
    pattern: /\bbarracks\b/i,
  },
  {
    id: "battlefield",
    label: "battlefield",
    pattern: /\bbattlefield\b/i,
  },
  {
    id: "firefight",
    label: "firefight",
    pattern: /\bfirefight\b/i,
  },
] as const;

export type ArmedForcesLexiconHit = {
  id: string;
  label: string;
  match: string;
};

function collectHits(
  text: string,
  rules: readonly { id: string; label: string; pattern: RegExp }[]
): ArmedForcesLexiconHit[] {
  const hits: ArmedForcesLexiconHit[] = [];
  for (const rule of rules) {
    const pattern = new RegExp(
      rule.pattern.source,
      rule.pattern.flags.includes("g") ? rule.pattern.flags : `${rule.pattern.flags}g`
    );
    for (const match of text.matchAll(pattern)) {
      hits.push({ id: rule.id, label: rule.label, match: match[0] });
    }
  }
  return hits;
}

export function findRecruitingLexiconHits(text: string): ArmedForcesLexiconHit[] {
  return collectHits(text, ARMED_FORCES_RECRUITING_BANNED);
}

export function findCombatPaintHits(text: string): ArmedForcesLexiconHit[] {
  return collectHits(text, ARMED_FORCES_COMBAT_PAINT);
}

export function recruitingLexiconLead() {
  return "Use training, readiness, and skills. Never therapy on a recruiting surface.";
}

export function comingHomePresentFraming() {
  return "Coming Home Present stays a return-and-reconnect training. Treatment house, program rules, first calls home, and first night back. Armed service return uses the same body skills. It is not the default story.";
}

export function sponsorshipSeatsRule() {
  return "Sponsorship covers organization seats only. There are no rank VIP tiers.";
}

export function militaryApprovalRecordRule() {
  return "There is no public Military and Family Life Counseling approved or Building Strong and Ready Teams approved claim until a written record exists.";
}
