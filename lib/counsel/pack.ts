export const COUNSEL_PACK_REQUIRED = "counsel_pack_required";

export const COUNSEL_PACK_SLUGS = [
  "baa-template",
  "education-memo-data-map",
  "part2-applicability-memo",
  "qsoa",
  "redisclosure-notice",
  "breach-contact-runbook",
] as const;

export type CounselPackSlug = (typeof COUNSEL_PACK_SLUGS)[number];

export type CounselArtifactLegalStatus = "draft" | "executed";

export type CounselPackArtifact = {
  slug: CounselPackSlug;
  filename: string;
  title: string;
  summary: string;
  legalStatus: CounselArtifactLegalStatus;
  contentType: "text/markdown; charset=utf-8";
};

export type CounselPackState = {
  groupId: string;
  groupName: string;
  required: boolean;
  attachedAt: string | null;
  attachedBy: string | null;
};

export const COUNSEL_PACK_ARTIFACTS: CounselPackArtifact[] = [
  {
    slug: "baa-template",
    filename: "business-associate-agreement-draft.md",
    title: "Business Associate Agreement template",
    summary:
      "Draft for counsel review. Use only if counsel decides a Business Associate Agreement applies. This product does not claim to be a covered entity.",
    legalStatus: "draft",
    contentType: "text/markdown; charset=utf-8",
  },
  {
    slug: "education-memo-data-map",
    filename: "education-only-memo-and-data-map.md",
    title: "Education-only memo and data map",
    summary:
      "Draft memo of what this education product stores. No clinical chart fields. Counsel reviews the map before any partner use.",
    legalStatus: "draft",
    contentType: "text/markdown; charset=utf-8",
  },
  {
    slug: "part2-applicability-memo",
    filename: "title-42-cfr-part-2-applicability-memo.md",
    title: "Title 42 Code of Federal Regulations Part 2 applicability memo",
    summary:
      "Placeholder memo. Counsel decides whether Title 42 Code of Federal Regulations Part 2 applies to a partner program. The platform is built so substance use disorder records do not cross here.",
    legalStatus: "draft",
    contentType: "text/markdown; charset=utf-8",
  },
  {
    slug: "qsoa",
    filename: "qualified-service-organization-agreement-draft.md",
    title: "Qualified Service Organization Agreement draft",
    summary:
      "Draft from the partner kit. Counsel finalizes parties and terms before any signature. Not for execution as written.",
    legalStatus: "draft",
    contentType: "text/markdown; charset=utf-8",
  },
  {
    slug: "redisclosure-notice",
    filename: "redisclosure-notice-for-exports.md",
    title: "Redisclosure notice for exports",
    summary:
      "Draft one-liner and longer notice for Reports exports. Shown on a download only when the organization turns counsel_pack_required on.",
    legalStatus: "draft",
    contentType: "text/markdown; charset=utf-8",
  },
  {
    slug: "breach-contact-runbook",
    filename: "breach-contact-runbook-stub.md",
    title: "Breach contact runbook stub",
    summary:
      "Draft contact stub. Counsel and the organization fill names, clocks, and notice rules. This product does not send breach notices on its own.",
    legalStatus: "draft",
    contentType: "text/markdown; charset=utf-8",
  },
];

export const REPORT_REDISCLOSURE_LINE =
  "Redisclosure notice (draft): This export is education participation only. If Title 42 Code of Federal Regulations Part 2 applies to your program, do not redisclose identifying information except as that rule or written consent allows.";

export function isCounselPackSlug(value: unknown): value is CounselPackSlug {
  return typeof value === "string" && (COUNSEL_PACK_SLUGS as readonly string[]).includes(value);
}

export function counselPackArtifact(slug: string): CounselPackArtifact | null {
  return COUNSEL_PACK_ARTIFACTS.find((row) => row.slug === slug) ?? null;
}

export function parseCounselPackRequired(value: unknown): boolean {
  return value === true;
}

export function counselPackLegalLabel(status: CounselArtifactLegalStatus): string {
  return status === "executed" ? "Executed" : "Draft";
}

export function counselPackNeverExecutedCopy() {
  return "Every file on this page is a draft for counsel review. An unsigned draft is not an executed agreement.";
}

export function emptyCounselPackState(
  groupId: string,
  groupName: string
): CounselPackState {
  return {
    groupId,
    groupName,
    required: false,
    attachedAt: null,
    attachedBy: null,
  };
}

export function counselPackChecklistVisible(state: CounselPackState) {
  return state.required;
}

export function counselPackChecklistComplete(state: CounselPackState) {
  return state.required && Boolean(state.attachedAt);
}

export function counselPackNeedsEmptyState(state: CounselPackState) {
  return state.required && !state.attachedAt;
}

export function anyCounselPackRequired(states: CounselPackState[]) {
  return states.some((state) => state.required);
}

export function reportRedisclosureEnabled(states: CounselPackState[]) {
  return anyCounselPackRequired(states);
}
