export const EXPORT_DESTINATION_KINDS = [
  "https_url",
  "s3_uri",
  "webhook",
  "ehr",
  "local_feed",
  "other",
] as const;

export type ExportDestinationKind = (typeof EXPORT_DESTINATION_KINDS)[number];

export const EXPORT_DESTINATION_KIND_LABEL: Record<ExportDestinationKind, string> = {
  https_url: "HTTPS URL (metadata only)",
  s3_uri: "S3 URI (metadata only)",
  webhook: "Webhook (metadata only)",
  ehr: "Electronic health record host (metadata only)",
  local_feed: "Local completion feed token",
  other: "Other (metadata only)",
};

export const EXPORT_PUSH_EVENT_KINDS = [
  "intent_recorded",
  "not_enabled",
  "not_configured",
] as const;

export type ExportPushEventKind = (typeof EXPORT_PUSH_EVENT_KINDS)[number];

export const EXPORT_PACKET_KINDS = ["qi_packet", "completion_feed"] as const;

export type ExportPacketKind = (typeof EXPORT_PACKET_KINDS)[number];

export function isExportDestinationKind(value: string): value is ExportDestinationKind {
  return (EXPORT_DESTINATION_KINDS as readonly string[]).includes(value);
}

export function isExportPacketKind(value: string): value is ExportPacketKind {
  return (EXPORT_PACKET_KINDS as readonly string[]).includes(value);
}

export const DESTINATION_LABEL_MAX = 80;
export const DESTINATION_HINT_MAX = 300;
export const DESTINATION_NOTES_MAX = 280;

export function clipDestinationText(value: string, max: number) {
  return value.trim().slice(0, max);
}
