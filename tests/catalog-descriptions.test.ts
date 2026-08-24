import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  CATALOG_DESCRIPTION_MIGRATION,
  CATALOG_DESCRIPTION_SLUGS,
  CATALOG_DESCRIPTION_TRAININGS,
  KEN_VOICE_SESSION_1,
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
  /Purpose:/,
  /Concrete objectives/,
  /Kill the week/,
  /This training is for fathers who/,
  /Not treatment\.\s*Not a diagnosis/,
  /This draft stays unpublished/,
  /No scoreboard\.\s*No peer forum/i,
];

const OPENINGS: Record<string, string> = {
  fundamentals: "A father does not become effective by collecting ideas.",
  anger: "The people nearest you feel your heat first.",
  reentry:
    "A man can do his work away from home and still walk through the door carrying the body that kept him there.",
};

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

  it("locks Ken-voice v5 openings and rejects the old AI overview stacks", () => {
    for (const training of catalogDescriptionsForSlugs(CATALOG_DESCRIPTION_SLUGS)) {
      assert.ok(training.description.startsWith(OPENINGS[training.slug] ?? ""));
      assert.equal(training.description.includes(EM_DASH), false);
      assert.equal(training.description.includes(EN_DASH), false);
      assert.equal(training.leaderSummary.includes(EM_DASH), false);
      assert.equal(training.leaderSummary.includes(EN_DASH), false);
      assert.doesNotMatch(training.leaderSummary, /Not published/i);
      assert.doesNotMatch(training.leaderSummary, /Not released/i);
      assert.doesNotMatch(training.leaderSummary, /^Leader: /);

      const scanned = [training.description, training.leaderSummary].join("\n");
      for (const pattern of BANNED) {
        assert.equal(pattern.test(scanned), false, `${training.slug} ${pattern}`);
      }
      for (const pattern of FATHER_AI_STACKS) {
        assert.equal(pattern.test(scanned), false, `${training.slug} ${pattern}`);
      }
    }
  });

  it("keeps fundamentals on nine sessions and ends with the house line", () => {
    const fundamentals = catalogDescriptionsForSlugs(["fundamentals"])[0];
    const anger = catalogDescriptionsForSlugs(["anger"])[0];
    const reentry = catalogDescriptionsForSlugs(["reentry"])[0];

    assert.match(fundamentals.description, /nine sessions/i);
    assert.ok(fundamentals.description.trimEnd().endsWith("The work stays between you and the house."));
    assert.equal(fundamentals.description.includes("What changes over twelve weeks"), false);
    assert.match(anger.leaderSummary, /^Help him notice the surge/);
    assert.match(reentry.leaderSummary, /^Stay with the body at the door/);
  });

  it("starts session 1 check-in with a named learning and optional A/B/C", () => {
    for (const session of KEN_VOICE_SESSION_1) {
      assert.match(
        session.checkinPrompt,
        /write one short thing you learned|Name it|what was that routine\?/
      );
      assert.match(session.checkinPrompt, /\n\nA\) /);
      assert.match(session.checkinPrompt, /\nB\) /);
      assert.match(session.checkinPrompt, /\nC\) /);
    }

    const fundamentals = KEN_VOICE_SESSION_1.find((row) => row.slug === "fundamentals");
    const calm = KEN_VOICE_SESSION_1.find((row) => row.slug === "calm-you-can-lend");
    assert.match(fundamentals?.checkinPrompt ?? "", /write one short thing you learned/);
    assert.equal(calm?.title, "Before You Speak");
    assert.match(calm?.checkinPrompt ?? "", /Name it/);
    assert.equal(
      KEN_VOICE_SESSION_1.some((row) => row.title === "Body at the door"),
      false
    );
  });

  it("updates description, leader_summary, Calm S1 title, and session 1 check-in by slug", () => {
    const sql = readRepo(CATALOG_DESCRIPTION_MIGRATION);
    assert.equal(sql, renderCatalogDescriptionUpdateSql());
    assert.match(sql, /Lock Ken-voice v5 father-facing copy to match live Pilot/);
    assert.match(sql, /Does not change published, released_at, or development_status/);
    assert.match(sql, /checkin_prompt/);
    assert.match(sql, /Before You Speak/);
    assert.doesNotMatch(sql, /published\s*=/);
    assert.doesNotMatch(sql, /released_at\s*=/);
    assert.doesNotMatch(sql, /development_status\s*=/);
    assert.doesNotMatch(sql, /insert into public\.sessions/);
    assert.doesNotMatch(sql, /action_prompt/);
    assert.doesNotMatch(sql, /Body at the door/);

    for (const slug of [...CATALOG_DESCRIPTION_SLUGS, ...RETURN_HOME_SLUGS]) {
      assert.match(sql, new RegExp(`'${slug}'`));
    }

    const catalog = catalogDescriptionsForSlugs(CATALOG_DESCRIPTION_SLUGS);
    for (const training of catalog) {
      const descriptionSql = training.description.replaceAll("\n", "\\n").replaceAll("'", "''");
      const summarySql = training.leaderSummary.replaceAll("\n", "\\n").replaceAll("'", "''");
      assert.ok(sql.includes(descriptionSql), `${training.slug} description`);
      assert.ok(sql.includes(summarySql), `${training.slug} leader_summary`);
    }

    for (const session of KEN_VOICE_SESSION_1) {
      const checkinSql = session.checkinPrompt.replaceAll("\n", "\\n").replaceAll("'", "''");
      assert.ok(sql.includes(checkinSql), `${session.slug} checkin_prompt`);
    }
  });
});
