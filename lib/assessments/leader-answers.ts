import type {
  AssignmentStatus,
  CustomAssessment,
  CustomAssessmentAnswer,
  CustomAssessmentQuestion,
  AssignmentRow,
} from "@/lib/assessments/types";

export const LEADER_ASSESSMENT_ANSWERS = "leader_assessment_answers";

export const LEADER_ASSESSMENT_STALL_MS = 7 * 86_400_000;

export const LEADER_ASSIGNMENT_COMPLETIONS = [
  "not_started",
  "started",
  "stalled",
  "finished",
] as const;

export type LeaderAssignmentCompletion = (typeof LEADER_ASSIGNMENT_COMPLETIONS)[number];

export type LeaderAssignmentResponses = {
  assessment: CustomAssessment;
  questions: CustomAssessmentQuestion[];
  assignment: AssignmentRow;
  answers: Map<string, CustomAssessmentAnswer>;
  answersVisible: boolean;
};

export function parseLeaderAssessmentAnswers(value: unknown): boolean {
  return value === true;
}

export function leaderAssessmentAnswersVisible(input: {
  platform?: boolean;
  org?: boolean;
}) {
  return input.platform === true || input.org === true;
}

export function leaderAssignmentCompletion(
  assignment: {
    status: AssignmentStatus;
    started_at: string | null;
    created_at: string;
  },
  now = Date.now()
): LeaderAssignmentCompletion {
  if (assignment.status === "completed") return "finished";
  if (assignment.status === "not_started") return "not_started";
  const startedAt = Date.parse(assignment.started_at ?? assignment.created_at);
  if (Number.isFinite(startedAt) && now - startedAt >= LEADER_ASSESSMENT_STALL_MS) {
    return "stalled";
  }
  return "started";
}

export function redactLeaderAssignmentResponses(
  payload: Omit<LeaderAssignmentResponses, "answersVisible">,
  answersVisible: boolean
): LeaderAssignmentResponses {
  if (answersVisible) {
    return { ...payload, answersVisible: true };
  }
  return {
    assessment: payload.assessment,
    assignment: payload.assignment,
    questions: [],
    answers: new Map(),
    answersVisible: false,
  };
}

export function managerRoleCannotReadAnswers(role: string, answersVisible: boolean) {
  return role === "manager" && !answersVisible;
}
