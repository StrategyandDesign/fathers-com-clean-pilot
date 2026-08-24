import * as Sentry from "@sentry/nextjs";

import { sentryRuntimeEnabled } from "@/lib/observability/sentry-dsn";

export async function register() {
  if (!sentryRuntimeEnabled()) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = sentryRuntimeEnabled()
  ? Sentry.captureRequestError
  : function onRequestError() {};
