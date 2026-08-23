import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { findOverclaimHits } from "../lib/copy/overclaim-lexicon";
import {
  SHOW_MILITARY,
  VERTICAL_PACK_ARMED_FORCES,
  verticalPackArmedForces,
} from "../lib/flags";
import { en } from "../lib/i18n/messages/en";
import { he } from "../lib/i18n/messages/he";
import { recommendedFlagsForType } from "../lib/organization-type";
import { armedForcesPackArtifactBody } from "../lib/verticals/armed-forces/artifacts";
import {
  ARMED_FORCES_CHECKLIST_ITEMS,
  armedForcesChecklistProgress,
} from "../lib/verticals/armed-forces/checklist";
import {
  buildEventCloseout,
  eventCloseoutCsv,
  eventCloseoutPrintable,
  isCloseoutPreset,
} from "../lib/verticals/armed-forces/closeout";
import {
  comingHomePresentFraming,
  findCombatPaintHits,
  findRecruitingLexiconHits,
  militaryApprovalRecordRule,
  recruitingLexiconLead,
  sponsorshipSeatsRule,
} from "../lib/verticals/armed-forces/lexicon";
import {
  ARMED_FORCES_PACK_ARTIFACTS,
  ARMED_FORCES_PACK_SLUGS,
  isArmedForcesPackSlug,
} from "../lib/verticals/armed-forces/pack";
import type { ReportRow } from "../lib/manager/reports";

const EM_DASH = "—";

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

function sampleRow(overrides: Partial<ReportRow> = {}): ReportRow {
  return {
    fatherId: "f1",
    name: "Alex",
    groupId: "g1",
    groupName: "NWA",
    trainingId: "t1",
    trainingTitle: "Coming Home Present",
    completionStatus: "completed",
    sessionsCompleted: 8,
    sessionsTotal: 8,
    assignedAt: "2026-08-01T00:00:00.000Z",
    completedAt: "2026-08-20T00:00:00.000Z",
    certificateSerial: "FC-2026-000001",
    certificateIssuedAt: "2026-08-20T00:00:00.000Z",
    lastProgramActivity: "2026-08-20T00:00:00.000Z",
    practiceStatus: "",
    ...overrides,
  };
}

