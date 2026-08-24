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
      "The stretch is over and your body has not heard the news. You walk through the door still high. The people inside did not live what you just carried. A child will borrow whatever you bring. Anyone else in the house may borrow it too, when they are there.\n\nCalm You Can Lend is twelve weeks of coming down at the door before you speak. You learn your own body tells, keep the same short ritual every return, and stay present once you are down. Soft voice and proximity go first. Correction waits. When you snap, you close it the same day. The ordinary hours that hold you are part of the work. None of this is a post or a streak. Involvement is staying in the room after you come down. Awareness is the surge named as a body signal. Consistency is the ritual you do not skip. Nurturance is the calm another person can actually use.\n\nEach week you watch a short film, answer one question, and try one practice.",
    leaderSummary:
      "Super-admin draft. Not published. Not released. The course owns the door and the calm he lends outward. Awareness of the surge, consistency of the return ritual, involvement once he is down, nurturance in calm others can borrow. A good week is the same short ritual, soft presence with the child and with whoever is inside when they are present, and same-day repair. If he teaches the come-down and never uses it at his own door, or turns body language into diagnosis talk, bring him back to one return. Sponsorship funds the organization, not a preferred seat.",
  },
  {
    slug: "the-house-that-kept-going",
    description:
      "While you were gone, the house kept going. Someone kept the meals, the bedtime, the school bag. It may have been a co-parent, kin, a program, or the child. The wound opens when you walk in and rewrite the rules as if nothing happened without you.\n\nThis course asks you to see that load in plain words and join what already works. You thank once, quietly. You ask before you change a rule. You take one real load the house names and finish it. Trust comes later than you want. When you snap at the system, you repair the same day with whoever was there. You do not install a second plan beside the one that kept the child. Involvement is the load you actually complete. Awareness is noticing who carried what. Consistency is the small promise kept. Nurturance is the tone when you reenter. No one in this house is assumed to be a mother or a partner.\n\nTwelve weeks of one film, one checkpoint, and one practice.",
    leaderSummary:
      "Super-admin draft. Not published. Not released. The carrier may be a co-parent, kin, a program, or the child. Awareness of the load, involvement in one named load finished, consistency of small promises, nurturance in tone and same-day repair. A good week is one asked load done, no parallel plan, and trust treated as something that lags. If gratitude becomes cover for taking the wheel, or the keeper of the house is treated like household management, bring him back to one asked load. Sponsorship funds the organization, not a preferred seat.",
  },
  {
    slug: "knowing-again",
    description:
      "Children change while you are away. Interests, fears, friends, and how they want you all move. Yesterday's picture of them will miss them, over and over. Knowing your child is never finished when the weeks keep sending you out and bringing you back.\n\nThis course is twelve weeks of meeting the child in front of you. You update a private note about who they are now. You ask once and listen longer. Hesitation is information, not a verdict on your worth. Small deposits that fit them beat a big make-up weekend. Presence comes before providing. If you miss, you repair softly the same day. Another caregiver may help you see what changed. They are an ally when they are part of the week, never a required messenger. Involvement is the matching deposit. Awareness is the updated picture. Consistency is showing up after the next stretch. Nurturance is meeting coolness without forcing a reunion.\n\nWhen you cannot sit with your child, you still complete the week on paper.",
    leaderSummary:
      "Super-admin draft. Not published. Not released. Awareness of who this child is now, involvement in matching deposits, consistency of frequency over a make-up weekend, nurturance with hesitation. A good week is an honest child-now picture, an ask before an assumption, and presence that extracts nothing for a resume. If knowing becomes a talent review, a growth dashboard, or a forced reunion, bring him back to one question and a closed mouth. Sponsorship funds the organization, not a preferred seat.",
  },
] as const;

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

function copyWithoutAntiDefault(text: string) {
  return text.replace(/No one in this house is assumed to be a mother or a partner\./gi, "");
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

    const anger = repoBacked.find((training) => training.slug === "anger");
    const reentry = repoBacked.find((training) => training.slug === "reentry");
    assert.equal(anger?.leaderSummary.startsWith("The work is noticing the surge"), true);
    assert.equal(reentry?.leaderSummary.startsWith("The return is a season"), true);

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
