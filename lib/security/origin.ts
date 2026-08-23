function requestOrigin(request: Request) {
  try {
    return new URL(request.url).origin;
  } catch {
    return null;
  }
}

/**
 * Same-site mutation guard. A matching Origin is required when present.
 * Cross-site fetches that omit Origin still fail via Sec-Fetch-Site.
 */
export function isSameOriginRequest(request: Request) {
  const expected = requestOrigin(request);
  if (!expected) return false;
  const origin = request.headers.get("origin");
  if (origin) return origin === expected;
  const site = (request.headers.get("sec-fetch-site") ?? "").toLowerCase();
  return site !== "cross-site";
}