describe("vertical_pack_armed_forces flag", () => {
  it("defaults off so father and Leader surfaces stay as they are", () => {
    assert.equal(VERTICAL_PACK_ARMED_FORCES, "vertical_pack_armed_forces");
    assert.equal(verticalPackArmedForces(), false);
    assert.equal(SHOW_MILITARY, false);
    const flags = readRepo("lib/flags.ts");
    const env = readRepo(".env.example");
    const reports = readRepo("app/(manager)/manager/reports/page.tsx");
    const nav = readRepo("components/layout/app-nav.tsx");
    const header = readRepo("components/layout/manager-header-menu.tsx");
    assert.match(flags, /vertical_pack_armed_forces/);
    assert.match(flags, /defaults OFF/);
    assert.match(flags, /does not flip SHOW_MILITARY/);
    assert.match(env, /VERTICAL_PACK_ARMED_FORCES=/);
    assert.match(env, /Does not flip SHOW_MILITARY/);
    assert.match(reports, /verticalPackArmedForces\(\)/);
    assert.match(reports, /armedForcesPack \? \(/);
    assert.doesNotMatch(nav, /armed-forces|armedForces/);
    assert.doesNotMatch(header, /armed-forces|armedForces/);
    assert.match(readRepo("docs/engineering/PILOT.md"), /VERTICAL_PACK_ARMED_FORCES=1/);
    assert.match(readRepo("docs/product/FACILITATOR-SUPPORT-MODEL.md"), /vertical_pack_armed_forces/);
  });

  it("does not turn the env flag on from organization type", () => {
    assert.equal(recommendedFlagsForType("armed_forces_unit").verticalPackArmedForces, false);
    assert.equal(recommendedFlagsForType("rehab").verticalPackArmedForces, false);
  });

  it("keeps SHOW_MILITARY false in the archive generator", () => {
    const build = readRepo("archive/static-site/build_pages.py");
    assert.match(build, /SHOW_MILITARY = False/);
    assert.doesNotMatch(build, /SHOW_MILITARY = True/);
  });
});

describe("Armed Forces pack templates", () => {
  it("ships inventory, attestation, Title 10 note, and closeout printable", () => {
    assert.deepEqual([...ARMED_FORCES_PACK_SLUGS], [
      "content-inventory",
      "non-clinical-attestation",
      "title-10-usc-1789-note",
      "event-closeout-printable",
    ]);
    assert.equal(isArmedForcesPackSlug("content-inventory"), true);
    assert.equal(isArmedForcesPackSlug("baa-template"), false);
    for (const artifact of ARMED_FORCES_PACK_ARTIFACTS) {
      const body = armedForcesPackArtifactBody(artifact.slug);
      assert.match(body, /DRAFT FOR COUNSEL AND CHANNEL REVIEW/);
      assert.doesNotMatch(body, /clinical chart fields are stored/i);
      assert.equal(body.includes(EM_DASH), false);
      assert.equal(findOverclaimHits(body).length, 0);
    }
  });

  it("keeps Coming Home Present framing and forbids combat paint in the pack", () => {
    const inventory = armedForcesPackArtifactBody("content-inventory");
    assert.match(inventory, /Coming Home Present/);
    assert.match(inventory, /Treatment house/);
    assert.equal(findCombatPaintHits(inventory).length, 0);
    assert.match(comingHomePresentFraming(), /Coming Home Present/);
    assert.doesNotMatch(comingHomePresentFraming(), /combat/);
  });

  it("attests education and names Title 10 United States Code section 1789", () => {
    const attestation = armedForcesPackArtifactBody("non-clinical-attestation");
    const note = armedForcesPackArtifactBody("title-10-usc-1789-note");
    assert.match(attestation, /does not diagnose, screen, treat, or provide therapy/);
    assert.match(attestation, /not a clinical finding/);
    assert.match(note, /Title 10 United States Code section 1789/);
    assert.match(note, /Training materials/);
    assert.match(note, /not a claim that funds are available/i);
  });
});

describe("event closeout preset", () => {
  it("reuses Reports rows as attendance and completion aggregates only", () => {
    assert.equal(isCloseoutPreset("closeout"), true);
    assert.equal(isCloseoutPreset(""), false);
    const closeout = buildEventCloseout([sampleRow(), sampleRow({
      fatherId: "f2",
      name: "Jordan",
      completionStatus: "in_progress",
      sessionsCompleted: 2,
      sessionsTotal: 8,
      certificateSerial: "",
    })], {
      organization: "Chaplain cohort",
      generatedAt: "2026-08-23T12:00:00.000Z",
    });
    assert.equal(closeout.men, 2);
    assert.equal(closeout.completed, 1);
    assert.equal(closeout.inProgress, 1);
    assert.equal(closeout.sessionsCompleted, 10);
    assert.equal(closeout.certificatesIssued, 1);
    const csv = eventCloseoutCsv(closeout);
    const printable = eventCloseoutPrintable(closeout);
    assert.match(csv, /Attendance and completion aggregates only/);
    assert.match(csv, /Not counseling content/);
    assert.doesNotMatch(csv, /Alex|Jordan|counseling note/i);
    assert.match(printable, /Certificates issued: 1/);
    assert.doesNotMatch(printable, /Alex|Jordan/);
    assert.equal(csv.includes(EM_DASH), false);
  });

  it("hides the Reports buttons unless the flag is on", () => {
    const page = readRepo("app/(manager)/manager/reports/page.tsx");
    const route = readRepo("app/api/manager/reports/export/route.ts");
    assert.match(page, /armedForcesPack \? \(/);
    assert.match(page, /preset=closeout/);
    assert.match(route, /verticalPackArmedForces\(\)/);
    assert.match(route, /The event closeout preset is off/);
  });
});

describe("Admin Armed Forces checklist", () => {
  it("is Super-admin only, off the ribbon, and collapsed on Account", () => {
    const page = readRepo("app/(admin)/admin/verticals/armed-forces/page.tsx");
    const view = readRepo("components/verticals/armed-forces-checklist.tsx");
    const link = readRepo("components/verticals/armed-forces-link.tsx");
    const account = readRepo("components/layout/account-view.tsx");
    const nav = readRepo("components/layout/app-nav.tsx");
    assert.match(page, /requireRole\("admin"\)/);
    assert.match(page, /ArmedForcesChecklistView/);
    assert.match(account, /ArmedForcesAdminLink/);
    assert.match(link, /<details/);
    assert.doesNotMatch(link, /<details[^>]*\sopen[\s>]/);
    assert.doesNotMatch(nav, /verticals\/armed-forces/);
    assert.equal(ARMED_FORCES_CHECKLIST_ITEMS.length, 9);
    assert.deepEqual(armedForcesChecklistProgress().total, 9);
    assert.match(en.armedForces.comingHome, /Coming Home Present/);
    assert.equal(findCombatPaintHits(en.armedForces.comingHome + view).length, 0);
    assert.match(ARMED_FORCES_CHECKLIST_ITEMS.map((item) => item.body).join("\n"), /Coming Home Present/);
    for (const item of ARMED_FORCES_CHECKLIST_ITEMS) {
      assert.equal(item.title.includes(EM_DASH), false);
      assert.equal(item.body.includes(EM_DASH), false);
    }
  });

  it("expands acronyms in English UI and keeps em dashes out", () => {
    const copy = en.armedForces;
    assert.match(copy.downloadsLead, /Title 10 United States Code section 1789/);
    assert.doesNotMatch(copy.downloadsLead, /\bUSC\b/);
    assert.doesNotMatch(copy.lead, /\bMFLC\b/);
    assert.doesNotMatch(copy.lead, /\bBSRT\b/);
    assert.equal(copy.lead.includes(EM_DASH), false);
    assert.equal(copy.comingHome.includes(EM_DASH), false);
    assert.equal(he.armedForces.lead.includes(EM_DASH), false);
    assert.match(copy.comingHome, /Coming Home Present/);
    assert.doesNotMatch(copy.comingHome, /combat|barracks|battlefield/);
  });
});

describe("Armed Forces claims and sponsorship", () => {
  it("forbids false Military and Family Life Counseling or Building Strong and Ready Teams approval strings", () => {
    const hits = findOverclaimHits(
      "Approved for Military and Family Life Counseling. Building Strong and Ready Teams approved."
    );
    assert.ok(hits.some((hit) => hit.id === "mflc-approved"));
    assert.ok(hits.some((hit) => hit.id === "bsrt-approved"));
    assert.equal(findOverclaimHits(militaryApprovalRecordRule()).length, 0);
    const page = readRepo("components/verticals/armed-forces-checklist.tsx");
    const artifacts = ARMED_FORCES_PACK_SLUGS.map((slug) => armedForcesPackArtifactBody(slug)).join("\n");
    assert.equal(findOverclaimHits(page).length, 0);
    assert.equal(findOverclaimHits(artifacts).length, 0);
    assert.match(readRepo("docs/product/ARMED-FORCES-VERTICAL.md"), /written record exists/);
    assert.match(readRepo("docs/product/MILITARY-READINESS.md"), /SHOW_MILITARY stays False/);
  });

  it("keeps recruiting surfaces on training, readiness, and skills", () => {
    assert.match(recruitingLexiconLead(), /training, readiness, and skills/);
    const recruiting = "Join this therapy group for counseling and behavioral health.";
    const hits = findRecruitingLexiconHits(recruiting);
    assert.ok(hits.some((hit) => hit.id === "therapy"));
    assert.ok(hits.some((hit) => hit.id === "counseling"));
    assert.ok(hits.some((hit) => hit.id === "behavioral-health"));
    assert.match(sponsorshipSeatsRule(), /organization seats only/);
    assert.match(sponsorshipSeatsRule(), /no rank VIP tiers/);
    assert.doesNotMatch(readRepo("docs/product/ARMED-FORCES-VERTICAL.md"), /rank-VIP|colonel package/i);
  });
});
