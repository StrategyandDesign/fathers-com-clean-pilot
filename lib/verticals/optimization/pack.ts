export const VERTICAL_PACK_OPTIMIZATION = "vertical_pack_optimization";

export const OPTIMIZATION_PACK_SLUGS = [
  "confidentiality-defaults",
  "non-clinical-copy",
  "forum-moderator-review",
  "sponsorship-and-deferral",
] as const;

export type OptimizationPackSlug = (typeof OPTIMIZATION_PACK_SLUGS)[number];

export type OptimizationPackArtifact = {
  slug: OptimizationPackSlug;
  filename: string;
  title: string;
  summary: string;
  contentType: "text/markdown; charset=utf-8";
};

export const OPTIMIZATION_PACK_ARTIFACTS: OptimizationPackArtifact[] = [
  {
    slug: "confidentiality-defaults",
    filename: "optimization-confidentiality-defaults.md",
    title: "Confidentiality defaults",
    summary:
      "Invitation-only join, flags-only answers, and Leader notes kept off exports. No clinical chart fields.",
    contentType: "text/markdown; charset=utf-8",
  },
  {
    slug: "non-clinical-copy",
    filename: "optimization-non-clinical-copy.md",
    title: "Non-clinical copy note",
    summary:
      "This is fatherhood training for a bonded group. It is not therapy, coaching grades, or a clinical chart.",
    contentType: "text/markdown; charset=utf-8",
  },
  {
    slug: "forum-moderator-review",
    filename: "forum-moderator-review-checklist.md",
    title: "Forum-moderator review checklist",
    summary:
      "Sign-off list for confidentiality defaults, non-clinical copy, and no answer dump. Required before any public go-to-market.",
    contentType: "text/markdown; charset=utf-8",
  },
  {
    slug: "sponsorship-and-deferral",
    filename: "optimization-sponsorship-and-deferral.md",
    title: "Sponsorship and deferral",
    summary:
      "The organization funds facilitator capacity. There are no paid participant tiers. Public go-to-market stays deferred.",
    contentType: "text/markdown; charset=utf-8",
  },
];

export function isOptimizationPackSlug(value: unknown): value is OptimizationPackSlug {
  return typeof value === "string" && (OPTIMIZATION_PACK_SLUGS as readonly string[]).includes(value);
}

export function optimizationPackArtifact(slug: string): OptimizationPackArtifact | null {
  return OPTIMIZATION_PACK_ARTIFACTS.find((row) => row.slug === slug) ?? null;
}
