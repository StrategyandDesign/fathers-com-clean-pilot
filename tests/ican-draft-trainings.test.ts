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
  ICAN_HOLD_VIDEO_MIGRATION,
  ICAN_HOLD_VIDEO_URL,
  ICAN_PREVIOUS_HOLD_VIDEO_URL,
  ICAN_RETURN_HOME_DRAFT_DESCRIPTION_MIGRATION,
  ICAN_RETURN_HOME_DRAFT_MIGRATION,
  ICAN_RETURN_HOME_DRAFT_SLUGS,
  ICAN_RETURN_HOME_FATHER_COPY_MIGRATION,
  assertIcanDraftCatalog,
  icanDraftsForSlugs,
  icanDraftPromptText,
  renderIcanDraftMigrationSql,
  renderIcanHoldVideoUpdateSql,
  renderReturnHomeFatherCopyUpdateSql,
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
const FATHER_AI_STACKS = [
  /No scoreboard\.\s*No peer forum/i,
  /Not treatment\.\s*Not a diagnosis/i,
  /This draft stays unpublished/i,
];

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
      assert.match(training.leaderSummary, /I CAN/);
      assert.match(training.leaderSummary, /Not published/);
      assert.match(training.leaderSummary, /Not released/);
      assert.match(training.leaderSummary, /Sponsorship funds the organization/);
      if ((ICAN_RETURN_HOME_DRAFT_SLUGS as readonly string[]).includes(training.slug)) {
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
        assert.equal(youtubeVideoId(ICAN_HOLD_VIDEO_URL), "aVO0k0a9Fc4");
        assert.equal(youtubeVideoId(ICAN_PREVIOUS_HOLD_VIDEO_URL), "yo_nS0vpV4M");
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
    assert.equal(
      sql,
      renderIcanDraftMigrationSql({ holdVideoUrl: ICAN_PREVIOUS_HOLD_VIDEO_URL })
    );
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
      assert.match(training.description, /The work stays between you and the house/);
      assert.equal(training.description.includes(EM_DASH), false);
      assert.equal(training.leaderSummary.includes(EM_DASH), false);
      for (const pattern of FATHER_AI_STACKS) {
        assert.equal(
          pattern.test(training.description),
          false,
          `${training.slug} ${pattern}`
        );
      }

      const scanned = copyWithoutAntiDefault(
        [training.description, training.leaderSummary].join("\n")
      );
      for (const pattern of [...BANNED, ...SPOUSE_OR_MOTHER_DEFAULT]) {
        assert.equal(pattern.test(scanned), false, `${training.slug} father-facing copy`);
      }
    }

    for (const training of icanDraftsForSlugs(ICAN_CEO_DRAFT_SLUGS)) {
      assert.doesNotMatch(training.description, /Purpose:/);
      assert.doesNotMatch(training.description, /Concrete objectives:/);
    }
  });

  it("keeps the original return-home description migration unpublished", () => {
    const sql = readRepo(ICAN_RETURN_HOME_DRAFT_DESCRIPTION_MIGRATION);
    assert.match(sql, /Update father-facing descriptions for the three return-home Super-admin drafts/);
    assert.match(sql, /published = false/);
    assert.doesNotMatch(sql, /published\s*=\s*true/);
    assert.doesNotMatch(sql, /release_training_to_organizations/);
  });

  it("updates return-home father copy without changing publish or release flags", () => {
    const sql = readRepo(ICAN_RETURN_HOME_FATHER_COPY_MIGRATION);
    assert.equal(sql, renderReturnHomeFatherCopyUpdateSql());
    assert.match(sql, /Leaves publish and release flags alone/);
    assert.doesNotMatch(sql, /published\s*=/);
    assert.doesNotMatch(sql, /released_at\s*=/);
    assert.doesNotMatch(sql, /development_status\s*=/);
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

  it("replaces the hold placeholder video without publishing or releasing", () => {
    const sql = readRepo(ICAN_HOLD_VIDEO_MIGRATION);
    assert.equal(sql, renderIcanHoldVideoUpdateSql());
    assert.equal(youtubeVideoId(ICAN_HOLD_VIDEO_URL), "aVO0k0a9Fc4");
    assert.match(sql, /aVO0k0a9Fc4/);
    assert.match(sql, /yo_nS0vpV4M/);
    assert.match(sql, /overview_video_url = 'https:\/\/www\.youtube\.com\/watch\?v=aVO0k0a9Fc4'/);
    assert.match(sql, /overview_video_url = 'https:\/\/www\.youtube\.com\/watch\?v=yo_nS0vpV4M'/);
    assert.match(sql, /video_url = 'https:\/\/www\.youtube\.com\/watch\?v=aVO0k0a9Fc4'/);
    assert.match(sql, /video_url = 'https:\/\/www\.youtube\.com\/watch\?v=yo_nS0vpV4M'/);
    assert.match(sql, /coalesce\(nullif\(btrim\(overview_video_url\), ''\), ''\) = ''/);
    assert.doesNotMatch(sql, /published\s*=/);
    assert.doesNotMatch(sql, /released_at\s*=/);
    assert.doesNotMatch(sql, /development_status\s*=/);
    assert.doesNotMatch(sql, /release_training_to_organizations/);
    assert.doesNotMatch(sql, /description\s*=/);
    assert.doesNotMatch(sql, /leader_summary\s*=/);
    assert.doesNotMatch(sql, /insert into public\.sessions/);
    assert.doesNotMatch(sql, /checkin_prompt/);
    assert.doesNotMatch(sql, /action_prompt/);
    assert.doesNotMatch(sql, /duration_seconds\s*=/);
    assert.doesNotMatch(sql, /SHOW_MILITARY/);
  });
});
