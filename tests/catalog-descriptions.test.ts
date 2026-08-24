import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CATALOG_DESCRIPTION_SLUGS,
  CATALOG_DESCRIPTION_TRAININGS,
  catalogDescriptionsForSlugs,
} from "../lib/trainings/catalog-descriptions";
import { AI_OVERVIEW_MARKERS } from "../lib/trainings/overview-paragraphs";

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

describe("published catalog training descriptions", () => {
  it("locks father-facing copy for the three published catalog slugs", () => {
    assert.deepEqual(
      CATALOG_DESCRIPTION_TRAININGS.map((training) => training.slug),
      [...CATALOG_DESCRIPTION_SLUGS]
    );
    assert.deepEqual([...CATALOG_DESCRIPTION_SLUGS], ["fundamentals", "anger", "reentry"]);
  });

  it("locks Ken-voice paragraphs and rejects the old AI markers", () => {
    const [fundamentals, anger, reentry] = catalogDescriptionsForSlugs(CATALOG_DESCRIPTION_SLUGS);

    assert.equal(
      fundamentals.description,
      "A child does not need a speech about the father you meant to be. They need a man they can count on in ordinary hours. You may already be home every night. You may be catching up after time away. Either way, this course is a map you can use the same night you hear it, not a theory class.\n\nKen Canfield spent years sitting with fathers and watching what distinguished the men children could trust. Out of that work came the Seven Secrets: commitment, knowing this child, showing up the same way, protecting and providing, affirming, disciplining with love, and modeling integrity and faith. You begin with the overview and an honest baseline. Then you take the secrets one at a time. Involvement looks like a promise you actually keep. Awareness looks like learning this child's world instead of the one you remember. Consistency is a rhythm the house can trust. Nurturance is the encouragement and the correction that leave the relationship intact.\n\nEach session is a short teaching film, a checkpoint to make sure the idea landed, and one practice you can try that night. There is no scoreboard, and no room where fathers compare children."
    );
    assert.equal(
      fundamentals.leaderSummary,
      "Ken's Seven Secrets are the map, used at home the same night. Involvement is a kept promise. Awareness is this child as they are now. Consistency is showing up the same way. Nurturance is affirmation and loving correction. A good week is one practiced move after the film and a child who can count on the same man. If the secrets turn into a lecture, a comparison between children, or a scorecard, bring him back to one secret and one move."
    );
    assert.equal(
      anger.leaderSummary.startsWith("The work is noticing the surge"),
      true
    );
    assert.equal(reentry.leaderSummary.startsWith("The return is a season"), true);

    for (const training of catalogDescriptionsForSlugs(CATALOG_DESCRIPTION_SLUGS)) {
      assert.equal(training.leaderSummary.startsWith("Leader: "), false);
      assert.equal(training.description.includes(EM_DASH), false);
      assert.equal(training.description.includes(EN_DASH), false);
      assert.equal(training.leaderSummary.includes(EM_DASH), false);
      assert.equal(training.leaderSummary.includes(EN_DASH), false);
      assert.doesNotMatch(training.leaderSummary, /Not published/i);
      assert.doesNotMatch(training.leaderSummary, /Not released/i);
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
    }
  });

  it("keeps fundamentals on same-night practice and reentry on a season of return", () => {
    const fundamentals = catalogDescriptionsForSlugs(["fundamentals"])[0];
    const reentry = catalogDescriptionsForSlugs(["reentry"])[0];

    assert.match(fundamentals.description, /same night/i);
    assert.match(fundamentals.description, /Seven Secrets/);
    assert.equal(fundamentals.description.includes("What changes over twelve weeks"), false);
    assert.match(reentry.description, /Coming home present is a season/);
    assert.match(reentry.description, /Children borrow the nervous system they meet/);
  });
});
