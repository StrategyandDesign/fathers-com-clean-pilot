import { cache } from "react";

import {
  SUPERVISION_CHECKLIST_ITEMS,
  SUPERVISION_TEMPLATE_SLUG,
  fidelityProgress,
  isFidelitySectionKey,
  type FidelitySectionKey,
  type FidelityTemplateItem,
} from "@/lib/fidelity/checklist";
import {
  parseFacilitatorCredentialStatus,
  type FacilitatorCredentialStatus,
} from "@/lib/fidelity/credentials";
import { listAssignableTrainings } from "@/lib/manager/assignment-status";
import { loadManagerWorkspace } from "@/lib/manager/data";
import { loadGroupsForManager, loadOrganizationStaff } from "@/lib/org-staff/membership";
import { createClient } from "@/lib/supabase/server";

function missingRelation(error: { message?: string; code?: string } | null, name: string) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    new RegExp(name, "i").test(error.message ?? "")
  );
}

type TemplateRow = {
  id: string;
  slug: string;
  title: string;
  source_path: string;
  items: unknown;
};

type RunRow = {
  id: string;
  group_id: string;
  training_id: string | null;
  template_id: string;
  created_by: string | null;
  created_at: string;
};

type CheckRow = {
  id: string;
  run_id: string;
  item_key: string;
  completed_by: string | null;
  completed_at: string | null;
  notes: string | null;
};

type CredentialRow = {
  id: string;
  user_id: string;
  org_id: string;
  status: string;
  earned_at: string | null;
  evidence_path: string | null;
  attested_by: string | null;
  updated_at: string;
};

export type FidelityCheckItem = {
  id: string;
  itemKey: string;
  section: FidelitySectionKey;
  sort: number;
  prompt: string;
  completedBy: string | null;
  completedByName: string;
  completedAt: string | null;
  notes: string;
};

export type FidelityBoard = {
  runId: string;
  groupId: string;
  groupName: string;
  trainingId: string | null;
  trainingTitle: string;
  templateTitle: string;
  items: FidelityCheckItem[];
};

export type FidelityTarget = {
  id: string;
  kind: "cohort" | "training";
  title: string;
  subtitle: string;
  href: string;
  completed: number;
  total: number;
};

export type FacilitatorRegistryRow = {
  orgId: string;
  orgName: string;
  userId: string;
  name: string;
  staffRole: "manager" | "reviewer";
  status: FacilitatorCredentialStatus | "";
  earnedAt: string | null;
  evidencePath: string;
  attestedBy: string | null;
  attestedByName: string;
  credentialId: string | null;
};

function parseTemplateItems(value: unknown): FidelityTemplateItem[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [...SUPERVISION_CHECKLIST_ITEMS];
  }
  const parsed: FidelityTemplateItem[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    if (typeof item.key !== "string" || !isFidelitySectionKey(item.section)) continue;
    if (typeof item.prompt !== "string") continue;
    parsed.push({
      key: item.key,
      section: item.section,
      sort: typeof item.sort === "number" ? item.sort : parsed.length + 1,
      prompt: item.prompt,
    });
  }
  return parsed.length > 0 ? parsed.sort((a, b) => a.sort - b.sort) : [...SUPERVISION_CHECKLIST_ITEMS];
}

export async function loadSupervisionTemplate() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fidelity_templates")
    .select("id, slug, title, source_path, items")
    .eq("slug", SUPERVISION_TEMPLATE_SLUG)
    .maybeSingle();
  if (error) {
    if (missingRelation(error, "fidelity_templates")) return null;
    throw error;
  }
  if (!data) return null;
  const row = data as TemplateRow;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    sourcePath: row.source_path,
    items: parseTemplateItems(row.items),
  };
}

async function loadRun(
  groupId: string,
  trainingId: string | null
): Promise<RunRow | null> {
  const supabase = await createClient();
  let query = supabase
    .from("fidelity_runs")
    .select("id, group_id, training_id, template_id, created_by, created_at")
    .eq("group_id", groupId);
  query = trainingId ? query.eq("training_id", trainingId) : query.is("training_id", null);
  const { data, error } = await query.maybeSingle();
  if (error) {
    if (missingRelation(error, "fidelity_runs")) return null;
    throw error;
  }
  return (data as RunRow | null) ?? null;
}

