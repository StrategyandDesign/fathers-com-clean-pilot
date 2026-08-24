import * as Sentry from "@sentry/nextjs";

import { sentryDsn, sentryRuntimeEnabled } from "@/lib/observability/sentry-dsn";

if (sentryRuntimeEnabled()) {
  Sentry.init({
    dsn: sentryDsn() || undefined,
    enabled: true,
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
}

export const onRouterTransitionStart = sentryRuntimeEnabled()
  ? Sentry.captureRouterTransitionStart
  : function onRouterTransitionStart() {};
