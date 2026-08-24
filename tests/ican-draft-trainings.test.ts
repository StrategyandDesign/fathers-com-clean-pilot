import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { parseSkillPrompt } from "../lib/father/session-questions";
import { youtubeVideoId } from "../lib/father/types";
import {
  ICAN_CEO_DRAFT_SLUGS,
  ICAN_DRAFT_MIGRATION,
  ICAN_DRAFT_SLUGS,
  ICAN_DRAFT_TRAININGS,
  ICAN_HOLD_DURATION_SECONDS,
  ICAN_HOLD_VIDEO_URL,
  ICAN_RETURN_HOME_DRAFT_DESCRIPTION_MIGRATION,
  ICAN_RETURN_HOME_DRAFT_MIGRATION,
  ICAN_RETURN_HOME_DRAFT_SLUGS,
  assertIcanDraftCatalog,
  icanDraftsForSlugs,
  icanDraftPromptText,
  renderReturnHomeDraftDescriptionUpdateSql,
  renderReturnHomeDraftMigrationSql,
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
  /\bmilitary\b/i,
  /\bIDF\b/,
  /\bIsrael(?:i)?\b/i,
  /\bPTSD\b/i,
  /\bVA\b/,
  /\bevidence-based\b/i,
];
const SPOUSE_OR_MOTHER_DEFAULT = [/\bwife\b/i, /\bmom\b/i, /\bmother\b/i, /\bshe\b/i];

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

function copyWithoutAntiDefault(text: string) {
  return text
    .replace(/spouse-or-mother/gi, "")
    .replace(/no default to a mother or partner/gi, "");
}

