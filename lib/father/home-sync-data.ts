import "server-only";

import { homeSyncVersion } from "@/lib/father/home-sync";
import { createClient } from "@/lib/supabase/server";

function missingRelation(error: { message?: string; code?: string } | null, name: string) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    new RegExp(name, "i").test(error.message ?? "")
  );
}

function latestIso(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value)).sort().at(-1) ?? "";
}

async function safeRows<T>(
  result: PromiseLike<{ data: T[] | null; error: { message?: string; code?: string } | null }>,
  name: string
): Promise<T[]> {
  const { data, error } = await result;
  if (error && !missingRelation(error, name)) throw error;
  return data ?? [];
}

/** Stamp so Father Home picks up a new leader update without a reload. */
export async function loadFatherHomeSyncVersion(fatherId: string) {
  const supabase = await createClient();
  const memberships = await safeRows<{ group_id: string }>(
    supabase.from("group_members").select("group_id").eq("father_id", fatherId),
    "group_members"
  );
  const groupIds = [...new Set(memberships.map((row) => row.group_id))];
  if (groupIds.length === 0) return "empty";

  const [notes, dismissals, assignments, photos] = await Promise.all([
    safeRows<{ id: string; updated_at: string | null }>(
      supabase
        .from("organization_cohort_notes")
        .select("id, updated_at")
        .in("group_id", groupIds),
      "organization_cohort_notes"
    ),
    safeRows<{ note_id: string | null; group_id: string | null; dismissed_at: string | null }>(
      supabase
        .from("organization_cohort_note_dismissals")
        .select("note_id, group_id, dismissed_at")
        .eq("father_id", fatherId),
      "organization_cohort_note_dismissals"
    ),
    safeRows<{ assigned_at: string | null }>(
      supabase.from("training_assignments").select("assigned_at").eq("father_id", fatherId),
      "training_assignments"
    ),
    safeRows<{ updated_at: string | null }>(
      supabase.from("organization_photos").select("updated_at").in("group_id", groupIds),
      "organization_photos"
    ),
  ]);

  return homeSyncVersion({
    notes,
    dismissals,
    assignmentCount: assignments.length,
    assignmentAt: latestIso(assignments.map((row) => row.assigned_at)),
    photoCount: photos.length,
    photoAt: latestIso(photos.map((row) => row.updated_at)),
  });
}
