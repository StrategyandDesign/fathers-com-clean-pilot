/**
 * Quality improvement packet hooks consumed by lib/qi/packet.ts.
 * Downloads stay local. A person still confirms any outbound send.
 */

import { clipFidelityNote, fidelityProgress, type FidelitySectionKey } from "@/lib/fidelity/checklist";
import type { FacilitatorCredentialStatus } from "@/lib/fidelity/credentials";

export const QI_PACKET_FIDELITY_HOOK = "fidelity_summary";
export const QI_PACKET_FACILITATOR_HOOK = "facilitator_credentials";

export type QiPacketRow = Record<string, string>;

export type QiPacketSection = {
  hook: typeof QI_PACKET_FIDELITY_HOOK | typeof QI_PACKET_FACILITATOR_HOOK;
  title: string;
  rows: QiPacketRow[];
};

export type FidelityExportItem = {
  itemKey: string;
  section: FidelitySectionKey;
  prompt: string;
  completedBy: string;
  completedAt: string;
  notes: string;
};

export type FidelityExportBoard = {
  groupId: string;
  groupName: string;
  trainingId: string;
  trainingTitle: string;
  items: FidelityExportItem[];
};

export type FacilitatorExportRow = {
  orgId: string;
  orgName: string;
  userId: string;
  name: string;
  status: FacilitatorCredentialStatus | "";
  earnedAt: string;
  evidencePath: string;
  attestedBy: string;
};

function csvCell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function rowsToNamedCsv(rows: QiPacketRow[], headers: string[]) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header] ?? "")).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function fidelitySummaryRows(board: FidelityExportBoard): QiPacketRow[] {
  const progress = fidelityProgress(board.items.map((item) => ({ completedAt: item.completedAt })));
  return board.items.map((item) => ({
    hook: QI_PACKET_FIDELITY_HOOK,
    organization: board.groupName,
    group_id: board.groupId,
    training: board.trainingTitle || "Whole cohort",
    training_id: board.trainingId,
    section: item.section,
    item_key: item.itemKey,
    prompt: item.prompt,
    completed: item.completedAt ? "yes" : "no",
    completed_by: item.completedBy,
    completed_at: item.completedAt,
    notes: clipFidelityNote(item.notes),
    completed_count: String(progress.completed),
    total_count: String(progress.total),
  }));
}

export function facilitatorCredentialRows(rows: FacilitatorExportRow[]): QiPacketRow[] {
  return rows.map((row) => ({
    hook: QI_PACKET_FACILITATOR_HOOK,
    organization: row.orgName,
    org_id: row.orgId,
    user_id: row.userId,
    name: row.name,
    status: row.status,
    earned_at: row.earnedAt,
    evidence_path: row.evidencePath,
    attested_by: row.attestedBy,
  }));
}

export const FIDELITY_SUMMARY_HEADERS = [
  "hook",
  "organization",
  "group_id",
  "training",
  "training_id",
  "section",
  "item_key",
  "prompt",
  "completed",
  "completed_by",
  "completed_at",
  "notes",
  "completed_count",
  "total_count",
] as const;

export const FACILITATOR_CREDENTIAL_HEADERS = [
  "hook",
  "organization",
  "org_id",
  "user_id",
  "name",
  "status",
  "earned_at",
  "evidence_path",
  "attested_by",
] as const;

export function fidelitySummaryCsv(board: FidelityExportBoard) {
  return rowsToNamedCsv(fidelitySummaryRows(board), [...FIDELITY_SUMMARY_HEADERS]);
}

export function facilitatorCredentialCsv(rows: FacilitatorExportRow[]) {
  return rowsToNamedCsv(facilitatorCredentialRows(rows), [...FACILITATOR_CREDENTIAL_HEADERS]);
}

export function collectQiPacketSections(input: {
  boards: FidelityExportBoard[];
  credentials: FacilitatorExportRow[];
}): QiPacketSection[] {
  return [
    {
      hook: QI_PACKET_FIDELITY_HOOK,
      title: "Fidelity checklist summary",
      rows: input.boards.flatMap(fidelitySummaryRows),
    },
    {
      hook: QI_PACKET_FACILITATOR_HOOK,
      title: "Certified Facilitator registry",
      rows: facilitatorCredentialRows(input.credentials),
    },
  ];
}

export function fidelityExportFilename() {
  return `fathers-com-fidelity-${new Date().toISOString().slice(0, 10)}.csv`;
}

export function facilitatorExportFilename() {
  return `fathers-com-facilitators-${new Date().toISOString().slice(0, 10)}.csv`;
}