async function loadCheckItems(runId: string): Promise<CheckRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fidelity_check_items")
    .select("id, run_id, item_key, completed_by, completed_at, notes")
    .eq("run_id", runId);
  if (error) {
    if (missingRelation(error, "fidelity_check_items")) return [];
    throw error;
  }
  return (data ?? []) as CheckRow[];
}

async function profileNames(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map<string, string>();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", unique);
  if (error) throw error;
  return new Map(
    ((data ?? []) as Array<{ id: string; full_name: string | null }>).map((row) => [
      row.id,
      row.full_name?.trim() || "Leader",
    ])
  );
}

function mergeBoardItems(
  templateItems: FidelityTemplateItem[],
  checks: CheckRow[],
  names: Map<string, string>
): FidelityCheckItem[] {
  const byKey = new Map(checks.map((row) => [row.item_key, row]));
  return templateItems.map((item) => {
    const check = byKey.get(item.key);
    return {
      id: check?.id ?? item.key,
      itemKey: item.key,
      section: item.section,
      sort: item.sort,
      prompt: item.prompt,
      completedBy: check?.completed_by ?? null,
      completedByName: check?.completed_by ? names.get(check.completed_by) ?? "Leader" : "",
      completedAt: check?.completed_at ?? null,
      notes: check?.notes?.trim() ?? "",
    };
  });
}

export async function ensureFidelityBoard(input: {
  managerId: string;
  groupId: string;
  trainingId?: string | null;
}): Promise<FidelityBoard | null> {
  const template = await loadSupervisionTemplate();
  if (!template) return null;

  const groups = await loadGroupsForManager(input.managerId);
  const group = groups.find((row) => row.id === input.groupId);
  if (!group) return null;

  let run = await loadRun(input.groupId, input.trainingId ?? null);
  const supabase = await createClient();
  if (!run) {
    const { data, error } = await supabase
      .from("fidelity_runs")
      .insert({
        group_id: input.groupId,
        training_id: input.trainingId ?? null,
        template_id: template.id,
        created_by: input.managerId,
      })
      .select("id, group_id, training_id, template_id, created_by, created_at")
      .maybeSingle();
    if (error) {
      if (missingRelation(error, "fidelity_runs")) return null;
      if (error.code === "23505") {
        run = await loadRun(input.groupId, input.trainingId ?? null);
      } else {
        throw error;
      }
    } else {
      run = (data as RunRow | null) ?? null;
    }
  }
  if (!run) return null;

  const existing = await loadCheckItems(run.id);
  const have = new Set(existing.map((row) => row.item_key));
  const missing = template.items.filter((item) => !have.has(item.key));
  if (missing.length > 0) {
    const { error } = await supabase.from("fidelity_check_items").insert(
      missing.map((item) => ({
        run_id: run!.id,
        item_key: item.key,
        notes: "",
      }))
    );
    if (error && !missingRelation(error, "fidelity_check_items") && error.code !== "23505") {
      throw error;
    }
  }

  const checks = await loadCheckItems(run.id);
  const names = await profileNames(
    checks.map((row) => row.completed_by).filter((id): id is string => Boolean(id))
  );

  let trainingTitle = "";
  if (run.training_id) {
    const { data: training } = await supabase
      .from("trainings")
      .select("title")
      .eq("id", run.training_id)
      .maybeSingle();
    trainingTitle = (training as { title?: string } | null)?.title?.trim() ?? "";
  }

  return {
    runId: run.id,
    groupId: group.id,
    groupName: group.name,
    trainingId: run.training_id,
    trainingTitle,
    templateTitle: template.title,
    items: mergeBoardItems(template.items, checks, names),
  };
}

