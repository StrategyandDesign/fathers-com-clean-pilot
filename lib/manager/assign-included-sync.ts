import type { User } from "@supabase/supabase-js";

import {
  assignableTrainingIdsForGroup,
  fatherIdsMissingAssignment,
  type AssignableTrainingRef,
  type IncludedReviewRef,
} from "@/lib/manager/assign-included";
import { assignTrainingToFather, type MutationResult } from "@/lib/manager/mutations";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;
type AssignActor = Pick<User, "id">;

export type AssignIncludedSummary = {
  assigned: number;
  skipped: number;
  failed: number;
  reason?: string;
};

async function applyAssignments(
  supabase: ServerClient,
  actor: AssignActor,
  fatherIds: string[],
  trainingId: string
): Promise<AssignIncludedSummary> {
  const summary: AssignIncludedSummary = { assigned: 0, skipped: 0, failed: 0 };
  for (const fatherId of fatherIds) {
    const result: MutationResult = await assignTrainingToFather(
      supabase,
      actor as User,
      fatherId,
      trainingId
    );
    if (result.status === "ok") {
      summary.assigned += 1;
    } else if (result.status === "skipped") {
      summary.skipped += 1;
    } else {
      summary.failed += 1;
      summary.reason = result.reason;
    }
  }
  return summary;
}

export async function assignIncludedTrainingToGroupFathers(
  supabase: ServerClient,
  actor: AssignActor,
  groupId: string,
  trainingId: string
): Promise<AssignIncludedSummary> {
  const { data: members, error: memberError } = await supabase
    .from("group_members")
    .select("father_id")
    .eq("group_id", groupId);

  if (memberError) {
    return {
      assigned: 0,
      skipped: 0,
      failed: 1,
      reason: "Couldn’t load the group.",
    };
  }

  const fatherIds = [
    ...new Set(
      (members ?? [])
        .map((row) => row.father_id)
        .filter((id): id is string => typeof id === "string" && Boolean(id))
    ),
  ];
  if (fatherIds.length === 0) {
    return { assigned: 0, skipped: 0, failed: 0 };
  }

  const { data: existing, error: existingError } = await supabase
    .from("training_assignments")
    .select("father_id")
    .eq("training_id", trainingId)
    .in("father_id", fatherIds);

  if (existingError) {
    return {
      assigned: 0,
      skipped: 0,
      failed: 1,
      reason: "Couldn’t check current assignments.",
    };
  }

  const missing = fatherIdsMissingAssignment(
    fatherIds,
    (existing ?? []).map((row) => row.father_id)
  );
  const skipped = fatherIds.length - missing.length;
  if (missing.length === 0) {
    return { assigned: 0, skipped, failed: 0 };
  }

  const result = await applyAssignments(supabase, actor, missing, trainingId);
  result.skipped += skipped;
  return result;
}

export async function assignIncludedTrainingsToFather(
  supabase: ServerClient,
  actor: AssignActor,
  fatherId: string,
  groupId: string
): Promise<AssignIncludedSummary> {
  const [{ data: reviews, error: reviewError }, { data: trainings, error: trainingError }] =
    await Promise.all([
      supabase
        .from("organization_training_reviews")
        .select("training_id, status, decided_by")
        .eq("group_id", groupId),
      supabase
        .from("trainings")
        .select("id, published, released_at, first_published_at, first_released_at"),
    ]);

  if (reviewError || trainingError) {
    return {
      assigned: 0,
      skipped: 0,
      failed: 1,
      reason: "Couldn’t load included trainings.",
    };
  }

  const trainingIds = assignableTrainingIdsForGroup({
    trainings: (trainings ?? []) as AssignableTrainingRef[],
    reviews: (reviews ?? []) as IncludedReviewRef[],
  });
  if (trainingIds.length === 0) {
    return { assigned: 0, skipped: 0, failed: 0 };
  }

  const { data: existing, error: existingError } = await supabase
    .from("training_assignments")
    .select("training_id")
    .eq("father_id", fatherId)
    .in("training_id", trainingIds);

  if (existingError) {
    return {
      assigned: 0,
      skipped: 0,
      failed: 1,
      reason: "Couldn’t check current assignments.",
    };
  }

  const already = new Set((existing ?? []).map((row) => row.training_id));
  const missing = trainingIds.filter((id) => !already.has(id));
  const skipped = trainingIds.length - missing.length;
  if (missing.length === 0) {
    return { assigned: 0, skipped, failed: 0 };
  }

  const decidedBy = new Map(
    ((reviews ?? []) as IncludedReviewRef[]).map((review) => [
      review.training_id,
      review.decided_by ?? actor.id,
    ])
  );

  const summary: AssignIncludedSummary = { assigned: 0, skipped, failed: 0 };
  for (const trainingId of missing) {
    const result = await assignTrainingToFather(
      supabase,
      { id: decidedBy.get(trainingId) ?? actor.id } as User,
      fatherId,
      trainingId
    );
    if (result.status === "ok") {
      summary.assigned += 1;
    } else if (result.status === "skipped") {
      summary.skipped += 1;
    } else {
      summary.failed += 1;
      summary.reason = result.reason;
    }
  }
  return summary;
}

/** Father join / existing-member catch-up. Uses the same assign helper when a writer exists. */
export async function syncIncludedTrainingsForFather(fatherId: string): Promise<AssignIncludedSummary> {
  const supabase = await createClient();
  const { data: membership, error: membershipError } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("father_id", fatherId)
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership?.group_id) {
    return { assigned: 0, skipped: 0, failed: membershipError ? 1 : 0 };
  }

  const { data: rpcAssigned, error: rpcError } = await supabase.rpc(
    "sync_included_training_assignments",
    { p_father_id: fatherId }
  );
  if (!rpcError && typeof rpcAssigned === "number") {
    return { assigned: rpcAssigned, skipped: 0, failed: 0 };
  }

  const admin = createAdminClient();
  const writer = admin ?? supabase;
  return assignIncludedTrainingsToFather(writer, { id: fatherId }, fatherId, membership.group_id);
}
