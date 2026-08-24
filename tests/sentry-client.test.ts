import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { sentryEnabled, sentryRuntimeEnabled } from "../lib/observability/sentry-dsn";

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

describe("Sentry runtime in next dev", () => {
  it("stays off without a DSN and off during development", () => {
    const previousDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    const previousNode = process.env.NODE_ENV;
    try {
      delete process.env.NEXT_PUBLIC_SENTRY_DSN;
      delete process.env.SENTRY_DSN;
      assert.equal(sentryEnabled(), false);
      assert.equal(sentryRuntimeEnabled(), false);

      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://examplePublicKey@o0.ingest.sentry.io/0";
      process.env.NODE_ENV = "development";
      assert.equal(sentryEnabled(), true);
      assert.equal(sentryRuntimeEnabled(), false);

      process.env.NODE_ENV = "production";
      assert.equal(sentryRuntimeEnabled(), true);
    } finally {
      if (previousDsn === undefined) delete process.env.NEXT_PUBLIC_SENTRY_DSN;
      else process.env.NEXT_PUBLIC_SENTRY_DSN = previousDsn;
      if (previousNode === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousNode;
    }
  });

  it("does not wire the client router hook unless runtime Sentry is on", () => {
    const client = readRepo("instrumentation-client.ts");
    const dsn = readRepo("lib/observability/sentry-dsn.ts");
    assert.match(client, /sentryRuntimeEnabled/);
    assert.match(client, /captureRouterTransitionStart/);
    assert.match(client, /function onRouterTransitionStart\(\) \{\}/);
    assert.match(dsn, /react-server-dom-turbopack-client\.browser\.development\.js/);
    assert.match(dsn, /frame\.join/);
    assert.match(readRepo("instrumentation.ts"), /sentryRuntimeEnabled/);
    assert.doesNotMatch(readRepo("lib/auth/actions.ts"), /frame\.join/);
  });
});
