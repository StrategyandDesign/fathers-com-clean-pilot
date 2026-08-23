import { createClient } from "@/lib/supabase/server";
import {
  isExportDestinationKind,
  type ExportDestinationKind,
  type ExportPacketKind,
  type ExportPushEventKind,
} from "@/lib/export/kinds";

function missingRelation(error: { message?: string; code?: string } | null, name: string) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    new RegExp(name, "i").test(error.message ?? "")
  );
}

export type OrgExportDestination = {
  id: string;
  groupId: string;
  label: string;
  destinationKind: ExportDestinationKind;
  endpointHint: string;
  hasFeedToken: boolean;
  notes: string;
  createdAt: string;
};

export type ExportPushEvent = {
  id: string;
  groupId: string;
  destinationId: string | null;
  eventKind: ExportPushEventKind;
  packetKind: ExportPacketKind;
  note: string;
  createdAt: string;
};

type DestinationRow = {
  id: string;
  group_id: string;
  label: string;
  destination_kind: string;
  endpoint_hint: string | null;
  feed_token_hash: string | null;
  notes: string | null;
  created_at: string;
};

type EventRow = {
  id: string;
  group_id: string;
  destination_id: string | null;
  event_kind: string;
  packet_kind: string;
  note: string | null;
  created_at: string;
};

function toDestination(row: DestinationRow): OrgExportDestination | null {
  if (!isExportDestinationKind(row.destination_kind)) return null;
  return {
    id: row.id,
    groupId: row.group_id,
    label: row.label,
    destinationKind: row.destination_kind,
    endpointHint: row.endpoint_hint?.trim() ?? "",
    hasFeedToken: Boolean(row.feed_token_hash),
    notes: row.notes?.trim() ?? "",
    createdAt: row.created_at,
  };
}

export async function loadExportDestinations(groupIds: string[]): Promise<OrgExportDestination[]> {
  const ids = [...new Set(groupIds.filter(Boolean))];
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("org_export_destinations")
    .select("id, group_id, label, destination_kind, endpoint_hint, feed_token_hash, notes, created_at")
    .in("group_id", ids)
    .order("created_at", { ascending: false });
  if (error) {
    if (missingRelation(error, "org_export_destinations")) return [];
    throw error;
  }
  return ((data ?? []) as DestinationRow[]).flatMap((row) => {
    const parsed = toDestination(row);
    return parsed ? [parsed] : [];
  });
}

export async function loadExportPushEvents(
  groupIds: string[],
  limit = 8
): Promise<ExportPushEvent[]> {
  const ids = [...new Set(groupIds.filter(Boolean))];
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("export_push_events")
    .select("id, group_id, destination_id, event_kind, packet_kind, note, created_at")
    .in("group_id", ids)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (missingRelation(error, "export_push_events")) return [];
    throw error;
  }
  return ((data ?? []) as EventRow[]).map((row) => ({
    id: row.id,
    groupId: row.group_id,
    destinationId: row.destination_id,
    eventKind: row.event_kind as ExportPushEventKind,
    packetKind: row.packet_kind as ExportPacketKind,
    note: row.note?.trim() ?? "",
    createdAt: row.created_at,
  }));
}

export async function lookupFeedDestinationByHash(tokenHash: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("lookup_export_feed", { token_hash: tokenHash });
  if (error) {
    if (missingRelation(error, "lookup_export_feed")) return null;
    throw error;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return null;
  const record = row as { destination_id?: string; group_id?: string; label?: string };
  if (!record.destination_id || !record.group_id) return null;
  return {
    destinationId: record.destination_id,
    groupId: record.group_id,
    label: record.label?.trim() ?? "",
  };
}
