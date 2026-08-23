import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { leaderAssessmentAnswers, LEADER_ASSESSMENT_ANSWERS } from "../lib/flags";
import {
  LEADER_ASSESSMENT_STALL_MS,
  leaderAssessmentAnswersVisible,
  leaderAssignmentCompletion,
  managerRoleCannotReadAnswers,
  parseLeaderAssessmentAnswers,
  redactLeaderAssignmentResponses,
  type LeaderAssignmentResponses,
} from "../lib/assessments/leader-answers";
import { recommendedFlagsForType } from "../lib/organization-type";
import type { CustomAssessment, CustomAssessmentAnswer, AssignmentRow } from "../lib/assessments/types";
import { en } from "../lib/i18n/messages/en";

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

const assessment: CustomAssessment = {
  id: "a1",
  manager_id: "m1",
  title: "Home check-in",
  description: null,
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
};

const assignment: AssignmentRow = {
  id: "as1",
  assessment_id: "a1",
  father_id: "f1",
  assigned_by: "m1",
  status: "completed",
  started_at: "2026-08-02T00:00:00.000Z",
  completed_at: "2026-08-03T00:00:00.000Z",
  created_at: "2026-08-01T00:00:00.000Z",
  fatherName: "Alex",
};

const answer: CustomAssessmentAnswer = {
  id: "an1",
  assignment_id: "as1",
  question_id: "q1",
  value: "I told the court I drink every night",
  updated_at: "2026-08-03T00:00:00.000Z",
};

function payload(): Omit<LeaderAssignmentResponses, "answersVisible"> {
  return {
    assessment,
    assignment,
    questions: [
      {
        id: "q1",
        assessment_id: "a1",
        order_index: 1,
        prompt: "What is hard at home this week?",
        question_type: "short_text",
        options: null,
      },
    ],
    answers: new Map([["q1", answer]]),
  };
}

describe("leader_assessment_answers flag", () => {
  it("defaults off so Leaders cannot load answer payloads", () => {
    assert.equal(LEADER_ASSESSMENT_ANSWERS, "leader_assessment_answers");
    assert.equal(leaderAssessmentAnswers(), false);
    assert.equal(parseLeaderAssessmentAnswers(undefined), false);
    assert.equal(parseLeaderAssessmentAnswers(false), false);
    assert.equal(parseLeaderAssessmentAnswers(true), true);
    assert.equal(leaderAssessmentAnswersVisible({}), false);
    assert.equal(leaderAssessmentAnswersVisible({ platform: false, org: false }), false);
    assert.equal(managerRoleCannotReadAnswers("manager", false), true);
    const flags = readRepo("lib/flags.ts");
    const env = readRepo(".env.example");
    assert.match(flags, /leader_assessment_answers/);
    assert.match(flags, /defaults OFF/);
    assert.match(flags, /LEADER_ASSESSMENT_ANSWERS/);
    assert.match(env, /LEADER_ASSESSMENT_ANSWERS=/);
    assert.match(env, /rehab spine stays flags-only/);
    assert.match(readRepo("docs/engineering/PILOT.md"), /LEADER_ASSESSMENT_ANSWERS=1/);
    assert.match(
      readRepo("docs/product/FACILITATOR-SUPPORT-MODEL.md"),
      /leader_assessment_answers/
    );
  });

  it("unlocks answers when the platform or org flag is on", () => {
    assert.equal(leaderAssessmentAnswersVisible({ platform: true, org: false }), true);
    assert.equal(leaderAssessmentAnswersVisible({ platform: false, org: true }), true);
    assert.equal(leaderAssessmentAnswersVisible({ platform: true, org: true }), true);
    assert.equal(managerRoleCannotReadAnswers("manager", true), false);
    assert.equal(managerRoleCannotReadAnswers("reviewer", false), false);
  });

  it("does not turn the flag on from organization type", () => {
    assert.equal(recommendedFlagsForType("rehab").leaderAssessmentAnswers, false);
    assert.equal(recommendedFlagsForType("other").leaderAssessmentAnswers, false);
    assert.match(readRepo("lib/organization-type.ts"), /leader_assessment_answers off/);
  });
});

