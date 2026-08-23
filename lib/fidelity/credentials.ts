export const FACILITATOR_CREDENTIAL_STATUSES = [
  "training",
  "certified",
  "suspended",
] as const;

export type FacilitatorCredentialStatus = (typeof FACILITATOR_CREDENTIAL_STATUSES)[number];

export const FACILITATOR_EVIDENCE_MAX = 200;

export const FACILITATOR_STATUS_LABEL_KEY: Record<FacilitatorCredentialStatus, string> = {
  training: "fidelity.credentialTraining",
  certified: "fidelity.credentialCertified",
  suspended: "fidelity.credentialSuspended",
};

export function isFacilitatorCredentialStatus(
  value: unknown
): value is FacilitatorCredentialStatus {
  return (
    typeof value === "string" &&
    (FACILITATOR_CREDENTIAL_STATUSES as readonly string[]).includes(value)
  );
}

export function parseFacilitatorCredentialStatus(
  value: unknown
): FacilitatorCredentialStatus | null {
  return isFacilitatorCredentialStatus(value) ? value : null;
}

export function clipEvidencePath(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";
  return raw.slice(0, FACILITATOR_EVIDENCE_MAX);
}

export function parseEarnedAt(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : raw;
}

export function defaultEarnedAtForStatus(
  status: FacilitatorCredentialStatus,
  existing: string | null
) {
  if (status === "training") return existing;
  return existing;
}
