import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { deskConsiderNextV1, rosterPracticeLight } from "../lib/flags";
import {
  buildCompanionBriefing,
  buildReviewCadence,
  readyCertificate,
  rosterNextAction,
} from "../lib/manager/companion";
import type { ParticipantRow, TrainingProgress } from "../lib/manager/types";

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

function trainingCard(
  overrides: Partial<TrainingProgress> & { title?: string; id?: string } = {}
): TrainingProgress {
  const id = overrides.id ?? "fundamentals";
  const title = overrides.title ?? "Fathering Fundamentals";
  return {
    training: {
      id,
      slug: id,
      title,
      description: null,
      session_count: 2,
      order_index: 1,
    },
    sessions: [],
    completed: overrides.completed ?? 1,
    total: overrides.total ?? 2,
    assigned: overrides.assigned ?? true,
    gated: overrides.gated ?? false,
    certificate: overrides.certificate ?? null,
    current: overrides.current ?? null,
    practiceLight: overrides.practiceLight,
  };
}

function participant(
  overrides: Partial<ParticipantRow> & { id?: string } = {}
): ParticipantRow {
  const fatherId = overrides.id ?? overrides.fatherId ?? "f1";
  return {
    fatherId,
    name: overrides.name ?? "Alex",
    avatarUrl: null,
    groupId: "g1",
    groupName: "NWA",
    joinedAt: "2026-07-01T00:00:00.000Z",
    profileStatus: overrides.profileStatus ?? "completed",
    profile: null,
    progressLabel: "",
    lastActivity: overrides.lastActivity ?? "2026-08-01T00:00:00.000Z",
    ...overrides,
    fatherId,
  };
}

describe("desk review cadence", () => {
  it("keeps open items, pending actions, and certificates ready as one glance", () => {
    const cadence = buildReviewCadence({
      openItems: 2,
      pendingActions: 5,
      certificatesReady: 1,
    });
    assert.deepEqual(cadence, {
      openItems: 2,
      pendingActions: 5,
      certificatesReady: 1,
    });
    assert.deepEqual(buildReviewCadence({ openItems: -1, pendingActions: -2, certificatesReady: -3 }), {
      openItems: 0,
      pendingActions: 0,
      certificatesReady: 0,
    });
  });

  it("puts the cadence strip on /manager after counts and before the update", () => {
    const page = readRepo("app/(manager)/manager/page.tsx");
    const stats = page.indexOf("lg:grid-cols-5");
    const cadence = page.indexOf("<ReviewCadenceStrip");
    const update = page.indexOf("<CohortNoteDesk");
    const openItems = page.indexOf('id="open-items"');
    const pending = page.indexOf('id: "pending-actions"');
    const companion = page.indexOf("<CompanionPanel");
    assert.ok(stats > 0 && cadence > stats && update > cadence);
    assert.ok(openItems > update && pending > 0 && companion > openItems);
    assert.match(page, /id: "pending-actions"/);
    assert.match(page, /signAvatars: false/);
    assert.match(page, /countManagerAssessmentCompletions/);
    assert.doesNotMatch(page, /loadManagerAssessments\(/);
  });

  it("keeps Consider next off and practice light on by default", () => {
    assert.equal(deskConsiderNextV1(), false);
    assert.equal(rosterPracticeLight(), true);
    const page = readRepo("app/(manager)/manager/page.tsx");
    assert.match(page, /considerNextEnabled \? \([\s\S]*<ConsiderNextCard/);
    assert.doesNotMatch(page, /<StaffDesk/);
    assert.doesNotMatch(readRepo("components/manager/review-cadence.tsx"), /chart|Chart|recharts/);
  });
});

describe("desk cold-open payload", () => {
  it("keeps answer text and film blobs off the workspace select list", () => {
    const data = readRepo("lib/manager/data.ts");
    assert.match(data, /DESK_PROGRESS_COLUMNS/);
    assert.match(data, /DESK_SESSION_COLUMNS/);
    assert.match(data, /DESK_DRAFT_COLUMNS/);
    assert.match(data, /signAvatars \?/);
    assert.doesNotMatch(data, /session_progress"\)\.select\("\*"\)/);
    assert.doesNotMatch(data, /trainings"\)\.select\("\*"\)/);
    assert.doesNotMatch(data, /sessions"\)\.select\("\*"\)/);
    assert.match(
      data,
      /DESK_PROGRESS_COLUMNS =\s*"id, father_id, session_id, film_completed, checkin_completed, action_completed, status, completed_at, skill_use, skill_use_at"/
    );
    assert.match(data, /DESK_SESSION_COLUMNS =\s*"id, training_id, session_number, title, order_index"/);
    assert.match(data, /DESK_DRAFT_COLUMNS = "father_id"/);
    assert.doesNotMatch(data, /checkin_answers/);
    assert.doesNotMatch(data, /action_note/);
    assert.doesNotMatch(data, /session_note/);
    assert.match(readRepo("lib/assessments/data.ts"), /countManagerAssessmentCompletions/);
    assert.match(
      readRepo("lib/assessments/data.ts"),
      /Never select questions, prompts, or answers/
    );
  });
});

describe("roster next action and lights", () => {
  it("offers at most one next action and prefers a ready certificate", () => {
    const certCard = trainingCard({ completed: 2, total: 2 });
    const quietCard = trainingCard({ completed: 0, total: 2, practiceLight: "dismissed" });
    assert.deepEqual(rosterNextAction("2026-08-01T00:00:00.000Z", [certCard], true), {
      key: "manager.bulk.nextCertificate",
      vars: { title: "Fathering Fundamentals" },
    });
    assert.equal(
      rosterNextAction("2026-08-01T00:00:00.000Z", [quietCard], true)?.key,
      "manager.companion.reasonPracticeSkipped"
    );
    assert.equal(rosterNextAction("2026-08-01T00:00:00.000Z", [quietCard], false), null);
    assert.deepEqual(readyCertificate([certCard]), {
      title: "Fathering Fundamentals",
      trainingId: "fundamentals",
    });
  });

  it("keeps film, checkpoint, and practice lights on the mobile roster without answer fields", () => {
    const list = readRepo("components/manager/participant-bulk-list.tsx");
    const page = readRepo("app/(manager)/manager/participants/page.tsx");
    assert.match(list, /ProgressLights/);
    assert.match(list, /showPractice/);
    assert.match(list, /md:hidden/);
    assert.match(list, /manager\.bulk\.nextAction/);
    assert.match(page, /rosterNextAction/);
    assert.match(page, /nextAction/);
    assert.doesNotMatch(list, /checkin_answers|action_note|session_note/);
    assert.doesNotMatch(page, /checkin_answers|action_note|session_note/);
  });

  it("counts certificates ready from companion without inventing a second action", () => {
    const briefing = buildCompanionBriefing({
      organizationName: "NWA",
      participants: [participant({ id: "f1", name: "Alex" })],
      trainingProgressFor: () => [trainingCard({ completed: 2, total: 2 })],
      certificatesIssued: 0,
      historyByFather: new Map(),
      reminderPrefs: new Map(),
      historyUnavailable: false,
    });
    assert.equal(briefing.certificatesReady, 1);
    assert.equal(briefing.readyCertificates[0]?.trainingId, "fundamentals");
    assert.equal(briefing.quiet.length, 0);
  });
});
