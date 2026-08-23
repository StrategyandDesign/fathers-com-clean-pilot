import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { safeInternalPath } from "../lib/auth/roles";
import { cronAuthorized } from "../lib/security/cron-auth";
import { isSameOriginRequest } from "../lib/security/origin";
import { publicErrorMessage } from "../lib/security/public-error";
import { allowRateLimit } from "../lib/security/rate-limit";
import { bearerToken, secretsEqual } from "../lib/security/secrets";
import { sessionFailureAction } from "../lib/security/session-guard";

const EM_DASH = "—";

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

describe("hardening after Shared 1-1.117", () => {
  it("fails gated desks closed when session refresh throws", () => {
    assert.equal(sessionFailureAction("/admin"), "login");
    assert.equal(sessionFailureAction("/manager/reports"), "login");
    assert.equal(sessionFailureAction("/father"), "login");
    assert.equal(sessionFailureAction("/reviewer"), "login");
    assert.equal(sessionFailureAction("/verify/ABC"), "continue");
    assert.equal(sessionFailureAction("/login"), "continue");
    assert.match(readRepo("lib/supabase/middleware.ts"), /sessionFailureAction/);
  });

  it("fails rate limits closed and keeps verify plus auth on the list", () => {
    const source = readRepo("lib/security/rate-limit.ts");
    assert.match(source, /failed closed/);
    assert.doesNotMatch(source, /failed open/);
    assert.match(source, /"auth.signin"/);
    assert.match(source, /"certificates.verify"/);
    assert.match(source, /"push.subscribe"/);
    assert.equal(allowRateLimit("auth.signin", "203.0.113.10"), true);
  });

  it("compares cron and identity tokens in constant time", () => {
    assert.equal(secretsEqual("alpha", "alpha"), true);
    assert.equal(secretsEqual("alpha", "beta1"), false);
    assert.equal(secretsEqual("short", "longer-secret"), false);
    assert.equal(bearerToken("Bearer secret"), "secret");
    const previous = process.env.CRON_SECRET;
    process.env.CRON_SECRET = "cron-secret";
    try {
      const allowed = cronAuthorized(
        new Request("http://127.0.0.1/api/cron/reminders", {
          headers: { authorization: "Bearer cron-secret" },
        })
      );
      const denied = cronAuthorized(
        new Request("http://127.0.0.1/api/cron/reminders", {
          headers: { authorization: "Bearer wrong" },
        })
      );
      assert.equal(allowed, true);
      assert.equal(denied, false);
    } finally {
      if (previous === undefined) delete process.env.CRON_SECRET;
      else process.env.CRON_SECRET = previous;
    }
    assert.match(readRepo("lib/identity/scim.ts"), /secretsEqual/);
    assert.match(readRepo("app/api/cron/reminders/route.ts"), /cronAuthorized/);
    assert.match(readRepo("app/api/cron/streaks/route.ts"), /cronAuthorized/);
  });

  it("rejects encoded open redirects and keeps ordinary next paths", () => {
    assert.equal(safeInternalPath("/father"), "/father");
    assert.equal(safeInternalPath("/manager/reports?group_id=1"), "/manager/reports?group_id=1");
    assert.equal(safeInternalPath("//evil.example"), null);
    assert.equal(safeInternalPath("/%2F%2Fevil.example"), null);
    assert.equal(safeInternalPath("/https://evil.example"), null);
    assert.equal(safeInternalPath("/\\evil.example"), null);
    assert.equal(safeInternalPath("https://evil.example"), null);
  });

  it("blocks cross-site mutations when Origin mismatches or Sec-Fetch-Site is cross-site", () => {
    const url = "https://fathers.example/api/session-progress/position";
    assert.equal(
      isSameOriginRequest(
        new Request(url, { headers: { origin: "https://fathers.example" } })
      ),
      true
    );
    assert.equal(
      isSameOriginRequest(new Request(url, { headers: { origin: "https://evil.example" } })),
      false
    );
    assert.equal(
      isSameOriginRequest(new Request(url, { headers: { "sec-fetch-site": "cross-site" } })),
      false
    );
    assert.equal(isSameOriginRequest(new Request(url)), true);
    assert.match(readRepo("app/api/push/subscribe/route.ts"), /isSameOriginRequest/);
    assert.match(readRepo("app/api/push/subscribe/route.ts"), /push.subscribe/);
    assert.match(readRepo("app/api/profile/evaluate/route.ts"), /isSameOriginRequest/);
  });

  it("keeps user-facing errors generic", () => {
    assert.equal(
      publicErrorMessage(new Error("relation certificates does not exist"), "Could not generate the PDF."),
      "Could not generate the PDF."
    );
    assert.match(readRepo("app/api/manager/impact/export/route.ts"), /publicErrorMessage/);
    assert.match(readRepo("app/api/manager/reports/export/route.ts"), /publicErrorMessage/);
    assert.match(readRepo("app/api/reviewer/summary/export/route.ts"), /publicErrorMessage/);
    assert.match(readRepo("app/(auth)/auth/callback/route.ts"), /publicErrorMessage/);
    assert.match(readRepo("lib/identity/scim-apply.ts"), /Could not provision/);
    assert.doesNotMatch(readRepo("lib/identity/scim-apply.ts"), /error: error\.message/);
    assert.doesNotMatch(
      readRepo("app/api/export/completions/route.ts"),
      /searchParams\.get\("token"\)/
    );
  });

  it("ships HTTP Strict Transport Security and a route error boundary without stacks", () => {
    const config = readRepo("next.config.ts");
    assert.match(config, /Strict-Transport-Security/);
    assert.match(config, /max-age=31536000/);
    const errorPage = readRepo("app/error.tsx");
    assert.match(errorPage, /Something went wrong/);
    assert.doesNotMatch(errorPage, /error\.message|error\.stack/);
    assert.equal(errorPage.includes(EM_DASH), false);
  });

  it("keeps the README start-here door and a hardening note without a Desk tick", () => {
    const readme = readRepo("README.md");
    assert.match(readme, /\*\*Start here\.\*\*/);
    assert.match(readme, /docs\/engineering\/PILOT\.md/);
    const note = readRepo("docs/engineering/HARDENING-1-1.117.md");
    assert.match(note, /No Desk tick/);
    assert.match(note, /fail closed/);
    assert.match(note, /not a System and Organization Controls Type 2 claim/i);
    assert.doesNotMatch(note, /SOC 2 certified|HITRUST certified/);
    assert.equal(note.includes(EM_DASH), false);
    assert.match(readRepo("docs/engineering/README.md"), /HARDENING-1-1.117\.md/);
    assert.match(readRepo("lib/trust/questionnaire.ts"), /fail closed/);
    assert.match(readRepo("docs/engineering/production-launch.md"), /fail closed/);
    assert.doesNotMatch(readRepo("shared-mark.json"), /1\.118/);
  });

  it("keeps the service-role key off public env names", () => {
    const example = readRepo(".env.example");
    assert.match(example, /Never paste a service-role key into a NEXT_PUBLIC_/);
    assert.doesNotMatch(example, /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE/);
    assert.match(readRepo("lib/supabase/admin.ts"), /import "server-only"/);
    assert.doesNotMatch(readRepo("lib/supabase/env.ts"), /SERVICE_ROLE/);
  });
});
