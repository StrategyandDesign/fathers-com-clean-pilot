import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { findOverclaimHits } from "../lib/copy/overclaim-lexicon";
import { en } from "../lib/i18n/messages/en";
import { he } from "../lib/i18n/messages/he";
import {
  formatFindings,
  scanCitationShape,
  scanGovernedPaths,
} from "../tools/scan-overclaim";

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

  it("fails the phrase scan when a governed string claims a frozen phrase", () => {
    const hits = findOverclaimHits(
      "This curriculum is reunification-ready, clinically proven, Title IV-E eligible, Military and Family Life Counseling approved, and risk-reduction proven."
    );
    assert.ok(hits.some((hit) => hit.id === "reunification-ready"));
    assert.ok(hits.some((hit) => hit.id === "clinical-efficacy"));
    assert.ok(hits.some((hit) => hit.id === "title-iv-e-drawdown"));
    assert.ok(hits.some((hit) => hit.id === "mflc-approved"));
    assert.ok(hits.some((hit) => hit.id === "risk-reduction-proven"));
    const bsrt = findOverclaimHits(
      "This curriculum is approved for Building Strong and Ready Teams and BSRT approved."
    );
    assert.ok(bsrt.some((hit) => hit.id === "bsrt-approved"));
    assert.ok(hits.some((hit) => hit.id === "clearinghouse-mention"));
  });

  it("allows an honest denial of a clearinghouse rating", () => {
    const hits = findOverclaimHits(
      "Fathers.com is not a clearinghouse-rated prevention program."
    );
    assert.equal(
      hits.filter((hit) => hit.id === "clearinghouse-rated").length,
      0
    );
  });

  it("fails a false System and Organization Controls Type 2 or HITRUST claim", () => {
    const hits = findOverclaimHits(
      "Fathers.com is System and Organization Controls Type 2 certified and HITRUST certified."
    );
    assert.ok(hits.some((hit) => hit.id === "soc-type-2-certified"));
    assert.ok(hits.some((hit) => hit.id === "hitrust-certified"));
  });

  it("allows an honest denial of those certifications", () => {
    const hits = findOverclaimHits(
      "This product is not System and Organization Controls Type 2 certified. This product is not HITRUST Common Security Framework certified."
    );
    assert.equal(
      hits.filter((hit) => hit.id === "soc-type-2-certified" || hit.id === "hitrust-certified")
        .length,
      0
    );
  });

  it("keeps frozen overclaim phrases out of governed live and sales paths", () => {
    const findings = scanGovernedPaths();
    assert.deepEqual(formatFindings(findings), []);
  });

  it("treats Cioffi 2023 as a content-shape analog, never product efficacy", () => {
    const evidence = readRepo("docs/product/EVIDENCE-BAR.md");
    const brief = readRepo("partner-kit/funder-brief.md");
    assert.match(evidence, /Cioffi 2023/);
    assert.match(evidence, /content-shape analog/i);
    assert.match(evidence, /never this product's efficacy/i);
    assert.match(brief, /Cioffi 2023/);
    assert.match(brief, /content-shape analog/i);
    assert.match(brief, /never this product's\ntrial, efficacy evidence/i);
    assert.deepEqual(scanCitationShape(), []);
  });

  it("makes the funder brief the only clearinghouse-adjacent sales artifact", () => {
    const brief = readRepo("partner-kit/funder-brief.md");
    const onePager = readRepo("partner-kit/fundraising-one-pager.md");
    const fundingMap = readRepo("partner-kit/funding-map.md");
    const fundraising = readRepo("partner-kit/fundraising-brief.md");
    const readme = readRepo("partner-kit/README.md");

    assert.match(brief, /not a Title IV-E Prevention Services Clearinghouse-rated\nprevention program/i);
    assert.match(brief, /Sell completion and operations/i);
    assert.match(brief, /Family First Prevention Services Act/i);
    assert.match(brief, /Military and Family Life Counseling/i);
    assert.match(brief, /Building Strong and Ready Teams/i);
    assert.equal(brief.includes(EM_DASH), false);

    assert.doesNotMatch(onePager, /Title IV-E|Clearinghouse|FFPSA/i);
    assert.doesNotMatch(fundingMap, /Title IV-E|Clearinghouse|FFPSA/i);
    assert.doesNotMatch(fundraising, /Title IV-E|Clearinghouse|FFPSA|evidence-based/i);
    assert.match(onePager, /funder-brief\.md/);
    assert.match(fundingMap, /funder-brief\.md/);
    assert.match(readme, /funder-brief\.md/);
  });
});
