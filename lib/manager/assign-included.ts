import { isTrainingAssignable } from "@/lib/father/types";

export type IncludedReviewRef = {
  training_id: string;
  status: string;
  group_id?: string;
  decided_by?: string | null;
};

export type AssignableTrainingRef = {
  id: string;
  published?: boolean | null;
  released_at?: string | null;
  first_published_at?: string | null;
  first_released_at?: string | null;
};

export function includedTrainingIds(
  reviews: IncludedReviewRef[],
  groupId?: string
): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const review of reviews) {
    if (review.status !== "accepted") continue;
    if (groupId && review.group_id && review.group_id !== groupId) continue;
    if (seen.has(review.training_id)) continue;
    seen.add(review.training_id);
    ids.push(review.training_id);
  }
  return ids;
}

export function assignableTrainingIdsForGroup(input: {
  trainings: AssignableTrainingRef[];
  reviews: IncludedReviewRef[];
}): string[] {
  const statusByTraining = new Map(
    input.reviews.map((review) => [review.training_id, review.status])
  );
  return input.trainings
    .filter((training) => isTrainingAssignable(training, statusByTraining.get(training.id)))
    .map((training) => training.id);
}

export function fatherIdsMissingAssignment(
  memberFatherIds: string[],
  alreadyAssignedFatherIds: Iterable<string>
): string[] {
  const have = new Set(alreadyAssignedFatherIds);
  return memberFatherIds.filter((id) => Boolean(id) && !have.has(id));
}

export function shouldHoldFatherStart(input: {
  hasAssignment: boolean;
  hasIncludedTraining: boolean;
}): boolean {
  return !input.hasAssignment && !input.hasIncludedTraining;
}
