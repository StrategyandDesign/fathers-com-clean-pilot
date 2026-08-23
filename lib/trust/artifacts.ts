import {
  TRUST_CERTIFICATION_STATUS,
  TRUST_PACK_REVIEWED_ON,
  TRUST_PACK_TITLE,
  TRUST_PACK_VERSION,
  TRUST_PILOT_PASSWORD_STATUS,
  TRUST_QUESTIONNAIRE,
  TRUST_ROADMAP_STATUS,
  TRUST_SCAN_STATUS,
} from "@/lib/trust/questionnaire";
import { TRUST_PACK_ARTIFACTS, type TrustPackSlug } from "@/lib/trust/pack";

function csvCell(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function trustPackQuestionnaireMarkdown() {
  const rows = TRUST_QUESTIONNAIRE.map((row) =>
    [
      `## ${row.id}. ${row.section}`,
      "",
      `**Question.** ${row.question}`,
      "",
      `**Answer.** ${row.answer}`,
      "",
      `**Evidence.** ${row.evidence}`,
      "",
    ].join("\n")
  ).join("\n");

  return [
    `# ${TRUST_PACK_TITLE}`,
    "",
    `Pack version ${TRUST_PACK_VERSION}. Last reviewed ${TRUST_PACK_REVIEWED_ON}.`,
    "",
    TRUST_CERTIFICATION_STATUS,
    "",
    TRUST_PILOT_PASSWORD_STATUS,
    "",
    TRUST_ROADMAP_STATUS,
    "",
    TRUST_SCAN_STATUS,
    "",
    "Print this file, or open the comma-separated answers file in a spreadsheet.",
    "",
    rows.trim(),
    "",
  ].join("\n");
}

export function trustPackAnswersCsv() {
  const header = ["id", "section", "question", "answer", "evidence"].map(csvCell).join(",");
  const lines = TRUST_QUESTIONNAIRE.map((row) =>
    [row.id, row.section, row.question, row.answer, row.evidence].map(csvCell).join(",")
  );
  return [`${header}`, ...lines, ""].join("\n");
}

export function trustPackEvidenceMarkdown() {
  return [
    "# Evidence pointers",
    "",
    `Pack version ${TRUST_PACK_VERSION}. Last reviewed ${TRUST_PACK_REVIEWED_ON}.`,
    "",
    "## Architecture and data map",
    "",
    "Issue 1 shipped the education-only memo and data map in the counsel pack (`education-memo-data-map`). That memo lists account, progress, educational assessment, and certificate fields. It does not invent clinical chart fields.",
    "",
    "Issue 5 shipped the quality-improvement field dictionary at `docs/product/QUALITY-IMPROVEMENT-FIELDS.md`. That dictionary describes education participation columns only.",
    "",
    "## Last scan summary",
    "",
    TRUST_SCAN_STATUS,
    "",
    "Open `docs/engineering/trust-pack/scans/README.md` or download the last-scan placeholder from Super-admin.",
    "",
    "## Certification reports",
    "",
    TRUST_CERTIFICATION_STATUS,
    "",
    "## Single sign-on and counsel drafts",
    "",
    "Single sign-on status: `docs/product/SINGLE-SIGN-ON.md` and `/admin/organizations/[id]/identity`.",
    "",
    "Business Associate Agreement drafts: `docs/product/COUNSEL-PACK.md` and `/admin/account/counsel`.",
    "",
  ].join("\n");
}

export function trustPackScanPlaceholderMarkdown() {
  return [
    "# Last scan summary",
    "",
    `Pack version ${TRUST_PACK_VERSION}. Last reviewed ${TRUST_PACK_REVIEWED_ON}.`,
    "",
    "Status: none on file.",
    "",
    TRUST_SCAN_STATUS,
    "",
    "This file is the placeholder for a later vulnerability-scan or penetration-test summary. There is no scan date, no score, and no finding list here because no such report has been added to the repository.",
    "",
  ].join("\n");
}

const BODIES: Record<TrustPackSlug, () => string> = {
  questionnaire: trustPackQuestionnaireMarkdown,
  answers: trustPackAnswersCsv,
  evidence: trustPackEvidenceMarkdown,
  "scan-placeholder": trustPackScanPlaceholderMarkdown,
};

export function trustPackArtifactBody(slug: TrustPackSlug) {
  return BODIES[slug]();
}

export function trustPackDownload(slug: TrustPackSlug) {
  const artifact = TRUST_PACK_ARTIFACTS.find((row) => row.slug === slug);
  if (!artifact) return null;
  return {
    ...artifact,
    body: trustPackArtifactBody(slug),
  };
}
