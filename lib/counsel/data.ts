import { cache } from "react";

import {
  emptyCounselPackState,
  parseCounselPackRequired,
  type CounselPackState,
} from "@/lib/counsel/pack";
import { loadGroupsForManager } from "@/lib/org-staff/membership";
import { createClient } from "@/lib/supabase/server";

function missingRelation(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /group_counsel_pack/i.test(error.message ?? "")
  );
}

type CounselRow = {
  group_id: string;
  required: boolean | null;
  attached_at: string | null;
  attached_by: string | null;
};

function asState(
  groupId: string,
  groupName: string,
  row: CounselRow | undefined
): CounselPackState {
  if (!row) return emptyCounselPackState(groupId, groupName);
  return {
    groupId,
    groupName,
    required: parseCounselPackRequired(row.required),
    attachedAt: typeof row.attached_at === "string" ? row.attached_at : null,
    attachedBy: typeof row.attached_by === "string" ? row.attached_by : null,
  };
}

export async function loadCounselPackRows(groupIds: string[]): Promise<CounselRow[]> {
  if (groupIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_counsel_pack")
    .select("group_id, required, attached_at, attached_by")
    .in("group_id", groupIds);
  if (error) {
    if (missingRelation(error)) return [];
    throw error;
  }
  return (data ?? []) as CounselRow[];
}

export const loadCounselPackStatesForGroups = cache(
  async (groups: Array<{ id: string; name: string }>): Promise<CounselPackState[]> => {
    const rows = await loadCounselPackRows(groups.map((group) => group.id));
    const byId = new Map(rows.map((row) => [row.group_id, row]));
    return groups.map((group) => asState(group.id, group.name, byId.get(group.id)));
  }
);

export const loadManagerCounselPackStates = cache(async (managerId: string) => {
  const groups = await loadGroupsForManager(managerId);
  return loadCounselPackStatesForGroups(groups);
});

export const loadAdminCounselPackStates = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("groups").select("id, name").order("name");
  if (error) throw error;
  return loadCounselPackStatesForGroups((data ?? []) as Array<{ id: string; name: string }>);
});

export async function loadCounselPackState(groupId: string, groupName: string) {
  const [state] = await loadCounselPackStatesForGroups([{ id: groupId, name: groupName }]);
  return state ?? emptyCounselPackState(groupId, groupName);
}
