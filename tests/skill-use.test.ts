import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  parseHomeDeskVisit,
  shouldOfferSkillUseOnHome,
  SKILL_USE_HOME_AWAY_MS,
} from "../lib/father/home-desk";
import {
  countSkillsUsed,
  formatSkillUseStatement,
  isPracticeSkipped,
  latestPracticeLight,
  nextSkillUse,
  parseSkillUse,
  pickSkillUseFollowUp,
  practiceLightCsvValue,
  practiceLightFromSkillUse,
  skillUseFollowUpDue,
} from "../lib/father/skill-use";
import { rosterPracticeLight } from "../lib/flags";
import { quietReasonCopy } from "../lib/manager/companion";
import type { TrainingProgress } from "../lib/manager/types";

describe("skill use parse", () => {
  it("accepts used, later, and dismissed", () => {
    assert.equal(parseSkillUse("used"), "used");
    assert.equal(parseSkillUse("later"), "later");
    assert.equal(parseSkillUse("dismissed"), "dismissed");
    assert.equal(parseSkillUse("completed"), null);
    assert.equal(parseSkillUse(null), null);
  });

  it("does not let used fall back to later or dismissed", () => {
    assert.equal(nextSkillUse("used", "later"), "used");
    assert.equal(nextSkillUse("used", "dismissed"), "used");
    assert.equal(nextSkillUse("later", "used"), "used");
    assert.equal(nextSkillUse("dismissed", "used"), "used");
    assert.equal(nextSkillUse(null, "later"), "later");
    assert.equal(nextSkillUse(null, "dismissed"), "dismissed");
  });
});

describe("skill use follow-up", () => {
  const now = new Date("2026-08-19T18:00:00.000Z");

  it("waits twelve hours after completion before Home asks", () => {
    assert.equal(skillUseFollowUpDue("2026-08-19T10:00:00.000Z", now), false);
    assert.equal(skillUseFollowUpDue("2026-08-19T05:00:00.000Z", now), true);
    assert.equal(skillUseFollowUpDue(null, now), true);
  });

  it("picks the most recent unanswered completed session", () => {
    const prompt = pickSkillUseFollowUp(
      [
        {
          sessionId: "old",
          sessionTitle: "Session 1",
          skill: "Stay calm",
          completedAt: "2026-08-17T12:00:00.000Z",
          skillUse: null,
        },
        {
          sessionId: "new",
          sessionTitle: "Session 2",
          skill: "Listen first",
          completedAt: "2026-08-18T12:00:00.000Z",
          skillUse: null,
        },
        {
          sessionId: "fresh",
          sessionTitle: "Session 3",
          skill: "Show up",
          completedAt: "2026-08-19T12:00:00.000Z",
          skillUse: null,
        },
      ],
      now
    );
    assert.equal(prompt?.sessionId, "new");
    assert.equal(prompt?.skill, "Listen first");
  });

  it("skips sessions already answered", () => {
    const prompt = pickSkillUseFollowUp(
      [
        {
          sessionId: "used",
          sessionTitle: "Session 2",
          skill: "Listen first",
          completedAt: "2026-08-18T12:00:00.000Z",
          skillUse: "used",
        },
        {
          sessionId: "later",
          sessionTitle: "Session 1",
          skill: "Stay calm",
          completedAt: "2026-08-17T12:00:00.000Z",
          skillUse: "later",
        },
        {
          sessionId: "dismissed",
          sessionTitle: "Session 3",
          skill: "Show up",
          completedAt: "2026-08-16T12:00:00.000Z",
          skillUse: "dismissed",
        },
      ],
      now
    );
    assert.equal(prompt, null);
  });
});

describe("skills used count", () => {
  it("counts only used, never later, dismissed, or blank", () => {
    assert.equal(
      countSkillsUsed([
        { skill_use: "used" },
        { skill_use: "later" },
        { skill_use: "dismissed" },
        { skill_use: null },
        { skillUse: "used" },
      ]),
      2
    );
  });
});

describe("skill use statement", () => {
  it("keeps a question as the card header and turns a topic fragment into a statement", () => {
    assert.equal(
      formatSkillUseStatement("Physical, emotional, and spiritual safety and provision."),
      "Practice physical, emotional, and spiritual safety and provision."
    );
    assert.equal(
      formatSkillUseStatement("Speak life into your child with words that land."),
      "Speak life into your child with words that land."
    );
    assert.equal(
      formatSkillUseStatement("The surge is a signal, not an order."),
      "The surge is a signal, not an order."
    );
    assert.equal(
      formatSkillUseStatement("Practice one calm check-in tonight"),
      "Practice one calm check-in tonight."
    );
  });
});

