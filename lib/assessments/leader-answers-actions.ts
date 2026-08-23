"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function ok(path: string, notice: string): never {
  redirect(`${path}?notice=${encodeURIComponent(notice)}`);
}

function readGroupId(formData: FormData) {
  const groupId = String(formData.get("group_id") ?? "").trim();
  if (!groupId) fail("/admin/organizations", "Choose an organization.");
  return groupId;
}

function returnPath(formData: FormData, groupId: string) {
  const raw = String(formData.get("return_to") ?? "").trim();
  if (raw === `/admin/organizations/${groupId}`) return raw;
  return `/admin/organizations/${groupId}`;
}

export async function setLeaderAssessmentAnswers(formData: FormData) {
  const { user } = await requireRole("admin");
  const groupId = readGroupId(formData);
  const path = returnPath(formData, groupId);
  const enabled = String(formData.get("leader_assessment_answers") ?? "") === "on";

  const supabase = await createClient();
  const { error } = await supabase.from("group_leader_assessment_answers").upsert(
    {
      group_id: groupId,
      enabled,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    },
    { onConflict: "group_id" }
  );
  if (error) fail(path, error.message);

  revalidatePath("/admin/organizations");
  revalidatePath(path);
  revalidatePath("/manager/assessments");
  ok(
    path,
    enabled
      ? "leader_assessment_answers is on. Leaders can read custom assessment answers for this organization."
      : "leader_assessment_answers is off. Leaders see completion status only."
  );
}
