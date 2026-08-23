import { isIdentityStaffRole, type IdentityStaffRole } from "@/lib/identity/sso";

export type ScimProvisionRequest = {
  action: "provision" | "deprovision" | "role_change";
  email: string;
  groupId: string;
  staffRole: IdentityStaffRole | null;
  externalId: string | null;
  displayName: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function firstEmail(value: unknown): string | null {
  if (typeof value === "string" && value.includes("@")) return value.trim().toLowerCase();
  if (!Array.isArray(value)) return null;
  const primary = value.find((item) => asRecord(item)?.primary === true);
  const rows = [primary, ...value];
  for (const item of rows) {
    const row = asRecord(item);
    const email = typeof row?.value === "string" ? row.value : typeof item === "string" ? item : "";
    if (email.includes("@")) return email.trim().toLowerCase();
  }
  return null;
}

function readExtensionRole(body: Record<string, unknown>): unknown {
  return (
    body.staffRole ??
    body.staff_role ??
    body.role ??
    asRecord(body["urn:ietf:params:scim:schemas:extension:fathers:2.0:User"])?.role ??
    asRecord(body["urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"])?.department
  );
}

export function parseScimUserPayload(
  body: unknown,
  fallbackGroupId?: string | null
): ScimProvisionRequest | null {
  const row = asRecord(body);
  if (!row) return null;

  const email =
    firstEmail(row.emails) ??
    (typeof row.userName === "string" ? row.userName.trim().toLowerCase() : "") ??
    (typeof row.email === "string" ? row.email.trim().toLowerCase() : "");
  if (!email || !email.includes("@")) return null;

  const extension = asRecord(row["urn:ietf:params:scim:schemas:extension:fathers:2.0:User"]);
  const groupId =
    (typeof row.groupId === "string" && row.groupId) ||
    (typeof row.group_id === "string" && row.group_id) ||
    (typeof extension?.groupId === "string" && extension.groupId) ||
    fallbackGroupId ||
    "";
  if (!groupId) return null;

  const active = row.active === false ? false : true;
  const explicitAction =
    row.action === "provision" || row.action === "deprovision" || row.action === "role_change"
      ? row.action
      : null;
  const staffRole = isIdentityStaffRole(readExtensionRole(row))
    ? (String(readExtensionRole(row)).toLowerCase() as IdentityStaffRole)
    : isIdentityStaffRole(extension?.role)
      ? (String(extension?.role).toLowerCase() as IdentityStaffRole)
      : null;

  const action =
    explicitAction ??
    (active === false ? "deprovision" : staffRole ? "provision" : "provision");

  return {
    action,
    email,
    groupId,
    staffRole: action === "deprovision" ? staffRole : staffRole ?? "manager",
    externalId:
      typeof row.externalId === "string"
        ? row.externalId
        : typeof row.id === "string"
          ? row.id
          : null,
    displayName:
      typeof asRecord(row.name)?.formatted === "string"
        ? String(asRecord(row.name)?.formatted)
        : typeof row.displayName === "string"
          ? row.displayName
          : null,
  };
}

export function identityScimToken() {
  const token = process.env.IDENTITY_SCIM_TOKEN?.trim();
  return token || null;
}

export function scimAuthorized(header: string | null) {
  const token = identityScimToken();
  if (!token) return false;
  const raw = header?.trim() ?? "";
  const bearer = raw.toLowerCase().startsWith("bearer ") ? raw.slice(7).trim() : raw;
  return bearer.length > 0 && bearer === token;
}
