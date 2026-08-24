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
      fundamentals.description.startsWith("A father does not become effective by collecting ideas."),
      true
    );
    assert.equal(
      anger.description.startsWith("The people nearest you feel your heat first."),
      true
    );
    assert.equal(
      reentry.description.startsWith(
        "A man can do his work away from home and still walk through the door carrying the body that kept him there."
      ),
      true
    );
    assert.equal(
      fundamentals.description,
      "A father does not become effective by collecting ideas. He becomes effective in the ordinary hours, when a child learns whether this man can be counted on. Ken Canfield sat with thousands of fathers and watched that question get answered in kitchens and doorways, not in lectures. The Seven Secrets of Effective Fathers came from those lives: commitment, knowing your child, consistency, protecting and providing, affirming love, loving discipline, and a living example of integrity and faith.\n\nThis course takes those secrets one at a time. You begin with an honest look at where you stand. Then you keep a promise you can actually keep, learn this child's world instead of the one you remember, show up in a way the house can trust, speak a specific word of encouragement, and correct without breaking the bond. That is involvement you can count, awareness of this child today, consistency the house can feel, and nurturance that leaves the relationship intact.\n\nNine sessions. A short teaching, a brief checkpoint, and one practice you can use the same night. No scoreboard, and no need to perform the work in public."
    );
    assert.equal(
      fundamentals.leaderSummary,
      "Walk him through one secret at a time, used at home the same night. Watch for a kept promise, a truer picture of this child, and a correction that leaves the relationship intact. If the secrets turn into a lecture or a comparison among children, bring him back to one practiced move."
    );
    assert.equal(anger.leaderSummary.startsWith("Help him notice the surge"), true);
    assert.equal(reentry.leaderSummary.startsWith("Stay with the body at the door"), true);

    for (const training of catalogDescriptionsForSlugs(CATALOG_DESCRIPTION_SLUGS)) {
      assert.equal(training.leaderSummary.startsWith("Leader: "), false);
      assert.equal(training.description.includes(EM_DASH), false);
      assert.equal(training.description.includes(EN_DASH), false);
      assert.equal(training.leaderSummary.includes(EM_DASH), false);
      assert.equal(training.leaderSummary.includes(EN_DASH), false);
      assert.doesNotMatch(training.leaderSummary, /Not published/i);
      assert.doesNotMatch(training.leaderSummary, /Not released/i);

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
    assert.match(reentry.description, /The child he meets may not be the child he left/);
  });
});
