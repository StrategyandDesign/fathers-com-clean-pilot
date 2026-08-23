import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { findOverclaimHits } from "../lib/copy/overclaim-lexicon";
import { createTranslator } from "../lib/i18n/translate";
import { en } from "../lib/i18n/messages/en";
import {
  trustPackAnswersCsv,
  trustPackArtifactBody,
  trustPackEvidenceMarkdown,
  trustPackQuestionnaireMarkdown,
  trustPackScanPlaceholderMarkdown,
} from "../lib/trust/artifacts";
import { TRUST_PACK_ARTIFACTS, TRUST_PACK_SLUGS, isTrustPackSlug } from "../lib/trust/pack";
import {
  TRUST_CERTIFICATION_STATUS,
  TRUST_PACK_REVIEWED_ON,
  TRUST_PACK_VERSION,
  TRUST_PILOT_PASSWORD_STATUS,
  TRUST_QUESTIONNAIRE,
  TRUST_ROADMAP_STATUS,
  TRUST_SCAN_STATUS,
} from "../lib/trust/questionnaire";

const EM_DASH = "—";
const t = createTranslator("en");

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

describe("security questionnaire pack", () => {
  it("dates the pack and keeps certification honestly unfinished", () => {
    assert.equal(TRUST_PACK_VERSION, "1");
    assert.equal(TRUST_PACK_REVIEWED_ON, "2026-08-23");
    assert.match(TRUST_CERTIFICATION_STATUS, /not System and Organization Controls Type 2 certified/);
    assert.match(TRUST_CERTIFICATION_STATUS, /not HITRUST Common Security Framework certified/);
    assert.match(TRUST_CERTIFICATION_STATUS, /No such report is in this repository/);
    assert.match(TRUST_ROADMAP_STATUS, /has not started as of 23 August 2026/);
    assert.doesNotMatch(TRUST_CERTIFICATION_STATUS, /we are certified/i);
    assert.doesNotMatch(TRUST_ROADMAP_STATUS, /scheduled for|will complete|attestation letter/i);
    assert.equal(TRUST_CERTIFICATION_STATUS.includes(EM_DASH), false);
    assert.equal(TRUST_ROADMAP_STATUS.includes(EM_DASH), false);
  });

  it("scopes shared audit passwords out of production", () => {
    assert.match(TRUST_PILOT_PASSWORD_STATUS, /12345/);
    assert.match(TRUST_PILOT_PASSWORD_STATUS, /Pilot project only/);
    assert.match(TRUST_PILOT_PASSWORD_STATUS, /not a production control/);
    const runbook = readRepo("docs/engineering/PILOT.md");
    const launch = readRepo("docs/engineering/production-launch.md");
    assert.match(runbook, /not a production password policy/);
    assert.match(runbook, /Do not copy these seats or this password/);
    assert.match(launch, /shared audit password `12345`/);
    assert.match(launch, /not a production control/);
  });

  it("ships printable markdown and spreadsheet-friendly answers from one source", () => {
    assert.deepEqual(TRUST_PACK_SLUGS, [
      "questionnaire",
      "answers",
      "evidence",
      "scan-placeholder",
    ]);
    assert.equal(TRUST_PACK_ARTIFACTS.length, 4);
    assert.equal(isTrustPackSlug("questionnaire"), true);
    assert.equal(isTrustPackSlug("baa-template"), false);
    assert.equal(TRUST_QUESTIONNAIRE.length >= 10, true);
    const sections = TRUST_QUESTIONNAIRE.map((row) => row.section);
    for (const needed of [
      "Authentication",
      "Authorization",
      "Encryption",
      "Logging",
      "Subprocessors",
      "Data retention",
      "Breach contact",
      "Single sign-on",
      "Business Associate Agreement",
      "Certification",
    ]) {
      assert.ok(sections.includes(needed), needed);
    }
    assert.equal(trustPackArtifactBody("questionnaire"), trustPackQuestionnaireMarkdown());
    assert.equal(trustPackArtifactBody("answers"), trustPackAnswersCsv());
    assert.match(trustPackAnswersCsv(), /^id,section,question,answer,evidence\n/);
    assert.equal(readRepo("docs/engineering/trust-pack/SECURITY-QUESTIONNAIRE.md"), trustPackQuestionnaireMarkdown());
    assert.equal(readRepo("docs/engineering/trust-pack/answers.csv"), trustPackAnswersCsv());
    assert.equal(readRepo("docs/engineering/trust-pack/EVIDENCE.md"), trustPackEvidenceMarkdown());
    assert.equal(
      readRepo("docs/engineering/trust-pack/scans/last-scan-summary.md"),
      trustPackScanPlaceholderMarkdown()
    );
  });

  it("points at the Issue 1 data map and does not invent a scan", () => {
    const evidence = trustPackEvidenceMarkdown();
    const scan = trustPackScanPlaceholderMarkdown();
    assert.match(evidence, /education-only memo and data map/);
    assert.match(evidence, /QUALITY-IMPROVEMENT-FIELDS/);
    assert.match(evidence, /does not invent clinical chart fields/);
    assert.match(scan, /Status: none on file/);
    assert.match(TRUST_SCAN_STATUS, /No vulnerability-scan or penetration-test summary is on file/);
    assert.doesNotMatch(scan, /CVSS|critical finding|0 findings|passed on/i);
    assert.doesNotMatch(evidence, /clinical chart fields are stored/i);
    assert.equal(scan.includes(EM_DASH), false);
  });

  it("keeps every pack file off false certification and em dashes", () => {
    for (const slug of TRUST_PACK_SLUGS) {
      const body = trustPackArtifactBody(slug);
      assert.equal(body.includes(EM_DASH), false);
      assert.doesNotMatch(body, /\bSOC 2 certified\b/i);
      assert.doesNotMatch(body, /HITRUST certified/i);
      assert.doesNotMatch(body, /penetration test (passed|clean)/i);
      assert.doesNotMatch(body, /production password is 12345/i);
      const hits = findOverclaimHits(body);
      assert.deepEqual(
        hits.filter((hit) => hit.id === "soc-type-2-certified" || hit.id === "hitrust-certified"),
        []
      );
    }
  });
});

