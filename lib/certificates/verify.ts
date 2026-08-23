import { createClient } from "@/lib/supabase/server";
import {
  formatCertificateDate,
  resolveCertificateIssuerName,
} from "@/lib/certificates/types";
import {
  normalizeCertificateSerial,
  parseVerifySerial,
} from "@/lib/certificates/copy";

export type PublicCertificateRecord = {
  serialNumber: string;
  trainingTitle: string;
  completedOn: string;
  issuerName: string;
  recipientName: string;
};

type VerifyRow = {
  serial_number?: string | null;
  training_title?: string | null;
  issued_at?: string | null;
  issuer_name?: string | null;
  recipient_name?: string | null;
};

function mapVerifyRow(row: VerifyRow | null): PublicCertificateRecord | null {
  const serial = normalizeCertificateSerial(row?.serial_number ?? "");
  if (!serial) return null;
  return {
    serialNumber: serial,
    trainingTitle: row?.training_title?.trim() || "Training",
    completedOn: row?.issued_at ? formatCertificateDate(row.issued_at) : "",
    issuerName: resolveCertificateIssuerName({ storedName: row?.issuer_name }),
    recipientName: row?.recipient_name?.trim() || "",
  };
}

export async function lookupPublicCertificate(
  serialRaw: string
): Promise<PublicCertificateRecord | null> {
  const serial = parseVerifySerial(serialRaw);
  if (!serial) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("verify_certificate_serial", {
    p_serial: serial,
  });

  if (error) {
    console.error("[certificates.verify] lookup failed", error.message);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return null;
  return mapVerifyRow(row as VerifyRow);
}
