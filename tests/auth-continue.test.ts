import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  AUTH_CONTINUE_PATH,
  authContinueHref,
  isAuthContinuePath,
  postAuthHome,
  resolvePostAuthPath,
} from "../lib/auth/continue";
import { isAuthPath, safeInternalPath } from "../lib/auth/roles";

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

  it("wires signIn to the bounce with profile role and manager start", () => {
    const actions = readRepo("lib/auth/actions.ts");
    const join = readRepo("lib/auth/leader-join.ts");
    const page = readRepo("app/(auth)/auth/go/page.tsx");
    const bounce = readRepo("components/auth/auth-continue.tsx");

    assert.match(page, /safeInternalPath/);
    assert.match(bounce, /location\.replace/);
    assert.match(actions, /resolveProfileRole/);
    assert.match(actions, /manager_onboarded_at/);
    assert.match(actions, /authContinueHref/);
    assert.match(actions, /resolvePostAuthPath/);
    assert.doesNotMatch(actions, /ROLE_HOME\[resolveRole/);
    assert.match(join, /authContinueHref/);
    assert.match(join, /postAuthHome\("manager", null\)/);
    assert.match(actions, /authContinueHref\(ROLE_HOME\.father\)/);
  });
});
