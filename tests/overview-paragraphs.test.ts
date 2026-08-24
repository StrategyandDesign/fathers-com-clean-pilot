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
  repoBackedOverviewParagraphs,
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

const RETURN_HOME_OVERVIEW_LOCKS = [
  {
    slug: "calm-you-can-lend",
    description:
      "A father can come back from a hard stretch still carrying the body that kept him going. The people inside should not have to receive that leftover load at the door.\n\nCalm You Can Lend is the come-down before you speak. Same short ritual every return. Then a calmer voice, nearer presence, and correction that waits until you are actually home. Over twelve weeks the door itself changes. A child can settle near you. If you snap, you close it the same day. Notice when you are still high. Keep the ritual. Stay in the room once you are down, so the calm is something someone else can use.\n\nThis draft stays unpublished.",
    leaderSummary:
      "Watch the door. The course owns a short come-down and a calm he lends outward, not a tip he repeats for other men. Success looks like the same ritual every return, soft presence with the child and with whoever is inside when they are present, and same-day repair after a snap. Super-admin draft. Not published. Not released. Sponsorship funds the organization, not a preferred seat.",
  },
  {
    slug: "the-house-that-kept-going",
    description:
      "While you are away, a house often keeps running. Someone carries the routines: a co-parent, kin, a program, or the child. The wound opens when you walk in and rewrite the rules as if nothing happened without you.\n\nSee that load in plain words. Thank it once, without a speech. Join what already works. Ask before you change a rule. Take one real task the house names and finish it. Trust comes later than you want, through small kept promises and same-day repair. Notice who carried what. Finish the asked load. Keep the small promise. Watch your tone when you reenter. No one here is assumed to be a mother or a partner.\n\nThis draft stays unpublished.",
    leaderSummary:
      "He is joining a house that ran without him. The carrier may be a co-parent, kin, a program, or the child. Watch for an ask before any rule change, one joined rhythm, and trust treated as something that lags. If gratitude becomes a cover for taking the wheel again, bring him back to one named load. Super-admin draft. Not published. Not released. Sponsorship funds the organization, not a preferred seat.",
  },
  {
    slug: "knowing-again",
    description:
      "Children change while you are gone. Interests, fears, friends, and the way they want you all move. Yesterday's picture of them will miss them, because knowing is never finished when a man has been away.\n\nKnowing Again is meeting the child in front of you. You update the picture. You ask before you assume. You offer presence that fits who they are now. Small matching deposits beat a make-up weekend. Hesitation is information, not a verdict on your worth. Another caregiver may help you see what changed. They are an ally when they are part of the week, never a required messenger. Stay current on who this child is today, and meet coolness without forcing a reunion.\n\nIf you cannot sit with your child, the week still completes on paper.\n\nThis draft stays unpublished.",
    leaderSummary:
      "He is learning this child again, not recovering a former version. Watch for an updated picture, an ask before an assumption, and presence that is not a talent review. If the week becomes a growth dashboard or a forced reunion, bring him back to one matching deposit. Super-admin draft. Not published. Not released. Sponsorship funds the organization, not a preferred seat.",
  },
] as const;

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

function copyWithoutAntiDefault(text: string) {
  return text.replace(/No one here is assumed to be a mother or a partner\./gi, "");
}

function sqlEscaped(value: string) {
  return value.replaceAll("\n", "\\n").replaceAll("'", "''");
}

function assertKenVoiceCopy(training: {
  slug: string;
  description: string;
  leaderSummary: string;
}) {
  assert.ok(training.description.length > 0, `${training.slug} description`);
  assert.ok(training.leaderSummary.length > 0, `${training.slug} leader_summary`);
  assert.equal(training.leaderSummary.startsWith("Leader: "), false);
  assert.equal(training.description.includes(EM_DASH), false);
  assert.equal(training.leaderSummary.includes(EM_DASH), false);
  assert.equal(training.description.includes(EN_DASH), false);
  assert.equal(training.leaderSummary.includes(EN_DASH), false);

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

describe("stored training overview paragraphs", () => {
  it("locks Ken-voice copy for the ten slugs and rejects the old AI markers", () => {
    const repoBacked = repoBackedOverviewParagraphs();
    assert.deepEqual(
      repoBacked.map((training) => training.slug),
      [...CATALOG_DESCRIPTION_SLUGS, ...ICAN_CEO_DRAFT_SLUGS]
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

    const fundamentals = repoBacked.find((training) => training.slug === "fundamentals");
    const anger = repoBacked.find((training) => training.slug === "anger");
    const reentry = repoBacked.find((training) => training.slug === "reentry");
    const afterAction = repoBacked.find((training) => training.slug === "after-action-at-the-door");
    const directHours = repoBacked.find((training) => training.slug === "direct-hours");
    const unscored = repoBacked.find((training) => training.slug === "unscored-child");
    const midcourse = repoBacked.find((training) => training.slug === "midcourse-correction");
    assert.equal(
      fundamentals?.description.startsWith("A father does not become effective by collecting ideas."),
      true
    );
    assert.equal(anger?.description.startsWith("The people nearest you feel your heat first."), true);
    assert.equal(
      reentry?.description.startsWith(
        "A man can do his work away from home and still walk through the door carrying the body that kept him there."
      ),
      true
    );
    assert.equal(anger?.leaderSummary.startsWith("Help him notice the surge"), true);
    assert.equal(reentry?.leaderSummary.startsWith("Stay with the body at the door"), true);
    assert.equal(
      afterAction?.description.startsWith("A day can go wrong in a doorway, a kitchen, a car."),
      true
    );
    assert.equal(directHours?.description.startsWith("A child does not need another dashboard."), true);
    assert.equal(
      unscored?.description.startsWith("Almost every hour in a child's week already has a score."),
      true
    );
    assert.equal(
      midcourse?.description.startsWith("You do not stop the ship to become a better father."),
      true
    );
    assert.equal(
      RETURN_HOME_OVERVIEW_LOCKS[0].description.startsWith(
        "A father can come back from a hard stretch still carrying the body that kept him going."
      ),
      true
    );
    assert.equal(
      RETURN_HOME_OVERVIEW_LOCKS[1].description.startsWith("While you are away, a house often keeps running."),
      true
    );
    assert.equal(
      RETURN_HOME_OVERVIEW_LOCKS[2].description.startsWith("Children change while you are gone."),
      true
    );

    for (const training of repoBacked) {
      assertKenVoiceCopy(training);
    }
    for (const training of RETURN_HOME_OVERVIEW_LOCKS) {
      assertKenVoiceCopy(training);
    }
  });

  it("updates only description and leader_summary for the ten slugs", () => {
    const sql = readRepo(OVERVIEW_PARAGRAPH_MIGRATION);
    assert.match(sql, /Update stored overview paragraphs for ten trainings by slug/);
    assert.match(
      sql,
      /Does not change titles, published, released_at, sessions, videos, or development_status/
    );
    assert.match(sql, /Does not touch test or flourishingfaith/);
    assert.match(sql, /have no TypeScript seed/);
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

    for (const training of [...repoBackedOverviewParagraphs(), ...RETURN_HOME_OVERVIEW_LOCKS]) {
      assert.ok(sql.includes(sqlEscaped(training.description)), `${training.slug} description`);
      assert.ok(sql.includes(sqlEscaped(training.leaderSummary)), `${training.slug} leader_summary`);
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
