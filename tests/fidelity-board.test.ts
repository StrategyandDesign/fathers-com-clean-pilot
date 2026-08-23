import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  FIDELITY_BOARD_ENABLED,
  FIDELITY_NOTE_MAX,
  SUPERVISION_CHECKLIST_ITEMS,
  SUPERVISION_TEMPLATE_SLUG,
  clipFidelityNote,
  fidelityProgress,
  itemsForSection,
} from "../lib/fidelity/checklist";
import {
  FACILITATOR_CREDENTIAL_STATUSES,
  clipEvidencePath,
  isFacilitatorCredentialStatus,
  parseEarnedAt,
  parseFacilitatorCredentialStatus,
} from "../lib/fidelity/credentials";
import {
  FACILITATOR_CREDENTIAL_HEADERS,
  FIDELITY_SUMMARY_HEADERS,
  QI_PACKET_FACILITATOR_HOOK,
  QI_PACKET_FIDELITY_HOOK,
  collectQiPacketSections,
  facilitatorCredentialCsv,
  fidelitySummaryCsv,
} from "../lib/fidelity/export";
import { FIDELITY_BOARD_ENABLED as FLAG_NAME, fidelityBoardEnabled } from "../lib/flags";
import { en } from "../lib/i18n/messages/en";
import { he } from "../lib/i18n/messages/he";

const EM_DASH = "—";

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

describe("fidelity_board_enabled flag", () => {
  it("defaults off so the prior desk stays up", () => {
    assert.equal(FIDELITY_BOARD_ENABLED, "fidelity_board_enabled");
    assert.equal(FLAG_NAME, "fidelity_board_enabled");
    assert.equal(fidelityBoardEnabled(), false);
    const flags = readRepo("lib/flags.ts");
    const env = readRepo(".env.example");
    const page = readRepo("app/(manager)/manager/page.tsx");
    const account = readRepo("components/layout/account-view.tsx");
    const nav = readRepo("components/layout/app-nav.tsx");
    const header = readRepo("components/layout/manager-header-menu.tsx");
    assert.match(flags, /fidelity_board_enabled/);
    assert.match(flags, /defaults OFF/);
    assert.match(flags, /FIDELITY_BOARD_ENABLED/);
    assert.match(env, /FIDELITY_BOARD_ENABLED=/);
    assert.match(env, /prior desk/);
    assert.match(page, /fidelityBoardEnabled/);
    assert.match(page, /fidelityEnabled \? <FidelityDeskCard/);
    assert.match(account, /fidelityBoardEnabled\(\) \? <TeamAccountLink/);
    assert.doesNotMatch(nav, /fidelity/);
    assert.doesNotMatch(header, /fidelity/);
    assert.match(readRepo("docs/engineering/PILOT.md"), /FIDELITY_BOARD_ENABLED=1/);
    assert.match(readRepo("docs/product/FACILITATOR-SUPPORT-MODEL.md"), /fidelity_board_enabled/);
  });

  it("keeps flag-off pages quiet and off the ribbon", () => {
    const list = readRepo("app/(manager)/manager/fidelity/page.tsx");
    const detail = readRepo("app/(manager)/manager/fidelity/[cohortOrTrainingId]/page.tsx");
    const registry = readRepo("app/(manager)/manager/team/facilitators/page.tsx");
    const participants = readRepo("app/(manager)/manager/participants/page.tsx");
    assert.match(list, /fidelityBoardEnabled\(\)/);
    assert.match(list, /flagOffTitle/);
    assert.match(detail, /flagOffTitle/);
    assert.match(registry, /flagOffTitle/);
    assert.doesNotMatch(participants, /fidelity/);
    assert.match(readRepo("components/fidelity/team-account-link.tsx"), /<details/);
    assert.doesNotMatch(readRepo("components/fidelity/team-account-link.tsx"), /<details[^>]*\sopen[\s>]/);
  });
});

describe("supervision checklist", () => {
  it("loads the partner-kit supervision items in board order", () => {
    const kit = readRepo("partner-kit/supervision-checklist.md");
    assert.equal(SUPERVISION_TEMPLATE_SLUG, "supervised-first-cohort");
    assert.equal(SUPERVISION_CHECKLIST_ITEMS.length, 13);
    assert.equal(itemsForSection(SUPERVISION_CHECKLIST_ITEMS, "session_one").length, 4);
    assert.equal(itemsForSection(SUPERVISION_CHECKLIST_ITEMS, "mid_cohort").length, 4);
    assert.equal(itemsForSection(SUPERVISION_CHECKLIST_ITEMS, "the_final").length, 3);
    assert.equal(itemsForSection(SUPERVISION_CHECKLIST_ITEMS, "credential").length, 2);
    const kitLower = kit.toLowerCase();
    for (const item of SUPERVISION_CHECKLIST_ITEMS) {
      const needle = item.prompt.split(";")[0].slice(0, 28).toLowerCase();
      assert.ok(kitLower.includes(needle), item.key);
      assert.equal(item.prompt.includes(EM_DASH), false);
    }
    assert.match(kit, /Every man greeted by name at the door/);
    assert.match(kit, /Practice time exceeded lecture time/);
    assert.match(kit, /Verification sheet produced/);
  });

  it("counts completed items and clips short notes", () => {
    const progress = fidelityProgress([
      { completedAt: "2026-08-23T12:00:00.000Z" },
      { completedAt: null },
      { completed_at: "2026-08-23T13:00:00.000Z" },
    ]);
    assert.deepEqual(progress, { completed: 2, total: 3, remaining: 1 });
    assert.equal(clipFidelityNote("  keep this  "), "keep this");
    assert.equal(clipFidelityNote("x".repeat(FIDELITY_NOTE_MAX + 20)).length, FIDELITY_NOTE_MAX);
    assert.equal(clipFidelityNote(null), "");
  });
});

