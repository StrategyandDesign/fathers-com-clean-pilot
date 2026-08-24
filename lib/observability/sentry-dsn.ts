export function sentryDsn() {
  return process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || "";
}

export function sentryEnabled() {
  return Boolean(sentryDsn());
}

/**
 * Runtime SDK. Off in `next dev` so React Flight debug stacks stay arrays.
 * Dev Flight calls `frame.join("-")` in
 * `react-server-dom-turbopack-client.browser.development.js`.
 */
export function sentryRuntimeEnabled() {
  return sentryEnabled() && process.env.NODE_ENV === "production";
}