describe("manager assignment response redaction", () => {
  it("strips question text and answer payloads when the flag is off", () => {
    const redacted = redactLeaderAssignmentResponses(payload(), false);
    assert.equal(redacted.answersVisible, false);
    assert.equal(redacted.questions.length, 0);
    assert.equal(redacted.answers.size, 0);
    assert.equal(redacted.answers.get("q1"), undefined);
    assert.equal(JSON.stringify([...redacted.answers.values()]).includes(answer.value), false);
    assert.equal(redacted.questions.some((row) => row.prompt.includes("hard at home")), false);
    assert.equal(redacted.assignment.status, "completed");
    assert.equal(redacted.assessment.title, "Home check-in");
  });

  it("keeps question text and answer payloads when the flag is on", () => {
    const visible = redactLeaderAssignmentResponses(payload(), true);
    assert.equal(visible.answersVisible, true);
    assert.equal(visible.questions.length, 1);
    assert.equal(visible.questions[0]?.prompt, "What is hard at home this week?");
    assert.equal(visible.answers.get("q1")?.value, answer.value);
  });

  it("loads answer rows only after the manager flag resolves on", () => {
    const source = readRepo("lib/assessments/data.ts");
    const fnStart = source.indexOf("export async function loadManagerAssignmentResponses");
    const fnEnd = source.indexOf("export async function loadParticipantCustomAssignments");
    const loader = source.slice(fnStart, fnEnd);
    assert.match(loader, /resolveLeaderAssessmentAnswers/);
    assert.match(loader, /if \(!answersVisible\)/);
    assert.match(loader, /return empty/);
    const flagCheck = loader.indexOf("if (!answersVisible)");
    const select = loader.indexOf('from("custom_assessment_answers")');
    assert.ok(fnStart >= 0 && flagCheck > 0 && select > flagCheck);
  });
});

describe("leader assignment completion flags", () => {
  it("maps started, finished, and stalled without inventing clinical fields", () => {
    assert.equal(
      leaderAssignmentCompletion({
        status: "not_started",
        started_at: null,
        created_at: "2026-08-01T00:00:00.000Z",
      }),
      "not_started"
    );
    assert.equal(
      leaderAssignmentCompletion({
        status: "completed",
        started_at: "2026-08-02T00:00:00.000Z",
        created_at: "2026-08-01T00:00:00.000Z",
      }),
      "finished"
    );
    const now = Date.parse("2026-08-10T00:00:00.000Z");
    assert.equal(
      leaderAssignmentCompletion(
        {
          status: "in_progress",
          started_at: "2026-08-09T00:00:00.000Z",
          created_at: "2026-08-01T00:00:00.000Z",
        },
        now
      ),
      "started"
    );
    assert.equal(
      leaderAssignmentCompletion(
        {
          status: "in_progress",
          started_at: new Date(now - LEADER_ASSESSMENT_STALL_MS).toISOString(),
          created_at: "2026-08-01T00:00:00.000Z",
        },
        now
      ),
      "stalled"
    );
  });
});

describe("leader assessment answers surfaces", () => {
  it("gates the responses page and keeps the counsel warning muted", () => {
    const page = readRepo(
      "app/(manager)/manager/assessments/[id]/responses/[fatherId]/page.tsx"
    );
    assert.match(page, /detail\.answersVisible/);
    assert.match(page, /answersCounsel/);
    assert.match(page, /statusOnlyLead/);
    assert.match(page, /completionStarted|completionFinished|completionStalled/);
    assert.doesNotMatch(page, /answersVisible \?[\s\S]*question\.prompt[\s\S]*:[\s\S]*question\.prompt/);
    assert.equal(en.manager.assessments.answersCounsel.includes("clinical chart"), true);
    assert.equal(en.manager.assessments.answersCounsel.includes("—"), false);
    assert.equal(en.legal.privacyPage.sharingOrg.includes("answer bodies"), true);
    assert.equal(en.legal.privacyPage.sharingOrg.includes("cohort totals"), true);
  });

  it("keeps Reviewer desks off answer payloads", () => {
    const reviewerHome = readRepo("app/(reviewer)/reviewer/page.tsx");
    const reviewerSummary = readRepo("app/(reviewer)/reviewer/summary/page.tsx");
    const reviewerInsights = readRepo("lib/reviewer/insights.ts");
    assert.doesNotMatch(reviewerHome, /custom_assessment_answers|loadManagerAssignmentResponses/);
    assert.doesNotMatch(reviewerSummary, /custom_assessment_answers|loadManagerAssignmentResponses/);
    assert.doesNotMatch(reviewerInsights, /custom_assessment_answers/);
    assert.doesNotMatch(reviewerHome, /answer\.value|question\.prompt/);
  });

  it("does not dump Keystone free text on Leader responses", () => {
    const page = readRepo("app/(manager)/manager/assessments/keystone/page.tsx");
    assert.doesNotMatch(page, /custom_assessment_answers/);
    assert.doesNotMatch(page, /free.text|freeText|keystone_answers/);
  });

  it("defaults the org table off and lets Super-admin unlock it", () => {
    const migration = readRepo("supabase/migrations/20260823070000_leader_assessment_answers.sql");
    const orgPage = readRepo("app/(admin)/admin/organizations/[id]/page.tsx");
    const card = readRepo("components/admin/leader-answers-org-card.tsx");
    assert.match(migration, /enabled boolean not null default false/);
    assert.match(migration, /leader_assessment_answers OFF/);
    assert.match(orgPage, /LeaderAnswersOrgCard/);
    assert.match(card, /name="leader_assessment_answers"/);
    assert.match(card, /<details/);
    assert.doesNotMatch(card, /<details[^>]*\sopen[\s>]/);
  });
});
