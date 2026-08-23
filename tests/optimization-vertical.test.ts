import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { findOverclaimHits } from "../lib/copy/overclaim-lexicon";
import {
  VERTICAL_PACK_OPTIMIZATION,
  verticalPackOptimization,
} from "../lib/flags";
import { en } from "../lib/i18n/messages/en";
import { he } from "../lib/i18n/messages/he";
import { recommendedFlagsForType } from "../lib/organization-type";
import { rowsToCsv, type ReportRow } from "../lib/manager/reports";
import { QI_PACKET_README } from "../lib/qi/packet";
import { optimizationPackAppliesToOrg } from "../lib/verticals/optimization/apply";
import { optimizationPackArtifactBody } from "../lib/verticals/optimization/artifacts";
import {
  OPTIMIZATION_CHECKLIST_ITEMS,
  optimizationChecklistProgress,
} from "../lib/verticals/optimization/checklist";
import {
  buildCommitmentBoard,
  commitmentBoardHasGrades,
  firstDisplayName,
} from "../lib/verticals/optimization/commitment";
import {
  DEFAULT_PARTICIPATION_EXPECTED_HINT,
  OPTIMIZATION_PARTICIPATION_EXPECTED_HINT,
  fatherChromeOmitsRehabLabel,
  participationExpectedHint,
  stripRehabParticipationLabel,
} from "../lib/verticals/optimization/copy";
import {
  exportAllowsAnswerDump,
  exportIncludesAnswerDump,
  exportIncludesLeaderNotes,
  leaderNotesExportAllowed,
} from "../lib/verticals/optimization/export";
import {
  inviteCodeIsPublic,
  joinPostureForOrg,
  signupRequiresInviteCode,
} from "../lib/verticals/optimization/join";
import {
  findOptimizationFatherCopyHits,
  hideRehabLabelRule,
  noAnswerDumpRule,
  publicGoToMarketRule,
  sponsorshipCapacityRule,
} from "../lib/verticals/optimization/lexicon";
import {
  OPTIMIZATION_PACK_ARTIFACTS,
  OPTIMIZATION_PACK_SLUGS,
  isOptimizationPackSlug,
} from "../lib/verticals/optimization/pack";

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
    trainingTitle: "Fathering Fundamentals",
    completionStatus: "completed",
    sessionsCompleted: 8,
    sessionsTotal: 8,
    assignedAt: "2026-08-01T00:00:00.000Z",
    completedAt: "2026-08-20T00:00:00.000Z",
    certificateSerial: "FC-2026-000001",
    certificateIssuedAt: "2026-08-20T00:00:00.000Z",
    lastProgramActivity: "2026-08-20T00:00:00.000Z",
    practiceStatus: "completed",
    ...overrides,
  };
}

