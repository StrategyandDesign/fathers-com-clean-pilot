export type OptimizationChecklistItem = {
  key: string;
  title: string;
  body: string;
};

export const OPTIMIZATION_CHECKLIST_ITEMS: OptimizationChecklistItem[] = [
  {
    key: "flag-off",
    title: "Pack stays off until a Performance desk needs it",
    body: "vertical_pack_optimization defaults off. Rehab organizations never receive this pack. Organization type performance_optimization_group recommends the pack only. It does not turn the env flag on.",
  },
  {
    key: "confidentiality",
    title: "Confidentiality defaults",
    body: "Join is invitation-only. Leaders see completion flags, not written answers. Leader notes stay off exports. Do not invent clinical chart fields.",
  },
  {
    key: "copy-skin",
    title: "Copy skin",
    body: "When the pack is on for a Performance Optimization Group, father chrome omits the Rehab participation label. Expand every acronym. Keep the tone quiet.",
  },
  {
    key: "commitment",
    title: "Commitment board",
    body: "Reuse practice completion flags as peer follow-through: completed, not yet, dismissed, or stale. No grades. No answer text.",
  },
  {
    key: "moderator",
    title: "Moderator controls",
    body: "Share the invite code with invited men only. Do not post it on a public page. Leader notes are not part of Reports or the quality improvement packet.",
  },
  {
    key: "sponsorship",
    title: "Organization-funded facilitator capacity",
    body: "Sponsorship pays for facilitator capacity at the organization. There are no paid participant tiers. The father stays free.",
  },
  {
    key: "non-clinical",
    title: "Non-clinical copy",
    body: "This is fatherhood training. It does not diagnose, treat, or grade a man. Assessments stay educational self-report tools.",
  },
  {
    key: "no-dump",
    title: "No answer dump",
    body: "Pack defaults keep custom assessment answers off Leader desks. Reviewers stay on cohort totals. Do not attach written answers to an export.",
  },
  {
    key: "gtm",
    title: "Public go-to-market stays deferred",
    body: "There is no public go-to-market for this pack until this checklist is signed off. Same Desk spine. No second app. No film rewrites.",
  },
];

export function optimizationChecklistProgress(completedKeys: readonly string[] = []) {
  const done = new Set(completedKeys);
  const completed = OPTIMIZATION_CHECKLIST_ITEMS.filter((item) => done.has(item.key)).length;
  return {
    completed,
    total: OPTIMIZATION_CHECKLIST_ITEMS.length,
    remaining: OPTIMIZATION_CHECKLIST_ITEMS.length - completed,
  };
}
