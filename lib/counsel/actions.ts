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

function readGroupId(formData: FormData, fallbackPath: string) {
  const groupId = String(formData.get("group_id") ?? "").trim();
  if (!groupId) fail(fallbackPath, "Choose an organization.");
  return groupId;
}

function returnPath(formData: FormData, groupId: string) {
  const raw = String(formData.get("return_to") ?? "").trim();
  if (raw === "/admin/account/counsel") return raw;
  if (raw === `/admin/organizations/${groupId}`) return raw;
  return `/admin/organizations/${groupId}`;
}

function revalidateCounsel(path: string) {
  revalidatePath("/admin/organizations");
  revalidatePath(path);
  revalidatePath("/admin/account");
  revalidatePath("/admin/account/counsel");
  revalidatePath("/manager/account");
  revalidatePath("/manager/account/counsel");
  revalidatePath("/manager/reports");
}

export async function setCounselPackRequired(formData: FormData) {
  await requireRole("admin");
  const groupId = readGroupId(formData, "/admin/organizations");
  const path = returnPath(formData, groupId);
  const required = String(formData.get("counsel_pack_required") ?? "") === "on";

  const supabase = await createClient();
  const { error } = await supabase.from("group_counsel_pack").upsert(
    {
      group_id: groupId,
      required,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "group_id" }
  );
  if (error) fail(path, error.message);

  revalidateCounsel(path);
  ok(
    path,
    required
      ? "Counsel pack requirement is on. Leaders see the checklist until you mark the pack attached."
      : "Counsel pack requirement is off. The checklist is hidden."
  );
}

export async function markCounselPackAttached(formData: FormData) {
  const { user } = await requireRole("admin");
  const groupId = readGroupId(formData, "/admin/organizations");
  const path = returnPath(formData, groupId);

  const supabase = await createClient();
  const { data: current, error: currentError } = await supabase
    .from("group_counsel_pack")
    .select("required")
    .eq("group_id", groupId)
    .maybeSingle();
  if (currentError) fail(path, currentError.message);

  const { error } = await supabase.from("group_counsel_pack").upsert(
    {
      group_id: groupId,
      required: current?.required === true,
      attached_at: new Date().toISOString(),
      attached_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "group_id" }
  );
  if (error) fail(path, error.message);

  revalidateCounsel(path);
  ok(
    path,
    "Recorded that a counsel pack was attached. That mark is metadata only. The downloads stay drafts."
  );
}

export async function clearCounselPackAttached(formData: FormData) {
  await requireRole("admin");
  const groupId = readGroupId(formData, "/admin/organizations");
  const path = returnPath(formData, groupId);

  const supabase = await createClient();
  const { data: current, error: currentError } = await supabase
    .from("group_counsel_pack")
    .select("required")
    .eq("group_id", groupId)
    .maybeSingle();
  if (currentError) fail(path, currentError.message);

  const { error } = await supabase.from("group_counsel_pack").upsert(
    {
      group_id: groupId,
      required: current?.required === true,
      attached_at: null,
      attached_by: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "group_id" }
  );
  if (error) fail(path, error.message);

  revalidateCounsel(path);
  ok(path, "Cleared the attached-pack mark. Downloads were already drafts.");
}
