import * as Sentry from "@sentry/nextjs";

import { sentryDsn, sentryRuntimeEnabled } from "@/lib/observability/sentry-dsn";

Sentry.init({
  dsn: sentryDsn() || undefined,
  enabled: sentryRuntimeEnabled(),
  tracesSampleRate: 0,
  sendDefaultPii: false,
});
