import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  COMPLETION_FEED_SCHEMA,
  buildCompletionFeedDocument,
  completionFeedItemsFromReport,
} from "../lib/export/feed";
import {
  EXPORT_DESTINATION_KINDS,
  isExportDestinationKind,
} from "../lib/export/kinds";
import {
  EXTERNAL_TRANSMIT_DISABLED,
  PUSH_INTENT_RECORDED,
  PUSH_NOT_CONFIGURED,
  PUSH_NOT_ENABLED,
  recordLocalPushIntent,
  refuseExternalPush,
} from "../lib/export/push";
import { hashExportToken, mintExportFeedToken } from "../lib/export/token";
import {
  QI_PACKET_FACILITATOR_HOOK,
  QI_PACKET_FIDELITY_HOOK,
  collectQiPacketSections,
} from "../lib/fidelity/export";
import {
  SECURE_EXPORT_ENABLED,
  secureExportEnabled,
} from "../lib/flags";
import { en } from "../lib/i18n/messages/en";
import { he } from "../lib/i18n/messages/he";
import type { ReportRow } from "../lib/manager/reports";
import {
  QI_EXCLUSIONS,
  QI_SCOPE_LINE,
  assertDictionaryCoversExportHeaders,
  renderQiDictionaryMarkdown,
} from "../lib/qi/dictionary";
import { QI_PACKET_README, buildQiPacketEntries, buildQiPacketZip } from "../lib/qi/packet";
import { certificateSerialCsv, certificateSerialRows } from "../lib/qi/serials";
import { buildZip, qiPacketFilename } from "../lib/qi/zip";

const EM_DASH = "—";

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

function reportRow(overrides: Partial<ReportRow> = {}): ReportRow {
  return {
    fatherId: "father-1",
    name: "James",
    groupId: "group-1",
    groupName: "Morning cohort",
    trainingId: "fundamentals",
    trainingTitle: "Fathering Fundamentals",
    completionStatus: "completed",
    sessionsCompleted: 2,
    sessionsTotal: 2,
    assignedAt: "2026-02-01T00:00:00.000Z",
    completedAt: "2026-03-20T00:00:00.000Z",
    certificateSerial: "FC-100",
    certificateIssuedAt: "2026-03-21T00:00:00.000Z",
    lastProgramActivity: "2026-03-21T00:00:00.000Z",
    practiceStatus: "",
    ...overrides,
  };
}

function emptyFilters() {
  return { groupId: null, trainingId: null, status: null, from: null, to: null };
}

