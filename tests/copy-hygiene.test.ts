import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { en } from "../lib/i18n/messages/en";
import { he } from "../lib/i18n/messages/he";

const EM_DASH = "—";
const ALLOWED = new Set(["common.emDash"]);

function walk(
  value: unknown,
  path: string,
  hits: string[]
) {
  if (typeof value === "string") {
    if (!ALLOWED.has(path) && value.includes(EM_DASH)) {
      hits.push(path);
    }
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    walk(child, path ? `${path}.${key}` : key, hits);
  }
}

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

describe("product copy hygiene", () => {
  it("keeps sentence em dashes out of English and Hebrew UI strings", () => {
    const hits: string[] = [];
    walk(en, "", hits);
    walk(he, "", hits);
    assert.deepEqual(hits, []);
  });

  it("states the flags-only default and optional answer unlock on privacy surfaces", () => {
    const sharing = en.legal.privacyPage.sharingOrg;
    const sharingHe = he.legal.privacyPage.sharingOrg;
    const terms = en.legal.termsPage.accountLead;
    const disclaimer = en.legal.disclaimer;
    const model = readRepo("docs/product/FACILITATOR-SUPPORT-MODEL.md");
    const consent = readRepo("docs/product/consent-returning-home.md");
    const positioning = readRepo("docs/product/POSITIONING.md");
    const partnerKit = readRepo("partner-kit/org-admin-quickstart.md");

    assert.match(sharing, /completion flags/i);
    assert.match(sharing, /By default/i);
    assert.match(sharing, /written answers/i);
    assert.match(sharing, /unless Super-admin turns that visibility on/i);
    assert.match(sharing, /Reviewers see cohort totals only/i);
    assert.doesNotMatch(sharing, /never see your (written )?answers/i);
    assert.equal(sharing.includes(EM_DASH), false);

    assert.match(sharingHe, /דגלי השלמת הערכות/);
    assert.match(sharingHe, /כברירת מחדל/);
    assert.match(sharingHe, /התשובות הכתובות/);
    assert.match(sharingHe, /אלא אם מנהל־על/);
    assert.match(sharingHe, /סוקרים רואים רק סיכומים/);
    assert.equal(sharingHe.includes(EM_DASH), false);

    assert.match(terms, /completion flags/);
    assert.doesNotMatch(terms, /progress and responses/);
    assert.match(disclaimer, /template for counsel review/);

    assert.match(model, /leader_assessment_answers/);
    assert.match(model, /written answers unless Super-admin/);
    assert.doesNotMatch(model, /never answers, scores, or practice log text/);

    assert.match(consent, /Draft for counsel review/);
    assert.match(consent, /unless Returning Home turns/);
    assert.doesNotMatch(consent, /staff do not see your individual answers\n?or your individual report unless you choose/);

    assert.match(positioning, /Leaders see\ncompletion flags/);
    assert.match(positioning, /Reviewers stay on cohort totals/);

    assert.match(partnerKit, /By default you see completion flags only/);
    assert.doesNotMatch(partnerKit, /never see an individual man's answers/);
  });
});
