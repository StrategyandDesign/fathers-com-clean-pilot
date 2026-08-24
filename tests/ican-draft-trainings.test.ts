import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { parseSkillPrompt } from "../lib/father/session-questions";
import { youtubeVideoId } from "../lib/father/types";
import {
  ICAN_DRAFT_MIGRATION,
  ICAN_DRAFT_SLUGS,
  ICAN_DRAFT_TRAININGS,
  ICAN_HOLD_DURATION_SECONDS,
  ICAN_HOLD_VIDEO_URL,
  assertIcanDraftCatalog,
  icanDraftPromptText,
  renderIcanDraftMigrationSql,
} from "../lib/trainings/ican-drafts";

const EM_DASH = "—";
const BANNED = [
  /\bhack(?:ing|s|ed)?\b/i,
  /\b10x\b/i,
  /\bEOS\b/,
  /\bVIP\b/,
  /\bcombat\b/i,
  /\bbarracks\b/i,
  /\bbattlefield\b/i,
  /\bfirefight\b/i,
  /\bdeployment\b/i,
];

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

describe("I CAN Super-admin draft trainings", () => {
  it("locks the four unpublished slugs with Writey session titles", () => {
    assertIcanDraftCatalog();
    assert.deepEqual(
      ICAN_DRAFT_TRAININGS.map((training) => training.slug),
      [...ICAN_DRAFT_SLUGS]
    );
    assert.deepEqual(
      ICAN_DRAFT_TRAININGS.map((training) => training.orderIndex),
      [10, 11, 12, 13]
    );
    assert.equal(ICAN_DRAFT_TRAININGS[0]?.title, "After-Action at the Door");
    assert.equal(ICAN_DRAFT_TRAININGS[1]?.title, "Direct Hours");
    assert.equal(ICAN_DRAFT_TRAININGS[2]?.title, "The Unscored Child");
    assert.equal(ICAN_DRAFT_TRAININGS[3]?.title, "Midcourse Correction");
    assert.equal(
      ICAN_DRAFT_TRAININGS[0]?.sessions[0]?.title,
      "The clipboard stops at the door"
    );
    assert.equal(
      ICAN_DRAFT_TRAININGS[3]?.sessions[11]?.title,
      "Stay Midcourse: I CAN Holds"
    );
  });

  it("authors complete A/B/C check-in and action prompts for every session", () => {
    for (const training of ICAN_DRAFT_TRAININGS) {
      assert.equal(training.sessions.length, 12);
      assert.match(training.leaderSummary, /I CAN/);
      assert.match(training.leaderSummary, /Not published/);
      assert.match(training.leaderSummary, /Sponsorship funds the organization/);
      assert.equal(training.description.includes(EM_DASH), false);
      assert.equal(training.leaderSummary.includes(EM_DASH), false);

      const pillars = new Set(training.sessions.map((session) => session.pillar));
      assert.deepEqual(
        [...pillars].sort(),
        ["Awareness", "Consistency", "Involvement", "Nurturance"]
      );

      for (const session of training.sessions) {
        assert.doesNotMatch(session.title, /^Session\s+\d+$/i);
        assert.ok(session.keyline.length > 0);
        assert.ok(session.keyline.length <= 160);
        assert.equal(session.title.includes(EM_DASH), false);
        assert.equal(session.keyline.includes(EM_DASH), false);

        const checkin = icanDraftPromptText(session.checkin);
        const action = icanDraftPromptText(session.action);
        const checkinParsed = parseSkillPrompt(checkin);
        const actionParsed = parseSkillPrompt(action);

        assert.ok(checkinParsed.choices?.length === 3);
        assert.ok(actionParsed.choices?.length === 3);
        assert.match(checkin, /\nA\) /);
        assert.match(checkin, /\nB\) /);
        assert.match(checkin, /\nC\) /);
        assert.equal(youtubeVideoId(ICAN_HOLD_VIDEO_URL), "yo_nS0vpV4M");
        assert.equal(ICAN_HOLD_DURATION_SECONDS, 300);

        const scanned = [session.title, session.keyline, checkin, action].join("\n");
        for (const pattern of BANNED) {
          assert.equal(pattern.test(scanned), false, `${training.slug} ${session.title}`);
        }
      }
    }
  });

  it("seeds drafts only: unpublished, unreleased, in_development", () => {
    const sql = readRepo(ICAN_DRAFT_MIGRATION);
    assert.equal(sql, renderIcanDraftMigrationSql());
    assert.match(sql, /published,\s*\n\s*released_at,\s*\n\s*development_status/);
    assert.match(sql, /published = false/);
    assert.match(sql, /released_at = null/);
    assert.match(sql, /development_status = 'in_development'/);
    assert.doesNotMatch(sql, /published\s*=\s*true/);
    assert.doesNotMatch(sql, /release_training_to_organizations/);
    assert.doesNotMatch(sql, /'Session \d+'/);

    for (const slug of ICAN_DRAFT_SLUGS) {
      assert.match(sql, new RegExp(`'${slug}'`));
    }
    assert.match(sql, /yo_nS0vpV4M/);
    assert.match(sql, /duration_seconds/);
    assert.match(sql, /^\s+300,$/m);
  });
});
