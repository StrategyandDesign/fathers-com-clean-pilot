"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import {
  clipDestinationText,
  DESTINATION_HINT_MAX,
  DESTINATION_LABEL_MAX,
  DESTINATION_NOTES_MAX,
  isExportDestinationKind,
  isExportPacketKind,
} from "@/lib/export/kinds";
import { describePushOutcome, refuseExternalPush, recordLocalPushIntent } from "@/lib/export/push";
import { mintExportFeedToken } from "@/lib/export/token";
import { secureExportEnabled } from "@/lib/flags";
import { isManagerOfGroup } from "@/lib/org-staff/membership";
import { allowActionRateLimit } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function ok(path: string, notice: string): never {
  redirect(`${path}?notice=${encodeURIComponent(notice)}`);
}

function returnPath(formData: FormData) {
  const raw = String(formData.get("return_to") ?? "").trim();
  if (raw.startsWith("/manager/reports") || raw.startsWith("/admin/organizations/")) {
    return raw.split("?")[0] ?? raw;
  }
  return "/manager/reports";
}

async function assertCanEditDestination(groupId: string, path: string) {
  const { user, role } = await requireRole(roleHint(path));
  if (!groupId) fail(path, "Choose an organization.");
  if (role === "admin") return { user, role };
  const supabase = await createClient();
  if (!(await isManagerOfGroup(supabase, user.id, groupId))) {
    fail(path, "That group is not yours.");
  }
  return { user, role };
}

function roleHint(path: string): "admin" | "manager" {
  return path.startsWith("/admin/") ? "admin" : "manager";
}

export async function saveExportDestination(formData: FormData) {
  const path = returnPath(formData);
  await requireRole(roleHint(path));
  if (!secureExportEnabled()) {
    fail(path, refuseExternalPush("not_enabled").message);
  }
  if (!(await allowActionRateLimit("org.export_destinations"))) {
    fail(path, "Too many destination changes. Try again in a few minutes.");
  }

  const groupId = String(formData.get("group_id") ?? "").trim();
  const { user } = await assertCanEditDestination(groupId, path);
  const label = clipDestinationText(String(formData.get("label") ?? ""), DESTINATION_LABEL_MAX);
  const kindRaw = String(formData.get("destination_kind") ?? "").trim();
  const endpointHint = clipDestinationText(
    String(formData.get("endpoint_hint") ?? ""),
    DESTINATION_HINT_MAX
  );
  const notes = clipDestinationText(String(formData.get("notes") ?? ""), DESTINATION_NOTES_MAX);

  if (label.length < 2) fail(path, "Give the destination a short label.");
  if (!isExportDestinationKind(kindRaw)) fail(path, "Choose a destination kind.");

  const feed = kindRaw === "local_feed" ? mintExportFeedToken() : null;
  const supabase = await createClient();
  const { error } = await supabase.from("org_export_destinations").insert({
    group_id: groupId,
    label,
    destination_kind: kindRaw,
    endpoint_hint: endpointHint || null,
    notes: notes || null,
    feed_token_hash: feed?.hash ?? null,
    created_by: user.id,
  });
  if (error) fail(path, error.message);

  revalidatePath("/manager/reports");
  revalidatePath(`/admin/organizations/${groupId}`);
  ok(
    path,
    feed
      ? `Saved local feed metadata. Token (shown once): ${feed.token}`
      : "Saved destination metadata. This desk does not send files to an outside host."
  );
}

export async function recordExportSendIntent(formData: FormData) {
  const path = returnPath(formData);
  await requireRole(roleHint(path));
  if (!(await allowActionRateLimit("org.export_destinations"))) {
    fail(path, "Too many send attempts. Try again in a few minutes.");
  }

  const groupId = String(formData.get("group_id") ?? "").trim();
  const confirmed = String(formData.get("confirm_local_only") ?? "") === "on";
  const packetRaw = String(formData.get("packet_kind") ?? "qi_packet").trim();
  const packetKind = isExportPacketKind(packetRaw) ? packetRaw : "qi_packet";
  const destinationId = String(formData.get("destination_id") ?? "").trim() || null;

  if (!confirmed) {
    fail(path, "Confirm that this desk does not send files to an outside host.");
  }

  if (!secureExportEnabled()) {
    fail(path, refuseExternalPush("not_enabled", packetKind).message);
  }

  const { user } = await assertCanEditDestination(groupId, path);
  if (!destinationId) {
    fail(path, refuseExternalPush("not_configured", packetKind).message);
  }

  const outcome = recordLocalPushIntent(packetKind);
  const supabase = await createClient();
  const { error } = await supabase.from("export_push_events").insert({
    group_id: groupId,
    destination_id: destinationId,
    event_kind: outcome.eventKind,
    packet_kind: packetKind,
    actor_id: user.id,
    note: describePushOutcome(outcome.eventKind),
  });
  if (error) fail(path, error.message);

  revalidatePath("/manager/reports");
  revalidatePath(`/admin/organizations/${groupId}`);
  ok(path, outcome.message);
}
