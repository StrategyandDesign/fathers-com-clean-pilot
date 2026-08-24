import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  AUTH_CONTINUE_PATH,
  authContinueHref,
  authGoReplaceScript,
  isAuthContinuePath,
  postAuthHome,
  resolvePostAuthPath,
} from "../lib/auth/continue";
import { isAuthPath, ROLE_HOME, safeInternalPath } from "../lib/auth/roles";
import { SHOW_MILITARY } from "../lib/flags";

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

describe("auth continue bounce", () => {
  it("keeps the bounce on an internal next path", () => {
    assert.equal(AUTH_CONTINUE_PATH, "/auth/go");
    assert.equal(isAuthContinuePath("/auth/go"), true);
    assert.equal(isAuthPath("/auth/go"), false);
    assert.equal(authContinueHref("/manager/start"), "/auth/go?next=%2Fmanager%2Fstart");
    assert.equal(authContinueHref("/father?desk=1"), "/auth/go?next=%2Ffather%3Fdesk%3D1");
    assert.equal(authContinueHref("/login"), "/login");
    assert.equal(safeInternalPath("/auth/go?next=%2Fmanager%2Fstart"), "/auth/go?next=/manager/start");
  });

  it("rejects external next values", () => {
    assert.equal(authContinueHref("https://evil.example"), "/login");
    assert.equal(authContinueHref("//evil.example"), "/login");
    assert.equal(authContinueHref("/\\evil.example"), "/login");
    assert.equal(authContinueHref("/%2F%2Fevil.example"), "/login");
    assert.equal(authContinueHref("/auth/go"), "/login");
    assert.equal(authContinueHref("/auth/go?next=/manager"), "/login");
  });

  it("sends not-yet-onboarded managers to /manager/start", () => {
    assert.equal(postAuthHome("manager", null), "/manager/start");
    assert.equal(postAuthHome("manager", "2026-08-20T12:00:00Z"), "/manager");
    assert.equal(postAuthHome("father", null), "/father");
    assert.equal(
      resolvePostAuthPath({
        next: null,
        role: "manager",
        managerOnboardedAt: null,
      }),
      "/manager/start"
    );
    assert.equal(
      resolvePostAuthPath({
        next: "/manager",
        role: "manager",
        managerOnboardedAt: null,
      }),
      "/manager/start"
    );
    assert.equal(
      resolvePostAuthPath({
        next: "/manager/reports",
        role: "manager",
        managerOnboardedAt: null,
      }),
      "/manager/reports"
    );
  });

  it("sends fathers to Home instead of a live session or first-week Action", () => {
    assert.equal(ROLE_HOME.father, "/father");
    assert.equal(SHOW_MILITARY, false);
    assert.equal(
      resolvePostAuthPath({
        next: null,
        role: "father",
      }),
      ROLE_HOME.father
    );
    assert.equal(
      resolvePostAuthPath({
        next: "/father/sessions/week-1/action",
        role: "father",
      }),
      ROLE_HOME.father
    );
    assert.equal(
      resolvePostAuthPath({
        next: "/father/sessions/week-1",
        role: "father",
      }),
      ROLE_HOME.father
    );
    assert.equal(
      resolvePostAuthPath({
        next: "/father/sessions/week-1/checkin",
        role: "father",
      }),
      ROLE_HOME.father
    );
    assert.equal(
      resolvePostAuthPath({
        next: "/father/start/session",
        role: "father",
      }),
      ROLE_HOME.father
    );
    assert.equal(
      resolvePostAuthPath({
        next: "/father/trainings/calm-you-can-lend",
        role: "father",
      }),
      ROLE_HOME.father
    );
    assert.equal(
      resolvePostAuthPath({
        next: "/father/account",
        role: "father",
      }),
      "/father/account"
    );
    assert.equal(
      resolvePostAuthPath({
        next: "/father/start/welcome",
        role: "father",
      }),
      "/father/start/welcome"
    );
    assert.equal(authContinueHref(ROLE_HOME.father), "/auth/go?next=%2Ffather");
  });

  it("auto-redirects the hop without a Continue splash", () => {
    assert.equal(authGoReplaceScript("/manager"), 'location.replace("/manager")');
    assert.equal(
      authGoReplaceScript("/father?desk=1"),
      'location.replace("/father?desk=1")'
    );

    const actions = readRepo("lib/auth/actions.ts");
    const join = readRepo("lib/auth/leader-join.ts");
    const page = readRepo("app/auth/go/page.tsx");
    const bounce = readRepo("components/auth/auth-continue.tsx");
    const authLayout = readRepo("app/(auth)/layout.tsx");
    assert.equal(
      existsSync(fileURLToPath(new URL("../app/(auth)/auth/go/page.tsx", import.meta.url))),
      false
    );

    assert.match(page, /safeInternalPath/);
    assert.match(page, /httpEquiv="refresh"/);
    assert.match(page, /authGoReplaceScript/);
    assert.match(page, /dangerouslySetInnerHTML/);
    assert.match(bounce, /location\.replace/);
    assert.match(bounce, /useLayoutEffect/);
    assert.match(bounce, /<noscript>/);
    assert.doesNotMatch(bounce, /useT\(/);
    assert.doesNotMatch(bounce, /common\.continue/);
    assert.doesNotMatch(page, /BrandLogo/);
    assert.doesNotMatch(page, /auth\.pilotNotice/);
    assert.match(authLayout, /BrandLogo/);
    assert.match(actions, /resolveProfileRole/);
    assert.match(actions, /manager_onboarded_at/);
    assert.match(actions, /authContinueHref/);
    assert.match(actions, /resolvePostAuthPath/);
    assert.doesNotMatch(actions, /ROLE_HOME\[resolveRole/);
    assert.match(join, /authContinueHref/);
    assert.match(join, /postAuthHome\("manager", null\)/);
    assert.match(actions, /authContinueHref\(ROLE_HOME\.father\)/);
  });

  it("keeps father first-run off the live week and still auto-assigns Included", () => {
    const startActions = readRepo("lib/father/start-actions.ts");
    const gate = readRepo("lib/father/onboarding-gate.ts");
    const startIndex = readRepo("app/(father)/father/start/page.tsx");
    const startSession = readRepo("app/(father)/father/start/session/page.tsx");
    const startHold = readRepo("app/(father)/father/start/hold/page.tsx");
    const join = readRepo("lib/auth/group-join.ts");

    assert.match(startActions, /ROLE_HOME\.father/);
    assert.doesNotMatch(startActions, /first \? first\.href/);
    assert.match(gate, /fatherOnboardingRedirect/);
    assert.doesNotMatch(gate, /firstSessionHref/);
    assert.match(startIndex, /ROLE_HOME\.father/);
    assert.doesNotMatch(startIndex, /firstSessionHref/);
    assert.match(startSession, /ROLE_HOME\.father/);
    assert.doesNotMatch(startSession, /firstSessionHref/);
    assert.match(startHold, /ROLE_HOME\.father/);
    assert.doesNotMatch(startHold, /firstSessionHref/);
    assert.match(join, /syncIncludedTrainingsForFather/);
  });
});