describe("skill use on Home", () => {
  const now = new Date("2026-08-20T12:00:00.000Z");
  const loginAt = "2026-08-20T08:00:00.000Z";

  it("offers the card on first login or after a long stretch away", () => {
    assert.equal(shouldOfferSkillUseOnHome(null, loginAt, now), true);
    assert.equal(
      shouldOfferSkillUseOnHome(
        { loginAt, seenAt: "2026-08-20T11:50:00.000Z" },
        loginAt,
        now
      ),
      false
    );
    assert.equal(
      shouldOfferSkillUseOnHome(
        {
          loginAt,
          seenAt: new Date(now.getTime() - SKILL_USE_HOME_AWAY_MS).toISOString(),
        },
        loginAt,
        now
      ),
      true
    );
    assert.equal(
      shouldOfferSkillUseOnHome(
        { loginAt: "2026-08-19T08:00:00.000Z", seenAt: "2026-08-20T11:50:00.000Z" },
        loginAt,
        now
      ),
      true
    );
  });

  it("reads the dashboard visit cookie", () => {
    assert.deepEqual(
      parseHomeDeskVisit(encodeURIComponent(JSON.stringify({ loginAt, seenAt: now.toISOString() }))),
      { loginAt, seenAt: now.toISOString() }
    );
    assert.equal(parseHomeDeskVisit(""), null);
    assert.equal(parseHomeDeskVisit("nope"), null);
  });

  it("gates the Home card and still asks on session closeout", () => {
    const page = readFileSync(
      fileURLToPath(new URL("../app/(father)/father/page.tsx", import.meta.url)),
      "utf8"
    );
    const closeout = readFileSync(
      fileURLToPath(new URL("../components/father/session-closeout.tsx", import.meta.url)),
      "utf8"
    );
    assert.match(page, /shouldOfferSkillUseOnHome/);
    assert.match(page, /HomeDeskStamp/);
    assert.match(page, /showSkillUse && skillUsePrompt/);
    assert.match(closeout, /SkillUseCard/);
    assert.doesNotMatch(closeout, /shouldOfferSkillUseOnHome/);
    const signOut = readFileSync(
      fileURLToPath(new URL("../lib/auth/actions.ts", import.meta.url)),
      "utf8"
    );
    assert.match(signOut, /clearHomeDeskCookie/);
  });

  it("lets Dismiss save as dismissed", () => {
    const migration = readFileSync(
      fileURLToPath(new URL("../supabase/migrations/20260820010000_session_skill_use_dismissed.sql", import.meta.url)),
      "utf8"
    );
    const actions = readFileSync(
      fileURLToPath(new URL("../lib/father/actions.ts", import.meta.url)),
      "utf8"
    );
    assert.match(migration, /'used', 'later', 'dismissed'/);
    assert.match(actions, /writeSkillUse/);
    assert.match(actions, /next !== "dismissed"/);
  });
});

describe("skill use on Leader desks", () => {
  it("does not show a Skills used count on Home, reports, or a participant card", () => {
    const home = readFileSync(
      fileURLToPath(new URL("../app/(manager)/manager/page.tsx", import.meta.url)),
      "utf8"
    );
    const reports = readFileSync(
      fileURLToPath(new URL("../app/(manager)/manager/reports/page.tsx", import.meta.url)),
      "utf8"
    );
    const participant = readFileSync(
      fileURLToPath(new URL("../app/(manager)/manager/participants/[id]/page.tsx", import.meta.url)),
      "utf8"
    );
    const csv = readFileSync(
      fileURLToPath(new URL("../lib/manager/reports.ts", import.meta.url)),
      "utf8"
    );
    for (const source of [home, reports, participant, csv]) {
      assert.doesNotMatch(source, /skillsUsed/);
      assert.doesNotMatch(source, /Skills used/);
    }
  });

  it("puts film, checkpoint, and practice lights on the roster and detail", () => {
    const roster = readFileSync(
      fileURLToPath(new URL("../app/(manager)/manager/participants/page.tsx", import.meta.url)),
      "utf8"
    );
    const detail = readFileSync(
      fileURLToPath(new URL("../app/(manager)/manager/participants/[id]/page.tsx", import.meta.url)),
      "utf8"
    );
    const list = readFileSync(
      fileURLToPath(new URL("../components/manager/participant-bulk-list.tsx", import.meta.url)),
      "utf8"
    );
    assert.match(roster, /practiceLight/);
    assert.match(detail, /ProgressLights/);
    assert.match(detail, /translatePracticeLight/);
    assert.match(list, /ProgressLights/);
    assert.match(list, /showPractice/);
    assert.doesNotMatch(detail, /action_note|session_note|checkin_answers/);
  });
});