describe("vertical_pack_optimization flag", () => {
  it("defaults off so the rehab pilot stays as it is", () => {
    assert.equal(VERTICAL_PACK_OPTIMIZATION, "vertical_pack_optimization");
    assert.equal(verticalPackOptimization(), false);
    assert.equal(optimizationPackAppliesToOrg("rehab"), false);
    assert.equal(optimizationPackAppliesToOrg("performance_optimization_group"), false);
    const flags = readRepo("lib/flags.ts");
    const env = readRepo(".env.example");
    const father = readRepo("app/(father)/father/page.tsx");
    const manager = readRepo("app/(manager)/manager/page.tsx");
    const nav = readRepo("components/layout/app-nav.tsx");
    const header = readRepo("components/layout/manager-header-menu.tsx");
    assert.match(flags, /vertical_pack_optimization/);
    assert.match(flags, /defaults OFF/);
    assert.match(flags, /Rehab organizations\s+never receive this pack/);
    assert.match(env, /VERTICAL_PACK_OPTIMIZATION=/);
    assert.match(env, /Rehab\n# organizations never receive this pack/);
    assert.match(father, /optimizationPackAppliesToOrg/);
    assert.match(manager, /optimizationPackAppliesToOrg/);
    assert.doesNotMatch(nav, /optimization|bonded-group/);
    assert.doesNotMatch(header, /optimization|bonded-group/);
    assert.match(readRepo("docs/engineering/PILOT.md"), /VERTICAL_PACK_OPTIMIZATION=1/);
    assert.match(readRepo("docs/product/FACILITATOR-SUPPORT-MODEL.md"), /vertical_pack_optimization/);
  });

  it("does not turn the env flag on from organization type, including Rehab", () => {
    assert.equal(recommendedFlagsForType("rehab").verticalPackOptimization, false);
    assert.equal(recommendedFlagsForType("performance_optimization_group").verticalPackOptimization, false);
    assert.equal(recommendedFlagsForType("armed_forces_unit").verticalPackOptimization, false);
    assert.equal(recommendedFlagsForType("other").verticalPackOptimization, false);
  });

  it("keeps default participation copy naming Rehab when the flag is off", () => {
    assert.equal(participationExpectedHint("rehab"), DEFAULT_PARTICIPATION_EXPECTED_HINT);
    assert.match(DEFAULT_PARTICIPATION_EXPECTED_HINT, /Rehab/);
    assert.match(en.manager.dashboard.participationExpectedHint, /Rehab, Armed Forces Unit/);
    assert.equal(fatherChromeOmitsRehabLabel("rehab", en.optimization.fatherChrome), false);
    const fatherPage = readRepo("app/(father)/father/page.tsx");
    assert.match(fatherPage, /optimizationPack \? \(/);
    assert.match(fatherPage, /optimization\.fatherChrome/);
  });
});

describe("optimization pack templates", () => {
  it("ships confidentiality, non-clinical copy, moderator review, and deferral", () => {
    assert.deepEqual([...OPTIMIZATION_PACK_SLUGS], [
      "confidentiality-defaults",
      "non-clinical-copy",
      "forum-moderator-review",
      "sponsorship-and-deferral",
    ]);
    assert.equal(isOptimizationPackSlug("forum-moderator-review"), true);
    assert.equal(isOptimizationPackSlug("event-closeout-printable"), false);
    for (const artifact of OPTIMIZATION_PACK_ARTIFACTS) {
      const body = optimizationPackArtifactBody(artifact.slug);
      assert.match(body, /DRAFT FOR COUNSEL AND FORUM-MODERATOR REVIEW/);
      assert.doesNotMatch(body, /clinical chart fields are stored/i);
      assert.equal(body.includes(EM_DASH), false);
      assert.equal(findOverclaimHits(body).length, 0);
    }
  });

  it("keeps answers and Leader notes off pack defaults", () => {
    const defaults = optimizationPackArtifactBody("confidentiality-defaults");
    const review = optimizationPackArtifactBody("forum-moderator-review");
    assert.match(defaults, /invitation-only/i);
    assert.match(defaults, /Leader notes/);
    assert.match(review, /no answer dump/i);
    assert.equal(leaderNotesExportAllowed(), false);
    assert.equal(exportAllowsAnswerDump(), false);
    assert.match(noAnswerDumpRule(), /written answers off Leader desks/);
  });
});

describe("commitment board", () => {
  it("reuses practice completion flags and refuses grades", () => {
    const rows = buildCommitmentBoard([
      { fatherId: "f1", name: "Alex Rivera", practiceLight: "completed" },
      { fatherId: "f2", name: "Jordan Lee", practiceLight: "not_yet" },
      { fatherId: "f3", name: "Sam", practiceLight: null },
    ]);
    assert.equal(firstDisplayName("Alex Rivera", "f1"), "Alex");
    assert.equal(rows.find((row) => row.fatherId === "f1")?.flag, "completed");
    assert.equal(rows.find((row) => row.fatherId === "f2")?.flag, "not_yet");
    assert.equal(rows.find((row) => row.fatherId === "f3")?.flag, "none");
    assert.equal(commitmentBoardHasGrades(rows), false);
    assert.doesNotMatch(en.optimization.boardLead, /grade/i);
    assert.doesNotMatch(en.optimization.boardFatherLead, /score|percent/i);
  });
});

describe("moderator controls and exports", () => {
  it("documents invitation-only join and keeps signup on an invite code", () => {
    assert.equal(signupRequiresInviteCode(), true);
    assert.equal(joinPostureForOrg("rehab"), "invite_code");
    assert.equal(inviteCodeIsPublic("rehab"), true);
    const signup = readRepo("app/(auth)/signup/page.tsx");
    assert.match(signup, /invite_code/);
    assert.match(signup, /required/);
    const partner = readRepo("partner-kit/forum-moderator-review.md");
    assert.match(partner, /invitation-only/);
    assert.match(readRepo("app/(manager)/manager/page.tsx"), /optimization\.inviteLead/);
  });

  it("keeps Leader notes and written answers out of default exports", () => {
    const csv = rowsToCsv([sampleRow()]);
    assert.equal(exportIncludesLeaderNotes(csv), false);
    assert.doesNotMatch(csv, /organization_cohort_notes|Leader note/i);
    assert.match(csv, /Flag only\. No answer text/);
    assert.equal(exportIncludesAnswerDump(QI_PACKET_README), false);
    assert.match(QI_PACKET_README, /does not include[\s\S]*answer text/);
  });
});

describe("Admin bonded-group checklist", () => {
  it("is Super-admin only, off the ribbon, and collapsed on Account", () => {
    const page = readRepo("app/(admin)/admin/verticals/optimization/page.tsx");
    const view = readRepo("components/verticals/optimization-checklist.tsx");
    const link = readRepo("components/verticals/optimization-link.tsx");
    const account = readRepo("components/layout/account-view.tsx");
    const nav = readRepo("components/layout/app-nav.tsx");
    assert.match(page, /requireRole\("admin"\)/);
    assert.match(page, /OptimizationChecklistView/);
    assert.match(account, /OptimizationAdminLink/);
    assert.match(link, /<details/);
    assert.doesNotMatch(link, /<details[^>]*\sopen[\s>]/);
    assert.doesNotMatch(nav, /verticals\/optimization/);
    assert.equal(OPTIMIZATION_CHECKLIST_ITEMS.length, 9);
    assert.deepEqual(optimizationChecklistProgress().total, 9);
    assert.match(en.optimization.lead, /chief executive officer forum/);
    assert.doesNotMatch(en.optimization.lead, /\bCEO\b/);
    assert.doesNotMatch(en.optimization.deferral, /\bGTM\b/);
    for (const item of OPTIMIZATION_CHECKLIST_ITEMS) {
      assert.equal(item.title.includes(EM_DASH), false);
      assert.equal(item.body.includes(EM_DASH), false);
    }
    assert.equal(view.includes(EM_DASH), false);
  });

  it("expands acronyms in English UI and keeps em dashes out", () => {
    const copy = en.optimization;
    assert.match(copy.lead, /chief executive officer/);
    assert.match(copy.deferral, /go-to-market/);
    assert.doesNotMatch(copy.lead, /\bCEO\b/);
    assert.doesNotMatch(copy.deferral, /\bGTM\b/);
    assert.doesNotMatch(copy.inviteLead, /\bVIP\b/);
    assert.equal(copy.lead.includes(EM_DASH), false);
    assert.equal(copy.fatherChrome.includes(EM_DASH), false);
    assert.equal(he.optimization.lead.includes(EM_DASH), false);
    assert.doesNotMatch(copy.fatherChrome, /Rehab/);
    assert.equal(findOptimizationFatherCopyHits(copy.fatherChrome).length, 0);
  });
});

describe("optimization claims, sponsorship, and deferral", () => {
  it("keeps public go-to-market deferred until checklist sign-off", () => {
    assert.match(publicGoToMarketRule(), /forum-moderator review checklist is signed off/);
    const partner = readRepo("partner-kit/forum-moderator-review.md");
    const product = readRepo("docs/product/OPTIMIZATION-VERTICAL.md");
    assert.match(partner, /Confidentiality defaults/);
    assert.match(partner, /Non-clinical copy/);
    assert.match(partner, /No answer dump/);
    assert.match(partner, /Public go-to-market stays deferred/);
    assert.match(product, /no public go-to-market/);
    assert.equal(partner.includes(EM_DASH), false);
    assert.equal(product.includes(EM_DASH), false);
    assert.equal(findOverclaimHits(partner).length, 0);
    assert.equal(findOverclaimHits(product).length, 0);
  });

  it("funds facilitator capacity and forbids paid participant tiers", () => {
    assert.match(sponsorshipCapacityRule(), /organization funds facilitator capacity/);
    assert.match(sponsorshipCapacityRule(), /no paid participant tiers/);
    assert.doesNotMatch(readRepo("docs/product/OPTIMIZATION-VERTICAL.md"), /VIP package|colonel package/i);
    assert.match(hideRehabLabelRule(), /omits the Rehab participation label/);
    assert.doesNotMatch(
      stripRehabParticipationLabel(DEFAULT_PARTICIPATION_EXPECTED_HINT),
      /Rehab/
    );
    assert.doesNotMatch(OPTIMIZATION_PARTICIPATION_EXPECTED_HINT, /Rehab/);
  });
});