describe("I CAN Super-admin draft trainings", () => {
  it("locks the seven unpublished slugs with Writey session titles", () => {
    assertIcanDraftCatalog();
    assert.deepEqual(
      ICAN_DRAFT_TRAININGS.map((training) => training.slug),
      [...ICAN_DRAFT_SLUGS]
    );
    assert.deepEqual(
      ICAN_DRAFT_TRAININGS.map((training) => training.orderIndex),
      [10, 11, 12, 13, 14, 15, 16]
    );
    assert.deepEqual([...ICAN_CEO_DRAFT_SLUGS], [
      "after-action-at-the-door",
      "direct-hours",
      "unscored-child",
      "midcourse-correction",
    ]);
    assert.deepEqual([...ICAN_RETURN_HOME_DRAFT_SLUGS], [
      "calm-you-can-lend",
      "the-house-that-kept-going",
      "knowing-again",
    ]);
    assert.equal(ICAN_DRAFT_TRAININGS[0]?.title, "After-Action at the Door");
    assert.equal(ICAN_DRAFT_TRAININGS[1]?.title, "Direct Hours");
    assert.equal(ICAN_DRAFT_TRAININGS[2]?.title, "The Unscored Child");
    assert.equal(ICAN_DRAFT_TRAININGS[3]?.title, "Midcourse Correction");
    assert.equal(ICAN_DRAFT_TRAININGS[4]?.title, "Calm You Can Lend");
    assert.equal(ICAN_DRAFT_TRAININGS[5]?.title, "The House That Kept Going");
    assert.equal(ICAN_DRAFT_TRAININGS[6]?.title, "Knowing Again");
    assert.equal(
      ICAN_DRAFT_TRAININGS[0]?.sessions[0]?.title,
      "The clipboard stops at the door"
    );
    assert.equal(
      ICAN_DRAFT_TRAININGS[3]?.sessions[11]?.title,
      "Stay Midcourse: I CAN Holds"
    );
    assert.equal(ICAN_DRAFT_TRAININGS[4]?.sessions[0]?.title, "Body at the door");
    assert.equal(ICAN_DRAFT_TRAININGS[4]?.sessions[1]?.title, "Come down");
    assert.equal(ICAN_DRAFT_TRAININGS[4]?.sessions[3]?.title, "Lend calm to child");
    assert.equal(ICAN_DRAFT_TRAININGS[4]?.sessions[5]?.pillar, "Awareness");
    assert.equal(ICAN_DRAFT_TRAININGS[4]?.sessions[11]?.pillar, "Consistency");
    assert.equal(
      ICAN_DRAFT_TRAININGS[4]?.sessions[0]?.keyline,
      "Your body arrives before your words do."
    );
    assert.equal(ICAN_DRAFT_TRAININGS[5]?.sessions[0]?.title, "The house kept going");
    assert.equal(
      ICAN_DRAFT_TRAININGS[5]?.sessions[0]?.keyline,
      "While you were gone, the house kept going."
    );
    assert.equal(
      ICAN_DRAFT_TRAININGS[5]?.sessions[1]?.keyline,
      "See the load in plain words. Whoever carried it."
    );
    assert.equal(
      ICAN_DRAFT_TRAININGS[6]?.sessions[7]?.keyline,
      "Name the missed milestone without extracting a resume."
    );
    assert.equal(
      ICAN_DRAFT_TRAININGS[6]?.sessions[11]?.title,
      "A countable week of knowing again"
    );
  });

  it("authors complete A/B/C check-in and action prompts for every session", () => {
    assert.equal(icanDraftsForSlugs(ICAN_RETURN_HOME_DRAFT_SLUGS).flatMap((row) => row.sessions).length, 36);

    for (const training of ICAN_DRAFT_TRAININGS) {
      assert.equal(training.sessions.length, 12);
      assert.match(training.leaderSummary, /Not published/);
      assert.match(training.leaderSummary, /Not released/);
      assert.match(training.leaderSummary, /Sponsorship funds the organization/);
      assert.equal(training.leaderSummary.startsWith("Leader: "), false);
      if ((ICAN_CEO_DRAFT_SLUGS as readonly string[]).includes(training.slug)) {
        assert.match(training.description, /Involvement/);
        assert.match(training.description, /Consistency/);
        assert.match(training.description, /Awareness/);
        assert.match(training.description, /Nurturance/);
        assert.doesNotMatch(training.description, /Purpose:/);
        assert.doesNotMatch(training.description, /Concrete objectives/);
        assert.doesNotMatch(training.leaderSummary, /Kill the week/);
        assert.doesNotMatch(training.description, /This training is for fathers who/);
        assert.doesNotMatch(training.description, /Not treatment\. Not a diagnosis/);
      } else {
        assert.match(training.leaderSummary, /I CAN/);
        assert.match(training.leaderSummary, /Involvement/);
        assert.match(training.leaderSummary, /Consistency/);
        assert.match(training.leaderSummary, /Awareness/);
        assert.match(training.leaderSummary, /Nurturance/);
      }
      assert.equal(training.description.includes(EM_DASH), false);
      assert.equal(training.leaderSummary.includes(EM_DASH), false);
      assert.doesNotMatch(training.description, /ican-.*\.png/i);
      assert.doesNotMatch(training.leaderSummary, /ican-.*\.png/i);

      const pillars = new Set(training.sessions.map((session) => session.pillar));
      if (training.slug === "calm-you-can-lend") {
        assert.deepEqual(
          training.sessions.map((session) => session.pillar),
          [
            "Awareness",
            "Consistency",
            "Awareness",
            "Nurturance",
            "Nurturance",
            "Awareness",
            "Nurturance",
            "Consistency",
            "Awareness",
            "Awareness",
            "Consistency",
            "Consistency",
          ]
        );
      } else {
        assert.deepEqual(
          [...pillars].sort(),
          ["Awareness", "Consistency", "Involvement", "Nurturance"]
        );
      }

      const scannedTraining = copyWithoutAntiDefault(
        [training.title, training.description, training.leaderSummary].join("\n")
      );
      for (const pattern of [...BANNED, ...SPOUSE_OR_MOTHER_DEFAULT]) {
        assert.equal(pattern.test(scannedTraining), false, `${training.slug} catalog copy`);
      }

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
        assert.match(action, /\nA\) /);
        assert.match(action, /\nB\) /);
        assert.match(action, /\nC\) /);
        assert.equal(youtubeVideoId(ICAN_HOLD_VIDEO_URL), "yo_nS0vpV4M");
        assert.equal(ICAN_HOLD_DURATION_SECONDS, 300);

        const scanned = copyWithoutAntiDefault(
          [session.title, session.keyline, checkin, action].join("\n")
        );
        for (const pattern of [...BANNED, ...SPOUSE_OR_MOTHER_DEFAULT]) {
          assert.equal(pattern.test(scanned), false, `${training.slug} ${session.title}`);
        }
      }
    }
  });

  it("seeds CEO drafts only in the original unpublished migration", () => {
    const sql = readRepo(ICAN_DRAFT_MIGRATION);
    assert.match(sql, /published,\s*\n\s*released_at,\s*\n\s*development_status/);
    assert.match(sql, /published = false/);
    assert.match(sql, /released_at = null/);
    assert.match(sql, /development_status = 'in_development'/);
    assert.doesNotMatch(sql, /published\s*=\s*true/);
    assert.doesNotMatch(sql, /release_training_to_organizations/);
    assert.doesNotMatch(sql, /'Session \d+'/);

    for (const slug of ICAN_CEO_DRAFT_SLUGS) {
      assert.match(sql, new RegExp(`'${slug}'`));
    }
    for (const slug of ICAN_RETURN_HOME_DRAFT_SLUGS) {
      assert.doesNotMatch(sql, new RegExp(`'${slug}'`));
    }
    assert.match(sql, /yo_nS0vpV4M/);
    assert.match(sql, /duration_seconds/);
    assert.match(sql, /^\s+300,$/m);
  });

  it("seeds the three return-home drafts in a new unpublished migration", () => {
    const sql = readRepo(ICAN_RETURN_HOME_DRAFT_MIGRATION);
    assert.match(sql, /Seed three Super-admin return-home I CAN draft trainings/);
    assert.match(sql, /published,\s*\n\s*released_at,\s*\n\s*development_status/);
    assert.match(sql, /published = false/);
    assert.match(sql, /released_at = null/);
    assert.match(sql, /development_status = 'in_development'/);
    assert.doesNotMatch(sql, /published\s*=\s*true/);
    assert.doesNotMatch(sql, /release_training_to_organizations/);
    assert.doesNotMatch(sql, /'Session \d+'/);

    for (const slug of ICAN_RETURN_HOME_DRAFT_SLUGS) {
      assert.match(sql, new RegExp(`'${slug}'`));
    }
    for (const slug of ICAN_CEO_DRAFT_SLUGS) {
      assert.doesNotMatch(sql, new RegExp(`'${slug}'`));
    }
    assert.match(sql, /yo_nS0vpV4M/);
    assert.match(sql, /duration_seconds/);
    assert.match(sql, /^\s+300,$/m);
    assert.equal((sql.match(/yo_nS0vpV4M/g) ?? []).length, 36);
    assert.equal(sql.includes("Purpose:"), false);
    assert.equal(renderReturnHomeDraftMigrationSql().includes("Purpose:"), true);
  });

  it("writes father-facing purpose, objectives, and tone on the three return-home drafts", () => {
    for (const training of icanDraftsForSlugs(ICAN_RETURN_HOME_DRAFT_SLUGS)) {
      assert.match(training.description, /Purpose:|Over twelve weeks/i);
      assert.match(training.description, /film/i);
      assert.match(training.description, /checkpoint/i);
      assert.match(training.description, /practice/i);
      assert.match(training.description, /This training is for fathers/);
      assert.equal(training.description.includes(EM_DASH), false);
      assert.equal(training.leaderSummary.includes(EM_DASH), false);

      const scanned = copyWithoutAntiDefault(
        [training.description, training.leaderSummary].join("\n")
      );
      for (const pattern of [...BANNED, ...SPOUSE_OR_MOTHER_DEFAULT]) {
        assert.equal(pattern.test(scanned), false, `${training.slug} father-facing copy`);
      }
    }

    const [afterAction, directHours, unscoredChild, midcourse] = icanDraftsForSlugs(ICAN_CEO_DRAFT_SLUGS);
    assert.equal(
      afterAction.description,
      "The miss already happened. What matters now is the next honest hour. You name it in plain words, own the part that is yours with no defense, and close it the same day with the person who was there. Then you put the clipboard down.\n\nThis course trains a short after-action at home that does not turn the household into a review board. Involvement is walking across the room. Awareness is seeing the miss without spin. Consistency is closing it before you sleep. Nurturance is how the repair lands, and how you stop scoring yourself afterward. Ten minutes is enough. The child who overheard it needs a short, age-fit close. So does the other adult, when they were hit too.\n\nEach week is a short film, a checkpoint, and one lived close. If the repair can be told as a leadership story, it failed the people at your table."
    );
    assert.equal(
      afterAction.leaderSummary,
      "Super-admin draft. Not published. Not released. Named, owned, closed, same day, then forgotten as a brand. Awareness of the miss, involvement in the close, consistency of same-day timing, nurturance in how it lands. Watch for forum anecdotes, long speeches, and pride dressed as patience. Sponsorship funds the organization, not a preferred seat."
    );
    assert.equal(
      directHours.description,
      "Your child does not need another dashboard. They need hours of care the firm cannot have. Direct Hours is a constraint, not a target: one device-down block each weekday you are in town, and one longer block on the weekend.\n\nThe phone leaves the room. Errands with a screen nearby do not count. Travel weeks do not get a pretend win. You restore the first block the day you get back. Involvement is showing up in the window you named. Awareness is knowing what is actually care. Consistency is the weekday and the weekend kept. Nurturance is attention the child can feel, without you scanning their face for payoff.\n\nTwelve weeks of one film, one checkpoint, and one practice. If you are winning Direct Hours in a chat, stop."
    );
    assert.equal(
      unscoredChild.description,
      "Almost every hour in a child's week already has a score. This course protects one hour that does not: no lesson, no sport framed as development, no college signal. You sit with this child and produce nothing you can report.\n\nKen's work on knowing your child lives here as a weekly hour. You keep a private picture of who they are now, what they are into, what frightens them, and what is coming. You ask questions that are not advice in disguise. You listen longer than you talk. Moods are something you sit with, not something you fix. Involvement is being there. Awareness is the child in the present tense. Consistency is the hour that keeps returning. Nurturance is presence that extracts no return.\n\nIf the hour yields insight you could pitch on Monday, it failed."
    );
    assert.equal(
      midcourse.description,
      "You do not stop the ship to become a better father. You make a small turn while it is still moving. Midcourse correction is one countable act a week that means nothing to the firm and cannot be reported as leadership development.\n\nBefore Sunday ends you pick the act. You do it once, plainly, and you do not announce it. Hot weeks move the act earlier, not later. Involvement is the act done. Awareness is knowing what to turn toward. Consistency is twelve quiet weeks. Nurturance is the part you will not put on a slide.\n\nIf it could go in a forum update, pick a different act."
    );
    for (const training of icanDraftsForSlugs(ICAN_CEO_DRAFT_SLUGS)) {
      assert.doesNotMatch(training.description, /Purpose:/);
      assert.doesNotMatch(training.description, /Concrete objectives/);
      assert.doesNotMatch(training.description, /This training is for fathers who/);
      assert.doesNotMatch(training.description, /Not treatment\. Not a diagnosis/);
      assert.doesNotMatch(training.leaderSummary, /Kill the week/);
      assert.equal(training.leaderSummary.startsWith("Leader: "), false);
    }
  });

  it("updates only the three return-home draft descriptions without publishing", () => {
    const sql = readRepo(ICAN_RETURN_HOME_DRAFT_DESCRIPTION_MIGRATION);
    assert.equal(sql, renderReturnHomeDraftDescriptionUpdateSql());
    assert.match(sql, /Update father-facing descriptions for the three return-home Super-admin drafts/);
    assert.match(sql, /published = false/);
    assert.doesNotMatch(sql, /published\s*=\s*true/);
    assert.doesNotMatch(sql, /release_training_to_organizations/);
    assert.doesNotMatch(sql, /insert into public\.sessions/);
    assert.doesNotMatch(sql, /checkin_prompt/);
    assert.doesNotMatch(sql, /action_prompt/);

    for (const slug of ICAN_RETURN_HOME_DRAFT_SLUGS) {
      assert.match(sql, new RegExp(`'${slug}'`));
    }
    for (const slug of ICAN_CEO_DRAFT_SLUGS) {
      assert.doesNotMatch(sql, new RegExp(`'${slug}'`));
    }

    const catalog = icanDraftsForSlugs(ICAN_RETURN_HOME_DRAFT_SLUGS);
    for (const training of catalog) {
      const descriptionSql = training.description.replaceAll("\n", "\\n").replaceAll("'", "''");
      const summarySql = training.leaderSummary.replaceAll("\n", "\\n").replaceAll("'", "''");
      assert.ok(sql.includes(descriptionSql), `${training.slug} description`);
      assert.ok(sql.includes(summarySql), `${training.slug} leader_summary`);
    }
  });
});
