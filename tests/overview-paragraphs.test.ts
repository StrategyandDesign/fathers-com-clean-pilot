import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { CATALOG_DESCRIPTION_SLUGS } from "../lib/trainings/catalog-descriptions";
import { ICAN_CEO_DRAFT_SLUGS } from "../lib/trainings/ican-drafts";
import {
  AI_OVERVIEW_MARKERS,
  OVERVIEW_PARAGRAPH_MIGRATION,
  OVERVIEW_PARAGRAPH_SLUGS,
  RETURN_HOME_OVERVIEW_SLUGS,
  UNTOUCHED_OVERVIEW_SLUGS,
  overviewParagraphs,
  renderOverviewParagraphUpdateSql,
} from "../lib/trainings/overview-paragraphs";

const EM_DASH = "—";
const EN_DASH = "–";
const BANNED = [
  /\bevidence-based\b/i,
  /\bcombat\b/i,
  /\bmilitary\b/i,
  /\bIDF\b/,
  /\bprison\b/i,
  /\bDaneshnia\b/i,
];
const SPOUSE_OR_MOTHER_DEFAULT = [/\bwife\b/i, /\bmom\b/i, /\bmother\b/i, /\bshe\b/i];

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

function copyWithoutAntiDefault(text: string) {
  return text.replace(/No one in this house is assumed to be a mother or a partner\./gi, "");
}

describe("stored training overview paragraphs", () => {
  it("locks Ken-voice copy for the ten slugs and rejects the old AI markers", () => {
    const trainings = overviewParagraphs();
    assert.deepEqual(
      trainings.map((training) => training.slug),
      [...OVERVIEW_PARAGRAPH_SLUGS]
    );
    assert.deepEqual([...OVERVIEW_PARAGRAPH_SLUGS], [
      "fundamentals",
      "anger",
      "reentry",
      "calm-you-can-lend",
      "the-house-that-kept-going",
      "knowing-again",
      "after-action-at-the-door",
      "direct-hours",
      "unscored-child",
      "midcourse-correction",
    ]);

    const anger = trainings.find((training) => training.slug === "anger");
    const reentry = trainings.find((training) => training.slug === "reentry");
    assert.equal(anger?.leaderSummary.startsWith("The work is noticing the surge"), true);
    assert.equal(reentry?.leaderSummary.startsWith("The return is a season"), true);

    for (const training of trainings) {
      assert.ok(training.description.length > 0, `${training.slug} description`);
      assert.ok(training.leaderSummary.length > 0, `${training.slug} leader_summary`);
      assert.equal(training.leaderSummary.startsWith("Leader: "), false);
      assert.equal(training.description.includes(EM_DASH), false);
      assert.equal(training.leaderSummary.includes(EM_DASH), false);
      assert.equal(training.description.includes(EN_DASH), false);
      assert.equal(training.leaderSummary.includes(EN_DASH), false);
      assert.match(training.description, /Involvement/);
      assert.match(training.description, /Awareness/);
      assert.match(training.description, /Consistency/);
      assert.match(training.description, /Nurturance/);

      const scanned = [training.description, training.leaderSummary].join("\n");
      for (const marker of AI_OVERVIEW_MARKERS) {
        assert.equal(scanned.includes(marker), false, `${training.slug} ${marker}`);
      }
      for (const pattern of BANNED) {
        assert.equal(pattern.test(scanned), false, `${training.slug} ${pattern}`);
      }
      const spouseSafe = copyWithoutAntiDefault(scanned);
      for (const pattern of SPOUSE_OR_MOTHER_DEFAULT) {
        assert.equal(pattern.test(spouseSafe), false, `${training.slug} ${pattern}`);
      }
    }
  });

  it("updates only description and leader_summary for the ten slugs", () => {
    const sql = readRepo(OVERVIEW_PARAGRAPH_MIGRATION);
    assert.equal(sql, renderOverviewParagraphUpdateSql());
    assert.match(sql, /Update stored overview paragraphs for ten trainings by slug/);
    assert.match(
      sql,
      /Does not change titles, published, released_at, sessions, videos, or development_status/
    );
    assert.match(sql, /Does not touch test or flourishingfaith/);
    assert.doesNotMatch(sql, /published\s*=/);
    assert.doesNotMatch(sql, /released_at\s*=/);
    assert.doesNotMatch(sql, /development_status\s*=/);
    assert.doesNotMatch(sql, /insert into public\.sessions/);
    assert.doesNotMatch(sql, /checkin_prompt/);
    assert.doesNotMatch(sql, /action_prompt/);
    assert.doesNotMatch(sql, /title\s*=/);
    assert.match(
      sql,
      /and trainings\.slug in \('fundamentals', 'anger', 'reentry', 'calm-you-can-lend', 'the-house-that-kept-going', 'knowing-again', 'after-action-at-the-door', 'direct-hours', 'unscored-child', 'midcourse-correction'\)/
    );

    for (const slug of OVERVIEW_PARAGRAPH_SLUGS) {
      assert.match(sql, new RegExp(`'${slug}'`));
    }
    for (const slug of UNTOUCHED_OVERVIEW_SLUGS) {
      assert.doesNotMatch(sql, new RegExp(`'${slug}'`));
    }

    for (const training of overviewParagraphs()) {
      const descriptionSql = training.description.replaceAll("\n", "\\n").replaceAll("'", "''");
      const summarySql = training.leaderSummary.replaceAll("\n", "\\n").replaceAll("'", "''");
      assert.ok(sql.includes(descriptionSql), `${training.slug} description`);
      assert.ok(sql.includes(summarySql), `${training.slug} leader_summary`);
    }

    assert.deepEqual([...CATALOG_DESCRIPTION_SLUGS], ["fundamentals", "anger", "reentry"]);
    assert.deepEqual([...RETURN_HOME_OVERVIEW_SLUGS], [
      "calm-you-can-lend",
      "the-house-that-kept-going",
      "knowing-again",
    ]);
    assert.deepEqual([...ICAN_CEO_DRAFT_SLUGS], [
      "after-action-at-the-door",
      "direct-hours",
      "unscored-child",
      "midcourse-correction",
    ]);
  });
});