export const loadFidelityTargets = cache(async (managerId: string): Promise<FidelityTarget[]> => {
  const workspace = await loadManagerWorkspace(managerId);
  const template = await loadSupervisionTemplate();
  const total = template?.items.length ?? SUPERVISION_CHECKLIST_ITEMS.length;
  const supabase = await createClient();
  const groupIds = workspace.groups.map((group) => group.id);
  let runs: RunRow[] = [];
  if (groupIds.length > 0) {
    const { data, error } = await supabase
      .from("fidelity_runs")
      .select("id, group_id, training_id, template_id, created_by, created_at")
      .in("group_id", groupIds);
    if (error && !missingRelation(error, "fidelity_runs")) throw error;
    runs = (data ?? []) as RunRow[];
  }
  const runIds = runs.map((run) => run.id);
  const checks = runIds.length
    ? await Promise.all(runIds.map((id) => loadCheckItems(id)))
    : [];
  const checksByRun = new Map(runIds.map((id, index) => [id, checks[index] ?? []]));

  const targets: FidelityTarget[] = workspace.groups.map((group) => {
    const run = runs.find((row) => row.group_id === group.id && !row.training_id);
    const items = run ? checksByRun.get(run.id) ?? [] : [];
    const progress = fidelityProgress(items);
    return {
      id: group.id,
      kind: "cohort",
      title: group.name,
      subtitle: "Whole cohort",
      href: `/manager/fidelity/${group.id}`,
      completed: progress.completed,
      total,
    };
  });

  const trainings = listAssignableTrainings({
    trainings: workspace.trainings,
    groups: workspace.groups,
    reviews: workspace.reviews,
  });
  for (const training of trainings) {
    const run = runs.find((row) => row.training_id === training.id);
    const items = run ? checksByRun.get(run.id) ?? [] : [];
    const progress = fidelityProgress(items);
    targets.push({
      id: training.id,
      kind: "training",
      title: training.title,
      subtitle: "Training",
      href: `/manager/fidelity/${training.id}`,
      completed: progress.completed,
      total,
    });
  }
  return targets;
});

export async function resolveFidelityTarget(
  managerId: string,
  cohortOrTrainingId: string,
  groupQuery?: string | null
): Promise<{ groupId: string; trainingId: string | null } | null> {
  const groups = await loadGroupsForManager(managerId);
  const group = groups.find((row) => row.id === cohortOrTrainingId);
  if (group) return { groupId: group.id, trainingId: null };

  const workspace = await loadManagerWorkspace(managerId);
  const trainings = listAssignableTrainings({
    trainings: workspace.trainings,
    groups: workspace.groups,
    reviews: workspace.reviews,
  });
  const training = trainings.find((row) => row.id === cohortOrTrainingId);
  if (!training) return null;

  const preferred = groupQuery
    ? groups.find((row) => row.id === groupQuery)
    : groups[0];
  if (!preferred) return null;
  return { groupId: preferred.id, trainingId: training.id };
}

export const loadFacilitatorRegistry = cache(
  async (managerId: string): Promise<FacilitatorRegistryRow[]> => {
    const groups = await loadGroupsForManager(managerId);
    const staff = await loadOrganizationStaff(groups.map((group) => group.id));
    const leaders = staff.filter((row) => row.staffRole === "manager");
    const orgIds = groups.map((group) => group.id);
    const supabase = await createClient();
    let credentials: CredentialRow[] = [];
    if (orgIds.length > 0) {
      const { data, error } = await supabase
        .from("facilitator_credentials")
        .select("id, user_id, org_id, status, earned_at, evidence_path, attested_by, updated_at")
        .in("org_id", orgIds);
      if (error && !missingRelation(error, "facilitator_credentials")) throw error;
      credentials = (data ?? []) as CredentialRow[];
    }
    const names = await profileNames(
      credentials.map((row) => row.attested_by).filter((id): id is string => Boolean(id))
    );
    const groupName = new Map(groups.map((group) => [group.id, group.name]));
    const byPair = new Map(credentials.map((row) => [`${row.user_id}:${row.org_id}`, row]));

    return leaders.map((leader) => {
      const row = byPair.get(`${leader.profileId}:${leader.groupId}`);
      return {
        orgId: leader.groupId,
        orgName: groupName.get(leader.groupId) ?? "Organization",
        userId: leader.profileId,
        name: leader.name,
        staffRole: leader.staffRole,
        status: row ? parseFacilitatorCredentialStatus(row.status) ?? "" : "",
        earnedAt: row?.earned_at ?? null,
        evidencePath: row?.evidence_path?.trim() ?? "",
        attestedBy: row?.attested_by ?? null,
        attestedByName: row?.attested_by ? names.get(row.attested_by) ?? "Leader" : "",
        credentialId: row?.id ?? null,
      };
    });
  }
);
