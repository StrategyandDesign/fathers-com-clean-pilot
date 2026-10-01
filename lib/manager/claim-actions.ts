"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { resolveFatherClaimId } from "@/lib/certificates/claims";
import { groupIdForFather } from "@/lib/org-staff/activity";
import { isManagerOfGroup } from "@/lib/org-staff/membership";
import { createClient } from "@/lib/supabase/server";

function back(message: string, kind: "error" | "notice"): never {
  redirect(`/manager?${kind}=${encodeURIComponent(message)}`);
}

/** Explicit claim for a man already on this Leader's roster. Does not send anything. */
export async function claimFatherSeat(formData: FormData) {
  const { user } = await requireRole("manager");
  const fatherId = String(formData.get("father_id") ?? "").trim();
  if (!fatherId) back("Choose a man to claim.", "error");

  const supabase = await createClient();
  const groupId = await groupIdForFather(supabase, fatherId);
  if (!groupId || !(await isManagerOfGroup(supabase, user.id, groupId))) {
    back("That man is not in your organization.", "error");
  }

  const claimId = await resolveFatherClaimId(supabase, fatherId);
  revalidatePath("/manager");
  revalidatePath("/manager/reports");
  if (!claimId) back("The seat did not claim. Try again.", "error");
  back("Seat claimed.", "notice");
}
