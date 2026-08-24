import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  CATALOG_DESCRIPTION_MIGRATION,
  CATALOG_DESCRIPTION_SLUGS,
  CATALOG_DESCRIPTION_TRAININGS,
  catalogDescriptionsForSlugs,
  renderCatalogDescriptionUpdateSql,
} from "../lib/trainings/catalog-descriptions";

const EM_DASH = "—";
const EN_DASH = "–";
const RETURN_HOME_SLUGS = [
  "calm-you-can-lend",
  "the-house-that-kept-going",
  "knowing-again",
] as const;
const BANNED = [
  /\bevidence-based\b/i,
  /\bcombat\b/i,
  /\bmilitary\b/i,
  /\bIDF\b/,
  /\bprison\b/i,
  /\bDaneshnia\b/i,
];
const FATHER_AI_STACKS = [
  /No scoreboard\.\s*No peer forum/i,
  /Not treatment\.\s*Not a diagnosis/i,
  /This draft stays unpublished/i,
];

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

describe("published catalog training descriptions", () => {
  it("locks father-facing copy for the three published catalog slugs", () => {
    assert.deepEqual(
      CATALOG_DESCRIPTION_TRAININGS.map((training) => training.slug),
      [...CATALOG_DESCRIPTION_SLUGS]
    );
    assert.deepEqual([...CATALOG_DESCRIPTION_SLUGS], ["fundamentals", "anger", "reentry"]);
  });

  it("keeps descriptions long enough and structured for fathers", () => {
    for (const training of catalogDescriptionsForSlugs(CATALOG_DESCRIPTION_SLUGS)) {
      assert.ok(training.description.length >= 1000, `${training.slug} description length`);
      assert.match(training.description, /Purpose:/);
      assert.match(training.description, /How a (week|session) works/);
      assert.equal(training.description.includes(EM_DASH), false);
      assert.equal(training.description.includes(EN_DASH), false);
      assert.equal(training.leaderSummary.includes(EM_DASH), false);
      assert.equal(training.leaderSummary.includes(EN_DASH), false);
      assert.doesNotMatch(training.leaderSummary, /Not published/i);
      assert.doesNotMatch(training.leaderSummary, /Not released/i);

      const scanned = [training.description, training.leaderSummary].join("\n");
      for (const pattern of BANNED) {
        assert.equal(pattern.test(scanned), false, `${training.slug} ${pattern}`);
      }
      for (const pattern of FATHER_AI_STACKS) {
        assert.equal(pattern.test(scanned), false, `${training.slug} ${pattern}`);
      }
    }
  });

  it("rejects leftover draft-unpublished language on published catalog trainings", () => {
    for (const training of catalogDescriptionsForSlugs(CATALOG_DESCRIPTION_SLUGS)) {
      assert.doesNotMatch(training.description, /This draft stays unpublished/i);
      assert.doesNotMatch(training.description, /Not published/i);
      assert.doesNotMatch(training.leaderSummary, /This draft stays unpublished/i);
      assert.doesNotMatch(training.leaderSummary, /Not published/i);
      assert.doesNotMatch(training.leaderSummary, /Not released/i);
    }
  });

  it("keeps fundamentals on nine sessions and reentry on borrowed nervous systems", () => {
    const fundamentals = catalogDescriptionsForSlugs(["fundamentals"])[0];
    const reentry = catalogDescriptionsForSlugs(["reentry"])[0];

    assert.match(fundamentals.description, /nine sessions/i);
    assert.equal(fundamentals.description.includes("What changes over twelve weeks"), false);
    assert.match(reentry.description, /Children borrow the adult nervous system they meet/);
  });

  it("updates only description and leader_summary for the three catalog slugs", () => {
    const sql = readRepo(CATALOG_DESCRIPTION_MIGRATION);
    assert.equal(sql, renderCatalogDescriptionUpdateSql());
    assert.match(
      sql,
      /Update father-facing descriptions for the three published catalog trainings/
    );
    assert.match(sql, /Does not change sessions, titles, published, released_at, or development_status/);
    assert.match(
      sql,
      /Does not touch calm-you-can-lend, the-house-that-kept-going, or knowing-again/
    );
    assert.doesNotMatch(sql, /published\s*=/);
    assert.doesNotMatch(sql, /released_at\s*=/);
    assert.doesNotMatch(sql, /development_status\s*=/);
    assert.doesNotMatch(sql, /insert into public\.sessions/);
    assert.doesNotMatch(sql, /checkin_prompt/);
    assert.doesNotMatch(sql, /action_prompt/);
    assert.match(
      sql,
      /and trainings\.slug in \('fundamentals', 'anger', 'reentry'\)/
    );

    for (const slug of CATALOG_DESCRIPTION_SLUGS) {
      assert.match(sql, new RegExp(`'${slug}'`));
    }
    for (const slug of RETURN_HOME_SLUGS) {
      assert.doesNotMatch(sql, new RegExp(`'${slug}'`));
    }

    const catalog = catalogDescriptionsForSlugs(CATALOG_DESCRIPTION_SLUGS);
    for (const training of catalog) {
      const descriptionSql = training.description.replaceAll("\n", "\\n").replaceAll("'", "''");
      const summarySql = training.leaderSummary.replaceAll("\n", "\\n").replaceAll("'", "''");
      assert.ok(sql.includes(descriptionSql), `${training.slug} description`);
      assert.ok(sql.includes(summarySql), `${training.slug} leader_summary`);
    }
  });
});
