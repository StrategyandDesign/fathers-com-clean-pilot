export const TRUST_PACK_SLUGS = [
  "questionnaire",
  "answers",
  "evidence",
  "scan-placeholder",
] as const;

export type TrustPackSlug = (typeof TRUST_PACK_SLUGS)[number];

export type TrustPackArtifact = {
  slug: TrustPackSlug;
  filename: string;
  title: string;
  summary: string;
  contentType: string;
};

export const TRUST_PACK_ARTIFACTS: TrustPackArtifact[] = [
  {
    slug: "questionnaire",
    filename: "security-questionnaire.md",
    title: "Security questionnaire (printable)",
    summary:
      "Dated hospital information-technology answers that match live controls. Not a certification.",
    contentType: "text/markdown; charset=utf-8",
  },
  {
    slug: "answers",
    filename: "security-questionnaire-answers.csv",
    title: "Spreadsheet-friendly answers",
    summary: "The same questions and answers as comma-separated rows.",
    contentType: "text/csv; charset=utf-8",
  },
  {
    slug: "evidence",
    filename: "evidence-pointers.md",
    title: "Evidence pointers",
    summary:
      "Pointers to the architecture and data map, plus the empty last-scan placeholder.",
    contentType: "text/markdown; charset=utf-8",
  },
  {
    slug: "scan-placeholder",
    filename: "last-scan-summary.md",
    title: "Last scan summary placeholder",
    summary: "States that no scan summary is on file. Does not invent findings.",
    contentType: "text/markdown; charset=utf-8",
  },
];

export function isTrustPackSlug(value: unknown): value is TrustPackSlug {
  return typeof value === "string" && (TRUST_PACK_SLUGS as readonly string[]).includes(value);
}

export function trustPackArtifact(slug: string): TrustPackArtifact | null {
  return TRUST_PACK_ARTIFACTS.find((row) => row.slug === slug) ?? null;
}
