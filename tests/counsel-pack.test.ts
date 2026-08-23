import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { counselPackArtifactBody } from "../lib/counsel/artifacts";
import {
  COUNSEL_PACK_ARTIFACTS,
  COUNSEL_PACK_REQUIRED,
  COUNSEL_PACK_SLUGS,
  REPORT_REDISCLOSURE_LINE,
  anyCounselPackRequired,
  counselPackChecklistVisible,
  counselPackLegalLabel,
  counselPackNeedsEmptyState,
  emptyCounselPackState,
  isCounselPackSlug,
  parseCounselPackRequired,
  reportRedisclosureEnabled,
  type CounselPackState,
} from "../lib/counsel/pack";
import { rowsToCsv } from "../lib/manager/reports";
import { recommendedFlagsForType } from "../lib/organization-type";

const EM_DASH = "—";

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

function state(overrides: Partial<CounselPackState> = {}): CounselPackState {
  return {
    ...emptyCounselPackState("group-1", "Morning cohort"),
    ...overrides,
  };
}

describe("counsel pack artifacts", () => {
  it("ships six draft slots and never labels a download executed", () => {
    assert.deepEqual(COUNSEL_PACK_SLUGS, [
      "baa-template",
      "education-memo-data-map",
      "part2-applicability-memo",
      "qsoa",
      "redisclosure-notice",
      "breach-contact-runbook",
    ]);
    assert.equal(COUNSEL_PACK_ARTIFACTS.length, 6);
    for (const artifact of COUNSEL_PACK_ARTIFACTS) {
      assert.equal(artifact.legalStatus, "draft");
      assert.equal(counselPackLegalLabel(artifact.legalStatus), "Draft");
      assert.match(artifact.title, /Business Associate|education-only|Title 42|Qualified Service|Redisclosure|Breach/i);
    }
    assert.equal(isCounselPackSlug("qsoa"), true);
    assert.equal(isCounselPackSlug("signed-baa"), false);
  });

  it("keeps every artifact a draft and does not claim covered-entity status", () => {
    for (const slug of COUNSEL_PACK_SLUGS) {
      const body = counselPackArtifactBody(slug);
      assert.match(body, /DRAFT FOR COUNSEL REVIEW/);
      assert.match(body, /not an executed agreement/i);
      assert.doesNotMatch(body, /we are a covered entity/i);
      assert.doesNotMatch(body, /this product is a covered entity/i);
      assert.equal(body.includes(EM_DASH), false);
      assert.doesNotMatch(body, /clinical chart fields are stored/i);
    }
  });

  it("reuses the partner-kit Qualified Service Organization Agreement draft", () => {
    const kit = readRepo("partner-kit/qsoa-template.md");
    const body = counselPackArtifactBody("qsoa");
    assert.match(kit, /Qualified Service Organization Agreement/);
    assert.match(kit, /DRAFT FOR COUNSEL REVIEW/);
    assert.match(body, /Qualified Service Organization Agreement/);
    assert.ok(body.includes("NCF provides fatherhood education"));
    assert.ok(body.includes("no Part 2 records cross to NCF"));
  });

  it("keeps the education memo off clinical chart fields", () => {
    const memo = counselPackArtifactBody("education-memo-data-map");
    assert.match(memo, /Data the platform is designed not to hold/);
    assert.match(memo, /Clinical chart fields/);
    assert.match(memo, /educational self-report/);
  });
});

describe("counsel_pack_required default OFF", () => {
  it("parses missing rows as off and hides the checklist", () => {
    assert.equal(COUNSEL_PACK_REQUIRED, "counsel_pack_required");
    assert.equal(parseCounselPackRequired(undefined), false);
    assert.equal(parseCounselPackRequired(false), false);
    assert.equal(parseCounselPackRequired(true), true);
    const off = state();
    assert.equal(counselPackChecklistVisible(off), false);
    assert.equal(counselPackNeedsEmptyState(off), false);
    assert.equal(anyCounselPackRequired([off]), false);
    assert.equal(reportRedisclosureEnabled([off]), false);
  });

  it("shows the empty-state checklist only while required and not attached", () => {
    const waiting = state({ required: true });
    const attached = state({ required: true, attachedAt: "2026-08-23T12:00:00.000Z" });
    assert.equal(counselPackNeedsEmptyState(waiting), true);
    assert.equal(counselPackNeedsEmptyState(attached), false);
    assert.equal(counselPackChecklistVisible(attached), true);
    assert.equal(reportRedisclosureEnabled([waiting]), true);
    assert.equal(reportRedisclosureEnabled([attached]), true);
  });

  it("does not turn the flag on from organization type", () => {
    assert.equal(recommendedFlagsForType("rehab").counselPackRequired, false);
    assert.equal(recommendedFlagsForType("other").counselPackRequired, false);
  });
});

describe("reports redisclosure footer", () => {
  it("omits the one-liner unless the pack is enabled", () => {
    const off = rowsToCsv([], "en", { redisclosure: false });
    const on = rowsToCsv([], "en", { redisclosure: true });
    assert.doesNotMatch(off, /Redisclosure notice/);
    assert.match(on, new RegExp(REPORT_REDISCLOSURE_LINE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.equal(REPORT_REDISCLOSURE_LINE.includes(EM_DASH), false);
    assert.match(REPORT_REDISCLOSURE_LINE, /Title 42 Code of Federal Regulations Part 2/);
  });
});

describe("counsel pack surface wiring", () => {
  it("keeps counsel under Account and off the Leader ribbon", () => {
    const nav = readRepo("components/layout/app-nav.tsx");
    const header = readRepo("components/layout/manager-header-menu.tsx");
    const account = readRepo("components/layout/account-view.tsx");
    const link = readRepo("components/counsel/counsel-account-link.tsx");
    const managerPage = readRepo("app/(manager)/manager/account/counsel/page.tsx");
    const adminPage = readRepo("app/(admin)/admin/account/counsel/page.tsx");
    const orgPage = readRepo("app/(admin)/admin/organizations/[id]/page.tsx");
    const accountLink = readRepo("components/counsel/counsel-account-link.tsx");

    assert.doesNotMatch(nav, /counsel/);
    assert.doesNotMatch(header, /counsel/);
    assert.match(account, /CounselAccountLink/);
    assert.match(link, /<details/);
    assert.doesNotMatch(link, /<details[^>]*\sopen[\s>]/);
    assert.match(accountLink, /\/manager\/account\/counsel/);
    assert.match(accountLink, /\/admin\/account\/counsel/);
    assert.match(managerPage, /loadManagerCounselPackStates/);
    assert.match(adminPage, /loadAdminCounselPackStates/);
    assert.match(orgPage, /CounselOrgCard/);
  });

  it("defaults the org table to required false and stores no signatures", () => {
    const migration = readRepo("supabase/migrations/20260823060000_counsel_pack.sql");
    assert.match(migration, /required boolean not null default false/);
    assert.match(migration, /attached_at timestamptz/);
    assert.match(migration, /Not signatures/);
    assert.doesNotMatch(migration, /signature_url|signed_at|signature_blob/);
  });

  it("never presents drafts as executed on the pack view", () => {
    const view = readRepo("components/counsel/counsel-pack-view.tsx");
    const org = readRepo("components/admin/counsel-org-card.tsx");
    assert.match(view, /counselPackLegalLabel/);
    assert.match(readRepo("lib/counsel/pack.ts"), /return status === "executed" \? "Executed" : "Draft"/);
    assert.match(org, /metadata only/);
    assert.match(org, /not a signature/i);
  });
});
