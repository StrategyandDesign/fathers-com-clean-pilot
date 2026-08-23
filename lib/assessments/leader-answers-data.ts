import { cache } from "react";

import { leaderAssessmentAnswers } from "@/lib/flags";
import {
  leaderAssessmentAnswersVisible,
  parseLeaderAssessmentAnswers,
} from "@/lib/assessments/leader-answers";
import { createClient } from "@/lib/supabase/server";

function missingRelation(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /group_leader_assessment_answers/i.test(error.message ?? "")
  );
}

type FlagRow = {
  group_id: string;
  enabled: boolean | null;
};

export async function loadOrgLeaderAssessmentAnswerRows(groupIds: string[]): Promise<FlagRow[]> {
  if (groupIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_leader_assessment_answers")
    .select("group_id, enabled")
    .in("group_id", groupIds);
  if (error) {
    if (missingRelation(error)) return [];
    throw error;
  }
  return (data ?? []) as FlagRow[];
}

export const loadOrgLeaderAssessmentAnswers = cache(async (groupIds: string[]) => {
  const rows = await loadOrgLeaderAssessmentAnswerRows(groupIds);
  const byId = new Map<string, boolean>();
  for (const id of groupIds) {
    byId.set(id, false);
  }
  for (const row of rows) {
    byId.set(row.group_id, parseLeaderAssessmentAnswers(row.enabled));
  }
  return byId;
});

export async function orgLeaderAssessmentAnswersEnabled(groupId: string | null | undefined) {
  if (!groupId) return false;
  const flags = await loadOrgLeaderAssessmentAnswers([groupId]);
  return flags.get(groupId) === true;
}

export async function resolveLeaderAssessmentAnswers(groupId: string | null | undefined) {
  const org = await orgLeaderAssessmentAnswersEnabled(groupId);
  return leaderAssessmentAnswersVisible({
    platform: leaderAssessmentAnswers(),
    org,
  });
}