describe("Super-admin trust route", () => {
  it("adds a quiet /admin/trust page and Account link without a ribbon item", () => {
    const page = readRepo("app/(admin)/admin/trust/page.tsx");
    const view = readRepo("components/trust/trust-pack-view.tsx");
    const link = readRepo("components/trust/admin-trust-link.tsx");
    const account = readRepo("components/layout/account-view.tsx");
    const nav = readRepo("components/layout/app-nav.tsx");
    const header = readRepo("components/layout/manager-header-menu.tsx");
    const fatherAccount = readRepo("app/(father)/father/account/page.tsx");
    const api = readRepo("app/api/trust/pack/[slug]/route.ts");
    const dashboard = readRepo("app/(admin)/admin/page.tsx");

    assert.match(page, /requireRole\("admin"\)/);
    assert.match(page, /TrustPackView/);
    assert.match(view, /TRUST_PACK_VERSION/);
    assert.match(view, /TRUST_PACK_REVIEWED_ON/);
    assert.match(view, /System and Organization Controls Type 2/);
    assert.match(view, /HITRUST Common Security Framework/);
    assert.doesNotMatch(view, /\bSOC\b|\bBAA\b|\bSSO\b/);
    assert.match(link, /\/admin\/trust/);
    assert.match(account, /AdminTrustLink/);
    assert.match(account, /role === "admin" \? <AdminTrustLink/);
    assert.match(api, /role !== "admin"/);
    assert.match(api, /trust\.pack_download/);
    assert.doesNotMatch(nav, /\/admin\/trust/);
    assert.doesNotMatch(header, /\/admin\/trust/);
    assert.doesNotMatch(fatherAccount, /AdminTrustLink|\/admin\/trust|TrustPackView/);
    assert.doesNotMatch(dashboard, /\/admin\/trust/);
  });

  it("expands acronyms on the Super-admin pack copy", () => {
    assert.equal(t("trust.packTitle"), "Security questionnaire");
    assert.match(t("trust.packLead"), /hospital information-technology/);
    assert.doesNotMatch(t("trust.packTitle"), /\bSSO\b|\bBAA\b|\bSOC\b/);
    assert.doesNotMatch(en.trust.packLead, EM_DASH);
    assert.equal(en.trust.packInternalNote.includes(EM_DASH), false);
  });
});