describe("facilitator credentials", () => {
  it("accepts training, certified, and suspended only", () => {
    assert.deepEqual([...FACILITATOR_CREDENTIAL_STATUSES], ["training", "certified", "suspended"]);
    assert.equal(isFacilitatorCredentialStatus("certified"), true);
    assert.equal(isFacilitatorCredentialStatus("licensed"), false);
    assert.equal(parseFacilitatorCredentialStatus("suspended"), "suspended");
    assert.equal(parseFacilitatorCredentialStatus("exam"), null);
    assert.equal(parseEarnedAt("2026-08-23"), "2026-08-23");
    assert.equal(parseEarnedAt("08/23/2026"), null);
    assert.equal(clipEvidencePath("offline exam 2026-08").length > 0, true);
    assert.equal(clipEvidencePath("x".repeat(240)).length, 200);
  });
});

describe("Quality Improvement export hooks", () => {
  it("shapes a fidelity summary and facilitator list for a later packet", () => {
    const csv = fidelitySummaryCsv({
      groupId: "g1",
      groupName: "NWA",
      trainingId: "",
      trainingTitle: "",
      items: [
        {
          itemKey: "session_one.greet_by_name",
          section: "session_one",
          prompt: "Every man greeted by name at the door.",
          completedBy: "Brenda",
          completedAt: "2026-08-23T12:00:00.000Z",
          notes: "Door was on time.",
        },
      ],
    });
    assert.match(csv, new RegExp(QI_PACKET_FIDELITY_HOOK));
    assert.match(csv, /Whole cohort/);
    assert.match(csv, /yes/);
    assert.match(csv, /Door was on time/);
    for (const header of FIDELITY_SUMMARY_HEADERS) assert.match(csv, new RegExp(header));

    const registry = facilitatorCredentialCsv([
      {
        orgId: "g1",
        orgName: "NWA",
        userId: "u1",
        name: "Brenda",
        status: "certified",
        earnedAt: "2026-08-01",
        evidencePath: "offline exam",
        attestedBy: "Micah",
      },
    ]);
    assert.match(registry, new RegExp(QI_PACKET_FACILITATOR_HOOK));
    assert.match(registry, /certified/);
    for (const header of FACILITATOR_CREDENTIAL_HEADERS) assert.match(registry, new RegExp(header));

    const packet = collectQiPacketSections({
      boards: [],
      credentials: [],
    });
    assert.equal(packet.length, 2);
    assert.equal(packet[0].hook, QI_PACKET_FIDELITY_HOOK);
    assert.equal(packet[1].hook, QI_PACKET_FACILITATOR_HOOK);
  });
});

describe("fidelity copy hygiene", () => {
  it("expands Quality Improvement and keeps em dashes out", () => {
    const copy = en.fidelity;
    assert.match(copy.downloadSummary, /Quality Improvement/);
    assert.doesNotMatch(copy.downloadSummary, /\bQI\b/);
    assert.match(copy.lead, /Not a clinical chart/);
    assert.doesNotMatch(copy.lead, /clinical chart fields/);
    assert.match(copy.registryLead, /Attestation only/);
    assert.match(copy.exportHint, /A person still confirms/);
    assert.equal(copy.lead.includes(EM_DASH), false);
    assert.equal(copy.registryLead.includes(EM_DASH), false);
    assert.equal(he.fidelity.lead.includes(EM_DASH), false);
    assert.equal(copy.flagOffBody.includes(EM_DASH), false);
  });
});

describe("fidelity schema and auth", () => {
  it("creates the named tables with manager RLS and no father write", () => {
    const sql = readRepo("supabase/migrations/20260823080000_fidelity_board.sql");
    assert.match(sql, /create table if not exists public.fidelity_templates/);
    assert.match(sql, /create table if not exists public.fidelity_runs/);
    assert.match(sql, /create table if not exists public.fidelity_check_items/);
    assert.match(sql, /create table if not exists public.facilitator_credentials/);
    assert.match(sql, /completed_by/);
    assert.match(sql, /completed_at/);
    assert.match(sql, /char_length\(notes\) <= 280/);
    assert.match(sql, /facilitator_credential_status as enum \('training', 'certified', 'suspended'\)/);
    assert.match(sql, /enable row level security/);
    assert.match(sql, /force row level security/);
    assert.match(sql, /is_manager_of_group/);
    assert.match(sql, /is_reviewer_of_group/);
    assert.match(sql, /is_super_admin/);
    assert.doesNotMatch(sql, /is_member_of_group\(group_id\)[\s\S]*fidelity_check_items_write/);
    assert.match(sql, /revoke all on public.fidelity_runs from anon/);
    assert.match(sql, /supervised-first-cohort/);
    assert.match(sql, /Every man greeted by name at the door/);
    assert.match(sql, /Not a clinical chart/);
  });

  it("gates writes behind the flag and manager role", () => {
    const actions = readRepo("lib/fidelity/actions.ts");
    assert.match(actions, /requireRole\("manager"\)/);
    assert.match(actions, /fidelityBoardEnabled\(\)/);
    assert.match(actions, /isManagerOfGroup/);
    const exportRoute = readRepo("app/api/manager/fidelity/export/route.ts");
    assert.match(exportRoute, /fidelityBoardEnabled\(\)/);
    assert.match(exportRoute, /requireRole\("manager"\)/);
    const registryExport = readRepo("app/api/manager/facilitators/export/route.ts");
    assert.match(registryExport, /fidelityBoardEnabled\(\)/);
  });
});
