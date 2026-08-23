"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { clipFidelityNote } from "@/lib/fidelity/checklist";
import {
  clipEvidencePath,
  parseEarnedAt,
  parseFacilitatorCredentialStatus,
} from "@/lib/fidelity/credentials";
import { fidelityBoardEnabled } from "@/lib/flags";
import { isManagerOfGroup } from "@/lib/org-staff/membership";
import { allowActionRateLimit } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function ok(path: string, notice: string): never {
  redirect(`${path}?notice=${encodeURIComponent(notice)}`);
}

function revalidateFidelity(groupId?: string) {
  revalidatePath("/manager");
  revalidatePath("/manager/fidelity");
  revalidatePath("/manager/team/facilitators");
  revalidatePath("/manager/account");
  revalidatePath("/manager/reports");
  if (groupId) revalidatePath(`/manager/fidelity/${groupId}`);
}

async function requireFidelityManager(path: string) {
  const { user } = await requireRole("manager");
  if (!fidelityBoardEnabled()) fail(path, "This board is off.");
  if (!(await allowActionRateLimit("manager.fidelity"))) {
    fail(path, "flash.tooMany");
  }
  return { user, supabase: await createClient() };
}

export async function saveFidelityCheckItem(formData: FormData) {
  const runId = String(formData.get("run_id") ?? "").trim();
  const itemKey = String(formData.get("item_key") ?? "").trim();
  const returnTo = String(formData.get("return_to") ?? "").trim() || "/manager/fidelity";
  const completed = String(formData.get("completed") ?? "") === "1";
  const notes = clipFidelityNote(formData.get("notes"));

  if (!runId || !itemKey) fail(returnTo, "Choose a checklist item.");

  const { user, supabase } = await requireFidelityManager(returnTo);
  const { data: run, error: runError } = await supabase
    .from("fidelity_runs")
    .select("id, group_id")
    .eq("id", runId)
    .maybeSingle();
  if (runError || !run) fail(returnTo, "That checklist was not found.");
  if (!(await isManagerOfGroup(supabase, user.id, run.group_id))) {
    fail(returnTo, "That group is not yours.");
  }

  const { data: current } = await supabase
    .from("fidelity_check_items")
    .select("completed_by, completed_at")
    .eq("run_id", runId)
    .eq("item_key", itemKey)
    .maybeSingle();
  const alreadyDone = Boolean(current?.completed_at);
  const { error } = await supabase.from("fidelity_check_items").upsert(
    {
      run_id: runId,
      item_key: itemKey,
      completed_by: completed
        ? alreadyDone
          ? current?.completed_by ?? user.id
          : user.id
        : null,
      completed_at: completed
        ? alreadyDone
          ? current?.completed_at ?? new Date().toISOString()
          : new Date().toISOString()
        : null,
      notes,
    },
    { onConflict: "run_id,item_key" }
  );
  if (error) fail(returnTo, error.message);

  revalidateFidelity(run.group_id);
  revalidatePath(returnTo);
  ok(returnTo, "Saved.");
}

export async function saveFacilitatorCredential(formData: FormData) {
  const orgId = String(formData.get("org_id") ?? "").trim();
  const userId = String(formData.get("user_id") ?? "").trim();
  const returnTo =
    String(formData.get("return_to") ?? "").trim() || "/manager/team/facilitators";
  const status = parseFacilitatorCredentialStatus(formData.get("status"));
  const evidencePath = clipEvidencePath(formData.get("evidence_path"));
  const earnedDate = parseEarnedAt(formData.get("earned_at"));

  if (!orgId || !userId) fail(returnTo, "Choose a facilitator.");
  if (!status) fail(returnTo, "Choose In training, Certified, or Suspended.");

  const { user, supabase } = await requireFidelityManager(returnTo);
  if (!(await isManagerOfGroup(supabase, user.id, orgId))) {
    fail(returnTo, "That group is not yours.");
  }

  const earnedAt =
    status === "training"
      ? earnedDate
        ? `${earnedDate}T00:00:00.000Z`
        : null
      : earnedDate
        ? `${earnedDate}T00:00:00.000Z`
        : new Date().toISOString();

  const { error } = await supabase.from("facilitator_credentials").upsert(
    {
      user_id: userId,
      org_id: orgId,
      status,
      earned_at: earnedAt,
      evidence_path: evidencePath || null,
      attested_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,org_id" }
  );
  if (error) fail(returnTo, error.message);

  revalidateFidelity(orgId);
  ok(returnTo, "Attestation saved.");
}