describe("secure_export_enabled flag", () => {
  it("defaults off so prior reports stay as they are", () => {
    assert.equal(SECURE_EXPORT_ENABLED, "secure_export_enabled");
    assert.equal(secureExportEnabled(), false);
    const flags = readRepo("lib/flags.ts");
    const env = readRepo(".env.example");
    const reports = readRepo("app/(manager)/manager/reports/page.tsx");
    const admin = readRepo("app/(admin)/admin/organizations/[id]/page.tsx");
    const nav = readRepo("components/layout/app-nav.tsx");
    const header = readRepo("components/layout/manager-header-menu.tsx");
    assert.match(flags, /secure_export_enabled/);
    assert.match(flags, /defaults OFF/);
    assert.match(flags, /SECURE_EXPORT_ENABLED/);
    assert.match(env, /SECURE_EXPORT_ENABLED=/);
    assert.match(env, /prior reports stay as they are/);
    assert.match(reports, /secureExportEnabled\(\)/);
    assert.match(reports, /exportEnabled \? \(/);
    assert.match(admin, /secureExportEnabled\(\)/);
    assert.match(admin, /exportEnabled \? \(/);
    assert.doesNotMatch(nav, /secureExport|qi-packet|quality improvement/);
    assert.doesNotMatch(header, /secureExport|qi-packet/);
    assert.match(readRepo("docs/engineering/PILOT.md"), /SECURE_EXPORT_ENABLED=1/);
    assert.match(readRepo("docs/product/FACILITATOR-SUPPORT-MODEL.md"), /secure_export_enabled/);
  });

  it("keeps CSV and PDF export links when the flag is off", () => {
    const reports = readRepo("app/(manager)/manager/reports/page.tsx");
    assert.match(reports, /format=csv/);
    assert.match(reports, /format=pdf/);
    assert.match(reports, /qi-packet/);
    assert.match(reports, /manager.reports.csv/);
    assert.match(reports, /manager.reports.pdf/);
    const exportRoute = readRepo("app/api/manager/reports/export/route.ts");
    assert.match(exportRoute, /format !== "csv" && format !== "pdf"/);
    assert.doesNotMatch(exportRoute, /secureExportEnabled/);
  });
});

describe("quality improvement field dictionary", () => {
  it("covers packet columns and states the non-clinical scope", () => {
    const coverage = assertDictionaryCoversExportHeaders();
    assert.deepEqual(coverage, {
      completion: true,
      fidelity: true,
      facilitator: true,
      serials: true,
    });
    const markdown = renderQiDictionaryMarkdown();
    assert.match(markdown, /does not include clinical outcomes/i);
    for (const exclusion of QI_EXCLUSIONS) {
      assert.match(markdown, new RegExp(exclusion, "i"));
    }
    assert.equal(markdown.includes(EM_DASH), false);
    assert.equal(QI_SCOPE_LINE.includes(EM_DASH), false);

    const product = readRepo("docs/product/QUALITY-IMPROVEMENT-FIELDS.md");
    const kit = readRepo("partner-kit/quality-improvement-fields.md");
    for (const text of [product, kit]) {
      assert.match(text, /does not include clinical outcomes/i);
      assert.match(text, /diagnosis codes/i);
      assert.match(text, /medication data/i);
      assert.match(text, /court packets/i);
      assert.match(text, /clinical chart fields/i);
      assert.match(text, /answer text/i);
      assert.match(text, /Certificate serial/);
      assert.match(text, /fidelity_summary/);
      assert.match(text, /facilitator_credentials/);
      assert.equal(text.includes(EM_DASH), false);
    }
  });
});

describe("quality improvement packet", () => {
  it("zips completion, fidelity, facilitator, serials, and the dictionary", () => {
    const entries = buildQiPacketEntries({
      rows: [reportRow()],
      organization: "Morning cohort",
      filters: emptyFilters(),
      trainings: [],
      groups: [{ id: "group-1", name: "Morning cohort" }],
      locale: "en",
      generatedAt: "2026-08-23T12:00:00.000Z",
      boards: [
        {
          groupId: "group-1",
          groupName: "Morning cohort",
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
        },
      ],
      credentials: [
        {
          orgId: "group-1",
          orgName: "Morning cohort",
          userId: "u1",
          name: "Brenda",
          status: "certified",
          earnedAt: "2026-08-01",
          evidencePath: "offline exam",
          attestedBy: "Micah",
        },
      ],
    });
    const names = entries.map((entry) => entry.name);
    assert.deepEqual(names, [
      "README.txt",
      "field-dictionary.md",
      "completion.csv",
      "fidelity-summary.csv",
      "facilitator-credentials.csv",
      "certificate-serials.csv",
    ]);
    const completion = String(entries.find((entry) => entry.name === "completion.csv")?.contents);
    assert.match(completion, /FC-100/);
    assert.match(completion, /Flag only. No answer text/);
    assert.doesNotMatch(completion, /checkin_answers|action_note|session_note/);
    const fidelity = String(entries.find((entry) => entry.name === "fidelity-summary.csv")?.contents);
    assert.match(fidelity, new RegExp(QI_PACKET_FIDELITY_HOOK));
    const facilitators = String(
      entries.find((entry) => entry.name === "facilitator-credentials.csv")?.contents
    );
    assert.match(facilitators, new RegExp(QI_PACKET_FACILITATOR_HOOK));
    const serials = String(entries.find((entry) => entry.name === "certificate-serials.csv")?.contents);
    assert.match(serials, /certificate_serial/);
    assert.match(serials, /FC-100/);
    assert.match(QI_PACKET_README, /does not include clinical outcomes/i);
    assert.match(QI_PACKET_README, /answer text/i);

    const hooks = collectQiPacketSections({
      boards: [],
      credentials: [],
    }).map((section) => section.hook);
    assert.deepEqual(hooks, [QI_PACKET_FIDELITY_HOOK, QI_PACKET_FACILITATOR_HOOK]);

    const zip = buildQiPacketZip({
      rows: [reportRow()],
      organization: "Morning cohort",
      filters: emptyFilters(),
      trainings: [],
      groups: [{ id: "group-1", name: "Morning cohort" }],
      locale: "en",
      generatedAt: "2026-08-23T12:00:00.000Z",
      boards: [],
      credentials: [],
    });
    assert.equal(zip.subarray(0, 2).toString("utf8"), "PK");
    assert.match(qiPacketFilename(new Date("2026-08-23T12:00:00.000Z")), /2026-08-23\.zip/);
    const roundTrip = buildZip([{ name: "hello.txt", contents: "hello" }]);
    assert.ok(roundTrip.length > 30);
  });

  it("lists issued serials without answer text", () => {
    const rows = certificateSerialRows(
      [
        reportRow(),
        reportRow({
          fatherId: "father-2",
          name: "Marcus",
          certificateSerial: "",
          certificateIssuedAt: null,
        }),
      ],
      "Morning cohort"
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.certificate_serial, "FC-100");
    const csv = certificateSerialCsv(rows);
    assert.match(csv, /certificate_serial,issued_at,participant_id/);
    assert.doesNotMatch(csv, /answer/);
  });
});

describe("secure export send stub", () => {
  it("records local intent and never enables a live push", () => {
    assert.equal(EXTERNAL_TRANSMIT_DISABLED, true);
    assert.deepEqual(refuseExternalPush("not_enabled"), {
      ok: false,
      eventKind: "not_enabled",
      packetKind: "qi_packet",
      message: PUSH_NOT_ENABLED,
    });
    assert.match(refuseExternalPush("not_configured").message, /No destination is configured/);
    assert.equal(recordLocalPushIntent().message, PUSH_INTENT_RECORDED);
    assert.match(PUSH_NOT_CONFIGURED, /Nothing is sent/);
    assert.equal(isExportDestinationKind("https_url"), true);
    assert.equal(isExportDestinationKind("pastebin"), false);
    assert.ok(EXPORT_DESTINATION_KINDS.includes("local_feed"));
    const minted = mintExportFeedToken();
    assert.equal(hashExportToken(minted.token), minted.hash);
    assert.notEqual(minted.token, minted.hash);

    const push = readRepo("lib/export/push.ts");
    const actions = readRepo("lib/export/actions.ts");
    const feedRoute = readRepo("app/api/export/completions/route.ts");
    const packetRoute = readRepo("app/api/manager/reports/qi-packet/route.ts");
    for (const source of [push, actions, feedRoute, packetRoute]) {
      assert.doesNotMatch(source, /\bfetch\s*\(/);
      assert.doesNotMatch(source, /https\.request|http\.request|axios|got\(/);
      assert.doesNotMatch(source, /new WebSocket|undici/);
    }
    assert.match(actions, /recordLocalPushIntent/);
    assert.match(actions, /confirm_local_only/);
    assert.match(actions, /secureExportEnabled\(\)/);
    assert.match(readRepo("components/export/destination-card.tsx"), /does not send files to an outside host/);
  });

  it("documents the local completion feed without calling an outside host", () => {
    const doc = buildCompletionFeedDocument({
      organization: "Morning cohort",
      destinationLabel: "Local feed",
      generatedAt: "2026-08-23T12:00:00.000Z",
      items: completionFeedItemsFromReport([reportRow()]),
    });
    assert.equal(doc.schema, COMPLETION_FEED_SCHEMA);
    assert.equal(doc.includes_answer_text, false);
    assert.equal(doc.includes_clinical_outcomes, false);
    assert.equal(doc.items[0]?.certificate_serial, "FC-100");
    assert.match(doc.note, /does not include clinical outcomes/i);
    const route = readRepo("app/api/export/completions/route.ts");
    assert.match(route, /secureExportEnabled\(\)/);
    assert.match(route, /PUSH_NOT_ENABLED/);
    assert.match(readRepo("docs/product/SECURE-EXPORT.md"), /fathers\.com\.completion_feed\.v1/);
    assert.match(readRepo("docs/product/SECURE-EXPORT.md"), /does not fetch, POST/);
  });
});

describe("secure export schema", () => {
  it("creates the named tables with manager RLS and no live transport", () => {
    const sql = readRepo("supabase/migrations/20260823150000_secure_export.sql");
    assert.match(sql, /create table if not exists public.org_export_destinations/);
    assert.match(sql, /create table if not exists public.export_push_events/);
    assert.match(sql, /endpoint_hint/);
    assert.match(sql, /never used to push files/);
    assert.match(sql, /intent_recorded/);
    assert.match(sql, /not_enabled/);
    assert.match(sql, /not_configured/);
    assert.match(sql, /enable row level security/);
    assert.match(sql, /force row level security/);
    assert.match(sql, /is_manager_of_group/);
    assert.match(sql, /is_super_admin/);
    assert.match(sql, /lookup_export_feed/);
    assert.match(sql, /export_completion_feed_for_token/);
    assert.doesNotMatch(sql, /http_post|net\.http|pg_net|webhook_dispatch/i);
    assert.match(sql, /revoke all on public.org_export_destinations from anon/);
  });
});

describe("quality improvement copy hygiene", () => {
  it("expands quality improvement and keeps em dashes out", () => {
    assert.match(en.manager.reports.qiPacket, /quality improvement/);
    assert.doesNotMatch(en.manager.reports.qiPacket, /\bQI\b/);
    assert.match(en.manager.reports.qiPacketHint, /Does not include clinical outcomes/);
    assert.match(en.secureExport.lead, /does not send files to an outside host/);
    assert.equal(en.manager.reports.qiPacket.includes(EM_DASH), false);
    assert.equal(en.manager.reports.qiPacketHint.includes(EM_DASH), false);
    assert.equal(en.secureExport.lead.includes(EM_DASH), false);
    assert.equal(he.manager.reports.qiPacket.includes(EM_DASH), false);
    assert.equal(he.secureExport.lead.includes(EM_DASH), false);
    assert.match(he.manager.reports.qiPacket, /שיפור איכות/);
  });
});
