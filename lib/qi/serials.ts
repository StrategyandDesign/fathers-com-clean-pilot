import { rowsToNamedCsv } from "@/lib/fidelity/export";
import type { ReportRow } from "@/lib/manager/reports";
import { CERTIFICATE_SERIAL_HEADERS } from "@/lib/qi/dictionary";

export type CertificateSerialRow = {
  certificate_serial: string;
  issued_at: string;
  participant_id: string;
  name: string;
  training: string;
  group: string;
  organization: string;
};

export function certificateSerialRows(
  rows: ReportRow[],
  organization: string
): CertificateSerialRow[] {
  return rows
    .filter((row) => row.certificateSerial.trim())
    .map((row) => ({
      certificate_serial: row.certificateSerial,
      issued_at: row.certificateIssuedAt ?? "",
      participant_id: row.fatherId,
      name: row.name,
      training: row.trainingTitle,
      group: row.groupName,
      organization,
    }));
}

export function certificateSerialCsv(rows: CertificateSerialRow[]) {
  return rowsToNamedCsv(rows, [...CERTIFICATE_SERIAL_HEADERS]);
}
