/**
 * Confirm-first send stub. This module records local intent only.
 * It must never fetch, POST, or otherwise transmit participant data
 * to a customer URL, S3 bucket, webhook, EHR, or third-party host.
 */

import type { ExportPacketKind, ExportPushEventKind } from "@/lib/export/kinds";

export const EXTERNAL_TRANSMIT_DISABLED = true;

export const PUSH_NOT_ENABLED =
  "secure_export_enabled is off. This desk does not send files to an outside host.";

export const PUSH_NOT_CONFIGURED =
  "No destination is configured. Destination metadata can be saved on this desk. Nothing is sent.";

export const PUSH_INTENT_RECORDED =
  "Send intent recorded locally. This desk does not send files to an outside host.";

export type PushRefusal = {
  ok: false;
  eventKind: ExportPushEventKind;
  packetKind: ExportPacketKind;
  message: string;
};

export type PushIntent = {
  ok: true;
  eventKind: "intent_recorded";
  packetKind: ExportPacketKind;
  message: string;
};

export function refuseExternalPush(
  reason: Exclude<ExportPushEventKind, "intent_recorded">,
  packetKind: ExportPacketKind = "qi_packet"
): PushRefusal {
  return {
    ok: false,
    eventKind: reason,
    packetKind,
    message: reason === "not_enabled" ? PUSH_NOT_ENABLED : PUSH_NOT_CONFIGURED,
  };
}

export function recordLocalPushIntent(packetKind: ExportPacketKind = "qi_packet"): PushIntent {
  return {
    ok: true,
    eventKind: "intent_recorded",
    packetKind,
    message: PUSH_INTENT_RECORDED,
  };
}

export function describePushOutcome(eventKind: ExportPushEventKind) {
  if (eventKind === "intent_recorded") return PUSH_INTENT_RECORDED;
  if (eventKind === "not_configured") return PUSH_NOT_CONFIGURED;
  return PUSH_NOT_ENABLED;
}
