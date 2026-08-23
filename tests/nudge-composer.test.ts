import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  NUDGE_COOLDOWN_DAYS,
  nextNudgeEligibleAt,
  nudgeComposerState,
  type NudgeLogRow,
} from "../lib/manager/nudges";

function sent(daysAgo: number, now: number): NudgeLogRow {
  return {
    id: "n1",
    father_id: "f1",
    manager_id: "m1",
    template_key: "encouragement",
    status: "sent",
    sent_at: new Date(now - daysAgo * 86_400_000).toISOString(),
  };
}

describe("nudge composer after a send", () => {
  it("freezes the send form during the seven-day cooldown", () => {
    assert.deepEqual(
      nudgeComposerState({
        historyUnavailable: false,
        remindersAllowed: true,
        cooldownDays: 7,
        quiet: false,
      }),
      { kind: "cooldown", days: 7 }
    );
    assert.deepEqual(
      nudgeComposerState({
        historyUnavailable: false,
        remindersAllowed: true,
        cooldownDays: 0,
        quiet: false,
      }),
      { kind: "ready", quiet: false }
    );
    assert.deepEqual(
      nudgeComposerState({
        historyUnavailable: true,
        remindersAllowed: true,
        cooldownDays: 0,
        quiet: true,
      }),
      { kind: "check-failed" }
    );
    assert.deepEqual(
      nudgeComposerState({
        historyUnavailable: false,
        remindersAllowed: false,
        cooldownDays: 0,
        quiet: true,
      }),
      { kind: "reminders-off" }
    );
  });

  it("names the day the next send opens", () => {
    const now = Date.parse("2026-08-23T15:00:00.000Z");
    const last = sent(1, now);
    const opens = nextNudgeEligibleAt([last], now);
    assert.equal(NUDGE_COOLDOWN_DAYS, 7);
    assert.equal(opens, "2026-08-29T15:00:00.000Z");
    assert.equal(nextNudgeEligibleAt([sent(7, now)], now), null);
    assert.equal(nextNudgeEligibleAt([], now), null);
  });

  it("renames the section and points to the current session after a send", () => {
    const page = readFileSync(
      fileURLToPath(new URL("../app/(manager)/manager/participants/[id]/page.tsx", import.meta.url)),
      "utf8"
    );
    assert.match(page, /nudgeComposerState/);
    assert.match(page, /manager\.participants\.noteSent/);
    assert.match(page, /manager\.participants\.nudgeCooldownLead/);
    assert.match(page, /manager\.participants\.nudgeCooldownNext/);
    assert.match(page, /manager\.participants\.seeCurrentSession/);
    assert.match(page, /id="current-session"/);
    assert.match(page, /href="#current-session"/);
  });
});
