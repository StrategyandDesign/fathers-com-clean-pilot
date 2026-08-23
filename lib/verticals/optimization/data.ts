import "server-only";

import { latestPracticeLight } from "@/lib/father/skill-use";
import { parseOrganizationType, type OrganizationType } from "@/lib/organization-type";
import { createClient } from "@/lib/supabase/server";
import { buildCommitmentBoard, type CommitmentBoardRow } from "@/lib/verticals/optimization/commitment";

function missingRelation(error: { message?: string; code?: string } | null, name: string) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    new RegExp(name, "i").test(error.message ?? "")
  );
}

export async function loadFatherOrganizationType(fatherId: string): Promise<OrganizationType | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("group_members")
      .select("groups(organization_type)")
      .eq("father_id", fatherId)
      .maybeSingle();
    if (error) return null;
    const group = data?.groups as
      | { organization_type?: string | null }
      | { organization_type?: string | null }[]
      | null;
    const row = Array.isArray(group) ? group[0] : group;
    return parseOrganizationType(row?.organization_type);
  } catch {
    return null;
  }
}

export async function loadFatherCommitmentBoard(fatherId: string): Promise<CommitmentBoardRow[]> {
  try {
    const supabase = await createClient();
    const { data: membership, error: membershipError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("father_id", fatherId)
      .maybeSingle();
    if (membershipError || !membership?.group_id) return [];

    const { data: members, error: membersError } = await supabase
      .from("group_members")
      .select("father_id")
      .eq("group_id", membership.group_id);
    if (membersError) return [];
    const fatherIds = [...new Set((members ?? []).map((row) => String(row.father_id)))];
    if (fatherIds.length === 0) return [];

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", fatherIds);
    if (profileError && !missingRelation(profileError, "profiles")) return [];

    const { data: progress, error: progressError } = await supabase
      .from("session_progress")
      .select("father_id, skill_use, skill_use_at, completed_at")
      .in("father_id", fatherIds);
    if (progressError && !/skill_use/i.test(progressError.message ?? "")) return [];

    type ProgressRow = {
      father_id?: string;
      skill_use?: string | null;
      skill_use_at?: string | null;
      completed_at?: string | null;
    };
    const progressByFather = new Map<string, ProgressRow[]>();
    for (const row of (progress ?? []) as ProgressRow[]) {
      const id = String(row.father_id);
      const list = progressByFather.get(id) ?? [];
      list.push(row);
      progressByFather.set(id, list);
    }

    const nameById = new Map(
      (profiles ?? []).map((row) => [String(row.id), String(row.full_name ?? "")])
    );

    return buildCommitmentBoard(
      fatherIds.map((id) => ({
        fatherId: id,
        name: nameById.get(id) ?? "",
        practiceLight: latestPracticeLight(progressByFather.get(id) ?? []),
      }))
    );
  } catch {
    return [];
  }
}
