import {
  FACILITATOR_CREDENTIAL_HEADERS,
  FIDELITY_SUMMARY_HEADERS,
  collectQiPacketSections,
  facilitatorCredentialCsv,
  fidelitySummaryCsv,
  type FacilitatorExportRow,
  type FidelityExportBoard,
} from "@/lib/fidelity/export";
import type { Locale } from "@/lib/i18n/config";
import { rowsToCsv, type ReportFilters, type ReportRow } from "@/lib/manager/reports";
import type { Training } from "@/lib/father/types";
import { QI_SCOPE_LINE, renderQiDictionaryMarkdown } from "@/lib/qi/dictionary";
import { certificateSerialCsv, certificateSerialRows } from "@/lib/qi/serials";
import { buildZip, type ZipEntry } from "@/lib/qi/zip";

export const QI_PACKET_README = `Fathers.com quality improvement packet

${QI_SCOPE_LINE}

Contents
- field-dictionary.md
- completion.csv
- fidelity-summary.csv
- facilitator-credentials.csv
- certificate-serials.csv

This packet does not include diagnosis codes, medication data, court packets, clinical chart fields, or answer text.

Downloads stay on this desk. A person still confirms any outbound send.
This zip is not a live push to any outside host.
`;

export type QiPacketInput = {
  rows: ReportRow[];
  organization: string;
  filters: ReportFilters;
  trainings: Training[];
  groups: Array<{ id: string; name: string }>;
  locale: Locale;
  generatedAt: string;
  redisclosure?: boolean;
  boards: FidelityExportBoard[];
  credentials: FacilitatorExportRow[];
};

export function buildQiPacketEntries(input: QiPacketInput): ZipEntry[] {
  const sections = collectQiPacketSections({
    boards: input.boards,
    credentials: input.credentials,
  });
  const fidelity =
    input.boards.length > 0
      ? input.boards.map((board) => fidelitySummaryCsv(board)).join("")
      : `${[...FIDELITY_SUMMARY_HEADERS].join(",")}\n`;
  const facilitators =
    input.credentials.length > 0
      ? facilitatorCredentialCsv(input.credentials)
      : `${[...FACILITATOR_CREDENTIAL_HEADERS].join(",")}\n`;

  return [
    { name: "README.txt", contents: QI_PACKET_README },
    { name: "field-dictionary.md", contents: renderQiDictionaryMarkdown() },
    {
      name: "completion.csv",
      contents: rowsToCsv(input.rows, input.locale, {
        generatedAt: input.generatedAt,
        organization: input.organization,
        filters: input.filters,
        trainings: input.trainings,
        groups: input.groups,
        redisclosure: input.redisclosure,
      }),
    },
    { name: "fidelity-summary.csv", contents: fidelity },
    { name: "facilitator-credentials.csv", contents: facilitators },
    {
      name: "certificate-serials.csv",
      contents: certificateSerialCsv(certificateSerialRows(input.rows, input.organization)),
    },
  ];
}

export function buildQiPacketZip(input: QiPacketInput) {
  return buildZip(buildQiPacketEntries(input));
}

export function qiPacketSectionHooks(input: Pick<QiPacketInput, "boards" | "credentials">) {
  return collectQiPacketSections(input).map((section) => section.hook);
}
