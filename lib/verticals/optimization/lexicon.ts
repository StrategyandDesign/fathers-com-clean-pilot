/**
 * Bonded-group / chief executive officer forum lexicon.
 * Training and follow-through. Never therapy, grades, or a clinical chart
 * on a father-facing surface. Admin and doctrine pages may name the ban.
 */

export const OPTIMIZATION_PREFERRED_WORDS = ["training", "follow-through", "invitation"] as const;

export const OPTIMIZATION_FATHER_BANNED = [
  {
    id: "therapy",
    label: "therapy",
    pattern: /\btherap(?:y|ies|eutic)\b/i,
  },
  {
    id: "grade",
    label: "grade",
    pattern: /\bgrades?\b/i,
  },
  {
    id: "clinical-chart",
    label: "clinical chart",
    pattern: /clinical\s+chart/i,
  },
] as const;

export type OptimizationLexiconHit = {
  id: string;
  label: string;
  match: string;
};

function collectHits(
  text: string,
  rules: readonly { id: string; label: string; pattern: RegExp }[]
): OptimizationLexiconHit[] {
  const hits: OptimizationLexiconHit[] = [];
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

export function findOptimizationFatherCopyHits(text: string): OptimizationLexiconHit[] {
  return collectHits(text, OPTIMIZATION_FATHER_BANNED);
}

export function confidentialityDefaultsLead() {
  return "Join is invitation-only. Leaders see completion flags. Leader notes stay off exports.";
}

export function nonClinicalCopyRule() {
  return "This is fatherhood training. It does not diagnose, treat, or grade a man.";
}

export function noAnswerDumpRule() {
  return "Pack defaults keep written answers off Leader desks and off exports.";
}

export function sponsorshipCapacityRule() {
  return "The organization funds facilitator capacity. There are no paid participant tiers. The father stays free.";
}

export function publicGoToMarketRule() {
  return "There is no public go-to-market for this pack until the forum-moderator review checklist is signed off.";
}

export function hideRehabLabelRule() {
  return "When the pack is on for a Performance Optimization Group, father chrome omits the Rehab participation label.";
}

export function invitationOnlyJoinRule() {
  return "Men join with an invite code shared by a Leader. There is no public signup list.";
}
