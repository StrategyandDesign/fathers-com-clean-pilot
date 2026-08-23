import { SUPERVISION_CHECKLIST_ITEMS, isFidelitySectionKey } from "@/lib/fidelity/checklist";
import { loadFacilitatorRegistry, loadSupervisionTemplate } from "@/lib/fidelity/data";
import type { FacilitatorExportRow, FidelityExportBoard } from "@/lib/fidelity/export";
import { loadGroupsForManager } from "@/lib/org-staff/membership";
import { createClient } from "@/lib/supabase/server";

function missingRelation(error: { message?: string; code?: string } | null, name: string) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    new RegExp(name, "i").test(error.message ?? "")
  );
}

type RunRow = {
  id: string;
  group_id: string;
  training_id: string | null;
};

type CheckRow = {
  item_key: string;
  completed_by: string | null;
  completed_at: string | null;
  notes: string | null;
};

async function profileNames(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map<string, string>();
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("id, full_name").in("id", unique);
  if (error) throw error;
  return new Map(
    ((data ?? []) as Array<{ id: string; full_name: string | null }>).map((row) => [
      row.id,
      row.full_name?.trim() || "Leader",
    ])
  );
}

export async function loadQiPacketFidelityBoards(managerId: string): Promise<FidelityExportBoard[]> {
  const groups = await loadGroupsForManager(managerId);
  if (groups.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fidelity_runs")
    .select("id, group_id, training_id")
    .in(
      "group_id",
      groups.map((group) => group.id)
    );
  if (error) {
    if (missingRelation(error, "fidelity_runs")) return [];
    throw error;
  }
  const runs = (data ?? []) as RunRow[];
  if (runs.length === 0) return [];

  const template = await loadSupervisionTemplate();
  const items = template?.items ?? SUPERVISION_CHECKLIST_ITEMS;
  const groupName = new Map(groups.map((group) => [group.id, group.name]));
  const trainingIds = runs.map((run) => run.training_id).filter((id): id is string => Boolean(id));
  const trainingTitles = new Map<string, string>();
  if (trainingIds.length > 0) {
    const { data: trainings } = await supabase.from("trainings").select("id, title").in("id", trainingIds);
    for (const row of (trainings ?? []) as Array<{ id: string; title: string | null }>) {
      trainingTitles.set(row.id, row.title?.trim() ?? "");
    }
  }

  const boards: FidelityExportBoard[] = [];
  for (const run of runs) {
    const { data: checks, error: checkError } = await supabase
      .from("fidelity_check_items")
      .select("item_key, completed_by, completed_at, notes")
      .eq("run_id", run.id);
    if (checkError) {
      if (missingRelation(checkError, "fidelity_check_items")) break;
      throw checkError;
    }
    const rows = (checks ?? []) as CheckRow[];
    const names = await profileNames(
      rows.map((row) => row.completed_by).filter((id): id is string => Boolean(id))
    );
    const byKey = new Map(rows.map((row) => [row.item_key, row]));
    boards.push({
      groupId: run.group_id,
      groupName: groupName.get(run.group_id) ?? "Organization",
      trainingId: run.training_id ?? "",
      trainingTitle: run.training_id ? trainingTitles.get(run.training_id) ?? "" : "",
      items: items.map((item) => {
        const check = byKey.get(item.key);
        return {
          itemKey: item.key,
          section: isFidelitySectionKey(item.section) ? item.section : "session_one",
          prompt: item.prompt,
          completedBy: check?.completed_by ? names.get(check.completed_by) ?? "Leader" : "",
          completedAt: check?.completed_at ?? "",
          notes: check?.notes?.trim() ?? "",
        };
      }),
    });
  }
  return boards;
}

export async function loadQiPacketCredentials(managerId: string): Promise<FacilitatorExportRow[]> {
  try {
    const rows = await loadFacilitatorRegistry(managerId);
    return rows.map((row) => ({
      orgId: row.orgId,
      orgName: row.orgName,
      userId: row.userId,
      name: row.name,
      status: row.status,
      earnedAt: row.earnedAt ?? "",
      evidencePath: row.evidencePath,
      attestedBy: row.attestedByName,
    }));
  } catch {
    return [];
  }
}

