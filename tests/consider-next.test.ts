import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { deskConsiderNextV1 } from "../lib/flags";
import {
  buildConsiderNext,
  considerNextHistoryIds,
  considerNextScore,
  pickConsiderNextKind,
} from "../lib/manager/consider-next";
import type { ParticipantRow, TrainingProgress } from "../lib/manager/types";

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
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
    current: overrides.current ?? {
      session: {
        id: "s1",
        training_id: id,
        session_number: 2,
        title: "Stay present",
        video_url: null,
        duration_seconds: null,
        keyline: null,
        order_index: 2,
      },
      progress: null,
    },
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
    joinedAt: daysAgo(40),
    profileStatus: overrides.profileStatus ?? "completed",
    profile: null,
    progressLabel: "",
    lastActivity: overrides.lastActivity ?? daysAgo(20),
    ...overrides,
    fatherId,
  };
}

describe("desk_consider_next_v1 flag", () => {
  it("defaults off so the prior dashboard stays up", () => {
    assert.equal(deskConsiderNextV1(), false);
    const flags = readRepo("lib/flags.ts");
    const env = readRepo(".env.example");
    const page = readRepo("app/(manager)/manager/page.tsx");
    assert.match(flags, /desk_consider_next_v1/);
    assert.match(flags, /defaults OFF/);
    assert.match(flags, /DESK_CONSIDER_NEXT_V1/);
    assert.match(env, /DESK_CONSIDER_NEXT_V1=/);
    assert.match(env, /until ranking is trustworthy/);
    assert.match(page, /deskConsiderNextV1/);
    assert.match(page, /considerNextEnabled \? \(/);
    assert.match(page, /<ConsiderNextCard/);
    assert.match(readRepo("docs/engineering/PILOT.md"), /DESK_CONSIDER_NEXT_V1=1/);
    assert.match(
      readRepo("docs/product/FACILITATOR-SUPPORT-MODEL.md"),
      /desk_consider_next_v1/
    );
  });

  it("keeps the card off the rendered tree when the flag is off", () => {
    const page = readRepo("app/(manager)/manager/page.tsx");
    const flag = page.indexOf("deskConsiderNextV1()");
    const card = page.indexOf("<ConsiderNextCard");
    const companion = page.indexOf("<CompanionPanel");
    assert.ok(flag > 0 && card > flag && companion > card);
    assert.match(page, /considerNextEnabled \? \([\s\S]*<ConsiderNextCard/);
  });
});

describe("consider next ranking", () => {
  it("picks one kind in cert, assessment, practice, quiet, then open-item order", () => {
    assert.equal(
      pickConsiderNextKind({
        certReady: true,
        assessmentStalled: true,
        practiceSkipped: true,
        quiet: true,
        openItem: true,
      }),
      "cert_ready"
    );
    assert.equal(
      pickConsiderNextKind({
        certReady: false,
        assessmentStalled: true,
        practiceSkipped: true,
        quiet: true,
        openItem: true,
      }),
      "assessment_stalled"
    );
    assert.equal(
      pickConsiderNextKind({
        certReady: false,
        assessmentStalled: false,
        practiceSkipped: true,
        quiet: true,
        openItem: true,
      }),
      "practice_skipped"
    );
    assert.equal(
      pickConsiderNextKind({
        certReady: false,
        assessmentStalled: false,
        practiceSkipped: false,
        quiet: true,
        openItem: true,
      }),
      "quiet"
    );
    assert.equal(
      pickConsiderNextKind({
        certReady: false,
        assessmentStalled: false,
        practiceSkipped: false,
        quiet: false,
        openItem: true,
      }),
      "open_item"
    );
    assert.equal(
      pickConsiderNextKind({
        certReady: false,
        assessmentStalled: false,
        practiceSkipped: false,
        quiet: false,
        openItem: false,
      }),
      null
    );
  });

  it("keeps one suggested action per man when several signals apply", () => {
    const quietPractice = participant({
      id: "f-quiet",
      name: "Ben",
      lastActivity: daysAgo(21),
      profileStatus: "in_progress",
    });
    const cards = [
      trainingCard({
        completed: 2,
        total: 2,
        practiceLight: "stale",
        current: null,
      }),
    ];
    const rows = buildConsiderNext({
      participants: [quietPractice],
      trainingProgressFor: () => cards,
      historyByFather: new Map(),
      reminderPrefs: new Map(),
      historyUnavailable: false,
      assessmentStalls: [{ fatherId: "f-quiet", title: "Family Fortress" }],
      openItems: [
        {
          fatherId: "f-quiet",
          name: "Ben",
          reason: "Ready for certificate: Fathering Fundamentals",
        },
      ],
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.fatherId, "f-quiet");
    assert.equal(rows[0]?.kind, "cert_ready");
    assert.equal(rows[0]?.action, "issue_certificate");
    assert.equal(rows[0]?.trainingId, "fundamentals");
    assert.equal(rows[0]?.reason.key, "manager.considerNext.reasonCert");
  });

  it("ranks a quiet or practice-skipped father with a nudge confirm path", () => {
    const quietMan = participant({
      id: "f-quiet",
      name: "Carl",
      lastActivity: daysAgo(18),
    });
    const skippedMan = participant({
      id: "f-skip",
      name: "Drew",
      lastActivity: daysAgo(2),
    });
    const progress = new Map<string, TrainingProgress[]>([
      ["f-quiet", [trainingCard({ completed: 0, total: 2, practiceLight: "completed" })]],
      [
        "f-skip",
        [trainingCard({ completed: 1, total: 2, practiceLight: "dismissed" })],
      ],
    ]);

    const rows = buildConsiderNext({
      participants: [quietMan, skippedMan],
      trainingProgressFor: (id) => progress.get(id) ?? [],
      historyByFather: new Map(),
      reminderPrefs: new Map(),
      historyUnavailable: false,
    });

    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.kind, "practice_skipped");
    assert.equal(rows[0]?.action, "nudge");
    assert.equal(rows[0]?.fatherId, "f-skip");
    assert.equal(rows[0]?.reason.key, "manager.companion.reasonPracticeSkipped");
    assert.equal(rows[1]?.kind, "quiet");
    assert.equal(rows[1]?.action, "nudge");
    assert.equal(rows[1]?.fatherId, "f-quiet");
    assert.ok(rows[0]!.score > rows[1]!.score);
  });

  it("includes assessment stalls by title and never asks for answers", () => {
    const source = readRepo("lib/assessments/data.ts");
    const start = source.indexOf("loadManagerAssessmentStalls");
    const stallFn = source.slice(start, source.indexOf("export async function loadManagerAssessmentDetail"));
    assert.match(source, /Never select assessment answers/);
    assert.match(stallFn, /select\("father_id, assessment_id, started_at, created_at"\)/);
    assert.match(stallFn, /select\("id, title"\)/);
    assert.doesNotMatch(stallFn, /custom_assessment_answers/);
    assert.doesNotMatch(stallFn, /prompt/);

    const stalled = participant({
      id: "f-assess",
      name: "Eli",
      lastActivity: daysAgo(3),
      profileStatus: "in_progress",
    });
    const rows = buildConsiderNext({
      participants: [stalled],
      trainingProgressFor: () => [trainingCard({ assigned: true, completed: 1, total: 2 })],
      historyByFather: new Map(),
      reminderPrefs: new Map(),
      historyUnavailable: false,
      assessmentStalls: [{ fatherId: "f-assess", title: "Steady Presence" }],
    });

    assert.equal(rows[0]?.kind, "assessment_stalled");
    assert.equal(rows[0]?.action, "nudge");
    assert.equal(rows[0]?.reason.key, "manager.considerNext.reasonAssessment");
    assert.equal(rows[0]?.reason.vars?.title, "Steady Presence");
  });

  it("falls back to Keystone in progress and folds existing open items", () => {
    const keystone = participant({
      id: "f-key",
      name: "Finn",
      lastActivity: daysAgo(1),
      profileStatus: "in_progress",
    });
    const unassigned = participant({
      id: "f-open",
      name: "Gus",
      lastActivity: daysAgo(1),
    });
    const rows = buildConsiderNext({
      participants: [keystone, unassigned],
      trainingProgressFor: (id) =>
        id === "f-open"
          ? [trainingCard({ assigned: false, completed: 0, total: 2, current: null })]
          : [trainingCard({ assigned: true, completed: 1, total: 2 })],
      historyByFather: new Map(),
      reminderPrefs: new Map(),
      historyUnavailable: false,
      openItems: [
        { fatherId: "f-open", name: "Gus", reason: "No training assigned" },
      ],
    });

    assert.equal(rows.map((row) => row.kind).join(","), "assessment_stalled,open_item");
    assert.equal(rows[0]?.reason.key, "manager.considerNext.reasonKeystone");
    assert.equal(rows[1]?.action, "open_participant");
    assert.equal(rows[1]?.attentionReason, "No training assigned");
  });

  it("scores higher-priority kinds ahead of a longer quiet stretch", () => {
    assert.ok(considerNextScore("practice_skipped", 2) > considerNextScore("quiet", 8));
    assert.ok(considerNextScore("cert_ready", 0) > considerNextScore("assessment_stalled", 10));
  });

  it("collects history ids for every ranked signal", () => {
    const ids = considerNextHistoryIds(
      [
        participant({ id: "a", lastActivity: daysAgo(20) }),
        participant({ id: "b", lastActivity: daysAgo(1), profileStatus: "in_progress" }),
      ],
      (id) =>
        id === "a"
          ? [trainingCard({ completed: 0, total: 2 })]
          : [trainingCard({ practiceLight: "stale" })],
      [{ fatherId: "c", title: "Legacy Architect" }],
      [{ fatherId: "d", name: "Hal", reason: "No training assigned" }]
    );
    assert.deepEqual([...ids].sort(), ["a", "b", "c", "d"]);
  });
});
