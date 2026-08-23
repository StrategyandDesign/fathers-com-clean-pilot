import {
  type CounselPackState,
  counselPackNeedsEmptyState,
} from "@/lib/counsel/pack";
import type { Translate } from "@/lib/i18n/translate";

export type SsoConnection = {
  connected: boolean;
  providerName?: string | null;
} | null;

export type SsoStatus = "not_connected" | "connected";

export type PackTrustStatus = "drafts_available" | "checklist_open" | "attached_mark";

export type TrustStatusView = {
  ssoStatus: SsoStatus;
  ssoProviderName: string | null;
  packStatus: PackTrustStatus;
  counselHref: "/manager/account/counsel" | "/admin/account/counsel";
};

export type TrustStatusLine = {
  key: "sso" | "pack" | "contact";
  label: string;
  value: string;
  note: string;
  href?: TrustStatusView["counselHref"];
  linkLabel?: string;
};

export function parseSsoConnection(value: unknown): SsoConnection {
  if (!value || typeof value !== "object") return null;
  const row = value as { connected?: unknown; providerName?: unknown };
  if (row.connected !== true) {
    return { connected: false, providerName: null };
  }
  return {
    connected: true,
    providerName: typeof row.providerName === "string" && row.providerName.trim()
      ? row.providerName.trim()
      : null,
  };
}

export function resolveSsoStatus(connection: SsoConnection | undefined): SsoStatus {
  return connection?.connected ? "connected" : "not_connected";
}

export function resolvePackTrustStatus(states: CounselPackState[]): PackTrustStatus {
  if (states.some(counselPackNeedsEmptyState)) return "checklist_open";
  if (states.some((state) => state.required && state.attachedAt)) return "attached_mark";
  return "drafts_available";
}

export function buildTrustStatusView(input: {
  sso?: unknown;
  states: CounselPackState[];
  counselHref: TrustStatusView["counselHref"];
}): TrustStatusView {
  const connection = parseSsoConnection(input.sso);
  return {
    ssoStatus: resolveSsoStatus(connection),
    ssoProviderName: connection?.providerName ?? null,
    packStatus: resolvePackTrustStatus(input.states),
    counselHref: input.counselHref,
  };
}

export function trustStatusLines(model: TrustStatusView, t: Translate): TrustStatusLine[] {
  const ssoConnected = model.ssoStatus === "connected";
  const packNote =
    model.packStatus === "checklist_open"
      ? t("trust.packChecklist")
      : model.packStatus === "attached_mark"
        ? t("trust.packAttached")
        : t("trust.packDrafts");

  return [
    {
      key: "sso",
      label: t("trust.ssoLabel"),
      value: ssoConnected ? t("trust.ssoConnected") : t("trust.ssoNotConnected"),
      note: ssoConnected
        ? model.ssoProviderName
          ? t("trust.ssoConnectedNote", { name: model.ssoProviderName })
          : t("trust.ssoConnectedNoteGeneric")
        : t("trust.ssoComing"),
    },
    {
      key: "pack",
      label: t("trust.packLabel"),
      value: packNote,
      note: t("trust.packNeverExecuted"),
      href: model.counselHref,
      linkLabel: t("trust.openCounsel"),
    },
    {
      key: "contact",
      label: t("trust.contactLabel"),
      value: t("trust.contactStub"),
      note: t("trust.contactLead"),
      href: model.counselHref,
      linkLabel: t("trust.openContactStub"),
    },
  ];
}

export function trustStatusText(lines: TrustStatusLine[]) {
  return lines
    .map((line) =>
      [line.label, line.value, line.note, line.linkLabel].filter(Boolean).join(" ")
    )
    .join("\n");
}
