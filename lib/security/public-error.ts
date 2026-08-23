export function logServerError(scope: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${scope}]`, message);
}

/** User-facing copy only. Never return stack traces or raw driver text. */
export function publicErrorMessage(_error: unknown, fallback: string) {
  return fallback;
}