describe("skill use to roster practice light", () => {
  const now = new Date("2026-08-23T12:00:00.000Z");

  it("maps used, later, dismissed, and stale later without answer text", () => {
    assert.equal(practiceLightFromSkillUse("used", "2026-08-01T00:00:00.000Z", now), "completed");
    assert.equal(practiceLightFromSkillUse("later", "2026-08-22T12:00:00.000Z", now), "not_yet");
    assert.equal(practiceLightFromSkillUse("later", "2026-08-16T11:00:00.000Z", now), "stale");
    assert.equal(practiceLightFromSkillUse("dismissed", "2026-08-01T00:00:00.000Z", now), "dismissed");
    assert.equal(practiceLightFromSkillUse(null, "2026-08-01T00:00:00.000Z", now), null);
    assert.equal(practiceLightCsvValue("not_yet"), "not yet");
    assert.equal(practiceLightCsvValue("completed"), "completed");
    assert.equal(practiceLightCsvValue(null), "");
  });

  it("reads the latest check-in as the roster flag", () => {
    assert.equal(
      latestPracticeLight(
        [
          { skill_use: "later", skill_use_at: "2026-08-20T12:00:00.000Z" },
          { skill_use: "used", skill_use_at: "2026-08-22T12:00:00.000Z" },
          { skill_use: "dismissed", skill_use_at: "2026-08-21T12:00:00.000Z" },
        ],
        now
      ),
      "completed"
    );
    assert.equal(latestPracticeLight([{ skill_use: null }], now), null);
  });

  it("defaults roster_practice_light on because skill-use is already persisted", () => {
    assert.equal(rosterPracticeLight(), true);
    const flags = readFileSync(
      fileURLToPath(new URL("../lib/flags.ts", import.meta.url)),
      "utf8"
    );
    const env = readFileSync(
      fileURLToPath(new URL("../.env.example", import.meta.url)),
      "utf8"
    );
    assert.match(flags, /roster_practice_light/);
    assert.match(flags, /defaults ON/);
    assert.match(env, /ROSTER_PRACTICE_LIGHT=/);
  });

  it("lets companion use a practice skipped reason code", () => {
    const card = {
      training: {
        id: "t1",
        slug: "t1",
        title: "Fathering Fundamentals",
        description: null,
        session_count: 1,
        order_index: 1,
      },
      sessions: [],
      completed: 1,
      total: 2,
      assigned: true,
      gated: false,
      certificate: null,
      current: null,
      practiceLight: "dismissed" as const,
    } satisfies TrainingProgress;

    assert.equal(isPracticeSkipped("dismissed"), true);
    assert.equal(isPracticeSkipped("stale"), true);
    assert.equal(isPracticeSkipped("not_yet"), false);
    assert.equal(
      quietReasonCopy("2026-08-01T00:00:00.000Z", [card]).key,
      "manager.companion.reasonPracticeSkipped"
    );
    assert.equal(
      quietReasonCopy("2026-08-01T00:00:00.000Z", [{ ...card, practiceLight: "completed" }]).key,
      "manager.companion.reasonQuietDays"
    );
  });
});

describe("skill use card", () => {
  it("offers Completed, Not yet, and Dismiss on one unselected row", () => {
    const source = readFileSync(
      fileURLToPath(new URL("../components/father/skill-use-card.tsx", import.meta.url)),
      "utf8"
    );
    assert.match(source, /Completed/);
    assert.match(source, /Not yet/);
    assert.match(source, /Dismiss/);
    assert.match(source, /flex flex-row flex-wrap items-center gap-2/);
    assert.match(source, /variant="outline"/);
    assert.match(source, /setHidden\(true\)/);
    assert.doesNotMatch(source, /father\.session\.skillUseCompleted/);
    assert.doesNotMatch(source, /father\.session\.skillUseDismiss/);
    assert.doesNotMatch(source, /skillUseMarked/);
    assert.doesNotMatch(source, /showLater/);
  });
});
