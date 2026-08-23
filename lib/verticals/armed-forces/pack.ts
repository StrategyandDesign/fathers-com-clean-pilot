export const VERTICAL_PACK_ARMED_FORCES = "vertical_pack_armed_forces";

export const ARMED_FORCES_PACK_SLUGS = [
  "content-inventory",
  "non-clinical-attestation",
  "title-10-usc-1789-note",
  "event-closeout-printable",
] as const;

export type ArmedForcesPackSlug = (typeof ARMED_FORCES_PACK_SLUGS)[number];

export type ArmedForcesPackArtifact = {
  slug: ArmedForcesPackSlug;
  filename: string;
  title: string;
  summary: string;
  contentType: "text/markdown; charset=utf-8";
};

export const ARMED_FORCES_PACK_ARTIFACTS: ArmedForcesPackArtifact[] = [
  {
    slug: "content-inventory",
    filename: "armed-forces-content-inventory.md",
    title: "Content inventory",
    summary:
      "What a chaplain or unit channel can review: Coming Home Present, facilitator notes, and completion proof. No clinical chart fields.",
    contentType: "text/markdown; charset=utf-8",
  },
  {
    slug: "non-clinical-attestation",
    filename: "armed-forces-non-clinical-attestation.md",
    title: "Non-clinical attestation",
    summary:
      "Draft attestation that this is fatherhood training, not therapy. Counsel reviews before anyone signs.",
    contentType: "text/markdown; charset=utf-8",
  },
  {
    slug: "title-10-usc-1789-note",
    filename: "title-10-united-states-code-1789-cost-category-note.md",
    title: "Title 10 United States Code section 1789 cost-category note",
    summary:
      "Draft fit note for training materials under Title 10 United States Code section 1789. Not a claim of appropriation or approval.",
    contentType: "text/markdown; charset=utf-8",
  },
  {
    slug: "event-closeout-printable",
    filename: "armed-forces-event-closeout-printable.md",
    title: "Event closeout printable",
    summary:
      "Blank attendance and completion aggregate sheet. Not counseling content. Live totals reuse Reports when the pack flag is on.",
    contentType: "text/markdown; charset=utf-8",
  },
];

export function isArmedForcesPackSlug(value: unknown): value is ArmedForcesPackSlug {
  return typeof value === "string" && (ARMED_FORCES_PACK_SLUGS as readonly string[]).includes(value);
}

export function armedForcesPackArtifact(slug: string): ArmedForcesPackArtifact | null {
  return ARMED_FORCES_PACK_ARTIFACTS.find((row) => row.slug === slug) ?? null;
}
