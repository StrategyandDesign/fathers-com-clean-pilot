import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { emptyCounselPackState, type CounselPackState } from "../lib/counsel/pack";
import { createTranslator } from "../lib/i18n/translate";
import {
  buildTrustStatusView,
  parseSsoConnection,
  resolvePackTrustStatus,
  resolveSsoStatus,
  trustStatusLines,
  trustStatusText,
} from "../lib/trust/status";

const EM_DASH = "—";
const t = createTranslator("en");

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

function state(overrides: Partial<CounselPackState> = {}): CounselPackState {
  return {
    ...emptyCounselPackState("group-1", "Morning cohort"),
    ...overrides,
  };
}

describe("single sign-on trust status", () => {
  it("stays Not connected unless a connection is already present", () => {
    assert.equal(resolveSsoStatus(undefined), "not_connected");
    assert.equal(resolveSsoStatus(null), "not_connected");
    assert.equal(resolveSsoStatus(parseSsoConnection(null)), "not_connected");
    assert.equal(resolveSsoStatus(parseSsoConnection({ connected: false })), "not_connected");
    assert.equal(resolveSsoStatus(parseSsoConnection({ connected: true })), "connected");
  });

  it("renders Not connected and Coming via Issue 3 when nothing is wired", () => {
    const model = buildTrustStatusView({
      sso: null,
      states: [state()],
      counselHref: "/manager/account/counsel",
    });
    const lines = trustStatusLines(model, t);
    const sso = lines.find((line) => line.key === "sso");
    assert.ok(sso);
    assert.equal(sso.label, "Single sign-on");
    assert.equal(sso.value, "Not connected.");
    assert.equal(sso.note, "Coming via Issue 3.");
    assert.equal(sso.href, undefined);
  });

  it("renders Connected when an identity provider is already present", () => {
    const model = buildTrustStatusView({
      sso: { connected: true, providerName: "Example IdP" },
      states: [state()],
      counselHref: "/admin/account/counsel",
    });
    const sso = trustStatusLines(model, t).find((line) => line.key === "sso");
    assert.ok(sso);
    assert.equal(sso.value, "Connected");
    assert.match(sso.note, /Example IdP/);
    assert.doesNotMatch(sso.note, /Issue 3/);
  });
});

describe("Business Associate Agreement pack status", () => {
  it("keeps drafts available off the executed claim", () => {
    assert.equal(resolvePackTrustStatus([state()]), "drafts_available");
    const model = buildTrustStatusView({
      sso: null,
      states: [state()],
      counselHref: "/manager/account/counsel",
    });
    const pack = trustStatusLines(model, t).find((line) => line.key === "pack");
    assert.ok(pack);
    assert.equal(pack.label, "Business Associate Agreement and education-only pack");
    assert.equal(pack.value, "Drafts available.");
    assert.equal(pack.note, "Not an executed agreement.");
    assert.equal(pack.href, "/manager/account/counsel");
    assert.equal(pack.linkLabel, "Open counsel pack");
  });

  it("surfaces checklist open ahead of an attached mark on another group", () => {
    const waiting = state({ required: true });
    const attached = state({
      groupId: "group-2",
      required: true,
      attachedAt: "2026-08-23T12:00:00.000Z",
    });
    assert.equal(resolvePackTrustStatus([attached, waiting]), "checklist_open");
    assert.equal(resolvePackTrustStatus([attached]), "attached_mark");
  });
});

describe("data-processing contact stub", () => {
  it("points the contact stub at the existing counsel route", () => {
    const model = buildTrustStatusView({
      sso: null,
      states: [state()],
      counselHref: "/admin/account/counsel",
    });
    const contact = trustStatusLines(model, t).find((line) => line.key === "contact");
    assert.ok(contact);
    assert.equal(contact.label, "Data-processing contact");
    assert.equal(contact.href, "/admin/account/counsel");
    assert.equal(contact.linkLabel, "Open the counsel contact stub");
    assert.match(contact.value, /Draft contact stub only/);
    const text = trustStatusText(trustStatusLines(model, t));
    assert.equal(text.includes(EM_DASH), false);
    assert.doesNotMatch(text, /\bSSO\b|\bBAA\b|Executed agreement/);
  });
});

describe("trust strip wiring", () => {
  it("puts a muted strip on Account and Super-admin org trust", () => {
    const account = readRepo("components/layout/account-view.tsx");
    const strip = readRepo("components/trust/trust-status-strip.tsx");
    const accountStrip = readRepo("components/trust/account-trust-strip.tsx");
    const orgPage = readRepo("app/(admin)/admin/organizations/[id]/page.tsx");
    const orgStrip = readRepo("components/trust/org-trust-strip.tsx");
    const nav = readRepo("components/layout/app-nav.tsx");
    const header = readRepo("components/layout/manager-header-menu.tsx");
    const fatherAccount = readRepo("app/(father)/father/account/page.tsx");

    assert.match(account, /AccountTrustStrip/);
    assert.match(account, /role === "manager" \|\| role === "admin"/);
    assert.match(accountStrip, /\/manager\/account\/counsel/);
    assert.match(accountStrip, /\/admin\/account\/counsel/);
    assert.match(accountStrip, /sso: null/);
    assert.match(orgPage, /OrgTrustStrip/);
    assert.match(orgStrip, /\/admin\/account\/counsel/);
    assert.match(orgStrip, /sso: null/);
    assert.match(strip, /border-y border-border\/60/);
    assert.match(strip, /text-muted-foreground/);
    assert.match(strip, /line\.href/);
    assert.doesNotMatch(nav, /trust/);
    assert.doesNotMatch(header, /trust/);
    assert.doesNotMatch(fatherAccount, /TrustStatus|AccountTrustStrip|OrgTrustStrip/);
  });

  it("reuses counsel downloads instead of repeating the six files", () => {
    const strip = readRepo("components/trust/trust-status-strip.tsx");
    const status = readRepo("lib/trust/status.ts");
    assert.doesNotMatch(strip, /baa-template|education-memo-data-map|qsoa/);
    assert.doesNotMatch(status, /baa-template|Download draft/);
    assert.match(status, /openCounsel/);
    assert.match(readRepo("components/trust/account-trust-strip.tsx"), /loadManagerCounselPackStates/);
  });

  it("does not add SAML or OIDC in this issue", () => {
    const files = [
      "lib/trust/status.ts",
      "components/trust/trust-status-strip.tsx",
      "components/trust/account-trust-strip.tsx",
      "components/trust/org-trust-strip.tsx",
    ];
    for (const file of files) {
      const source = readRepo(file);
      assert.doesNotMatch(source, /SAML|OIDC|saml|oidc/);
    }
  });
});
