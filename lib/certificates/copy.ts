/** Counsel-approved misuse lines. Completion-only. No fitness claim. */
export const CERTIFICATE_MISUSE_DISCLAIMER =
  "This certificate records completion of a Fathers.com training. It is not a finding of court fitness, not a finding of reunification safety, not clinical treatment, and not a substitute for professional evaluation.";

export const CERTIFICATE_PROOF_LABEL = "Leader-issued completion proof";

export const CERTIFICATE_SERIAL_PATTERN = /^FC-\d{4}-[A-Z0-9]{6,12}$/;

export function normalizeCertificateSerial(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function isCertificateSerial(value: string) {
  return CERTIFICATE_SERIAL_PATTERN.test(normalizeCertificateSerial(value));
}

export function parseVerifySerial(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return "";
  const serial = normalizeCertificateSerial(raw);
  return isCertificateSerial(serial) ? serial : "";
}

export { certificateVerifyPath } from "@/lib/certificates/types";

export function mintCertificateSerial(issuedAt = new Date()) {
  return `FC-${issuedAt.getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}
