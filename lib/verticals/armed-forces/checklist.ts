export type ArmedForcesChecklistItem = {
  key: string;
  title: string;
  body: string;
};

export const ARMED_FORCES_CHECKLIST_ITEMS: ArmedForcesChecklistItem[] = [
  {
    key: "gates",
    title: "Readiness gates stay closed",
    body: "Rehabilitation proof first, a clean efficacy pipeline, and one informal military champion. SHOW_MILITARY stays false until those gates open.",
  },
  {
    key: "coming-home",
    title: "Coming Home Present framing",
    body: "Lead with Coming Home Present. Treatment house, program rules, first calls home, and first night back. Do not paint this as an armed-conflict story.",
  },
  {
    key: "lexicon",
    title: "Recruiting lexicon",
    body: "Use training, readiness, and skills. Never therapy, counseling, behavioral health, or support group on a recruiting surface.",
  },
  {
    key: "inventory",
    title: "Content inventory",
    body: "Download the inventory. Confirm films, facilitator notes, and completion proof. Do not add clinical chart fields.",
  },
  {
    key: "attestation",
    title: "Non-clinical attestation",
    body: "Counsel reviews the draft attestation. A download is not a signature.",
  },
  {
    key: "title-10",
    title: "Title 10 United States Code section 1789 note",
    body: "Training materials may fit a family-support cost category. This note is not eligibility, appropriation, or approval.",
  },
  {
    key: "closeout",
    title: "Event closeout",
    body: "Print attendance and completion aggregates only. The Reports closeout preset fills live totals when vertical_pack_armed_forces is on.",
  },
  {
    key: "approvals",
    title: "No false approval claims",
    body: "There is no public Military and Family Life Counseling approved or Building Strong and Ready Teams approved claim until a written record exists.",
  },
  {
    key: "sponsorship",
    title: "Organization seats only",
    body: "Sponsorship covers organization seats. There are no rank VIP tiers. The father stays free.",
  },
];

export function armedForcesChecklistProgress(completedKeys: readonly string[] = []) {
  const done = new Set(completedKeys);
  const completed = ARMED_FORCES_CHECKLIST_ITEMS.filter((item) => done.has(item.key)).length;
  return {
    completed,
    total: ARMED_FORCES_CHECKLIST_ITEMS.length,
    remaining: ARMED_FORCES_CHECKLIST_ITEMS.length - completed,
  };
}
