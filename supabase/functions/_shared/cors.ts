// Reference only: every function inlines these helpers so it can be
// pasted whole into the dashboard editor. Keep the two in sync if edited.
// Shared CORS scaffolding for every Fathers.com Edge Function (WP-B).

const CORS_BASE = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function allowedOrigin(origin: string | null): string | null {
  if (!origin) return null;
  if (origin === "http://localhost:3000") return origin;
  if (/^https:\/\/([a-z0-9-]+\.)?fathers\.com$/.test(origin)) return origin;
  if (/^https:\/\/[a-z0-9-]+-strategyanddesign\.vercel\.app$/.test(origin)) return origin;
  if (/^https:\/\/fathers-com-platform[a-z0-9-]*\.vercel\.app$/.test(origin)) return origin;
  return null;
}

export function corsFor(req: Request): Record<string, string> {
  const allowed = allowedOrigin(req.headers.get("Origin"));
  return {
    ...CORS_BASE,
    "Access-Control-Allow-Origin": allowed ?? "https://fathers.com",
  };
}

/** @deprecated Prefer corsFor(req). Kept for reference sync with inlined helpers. */
export const corsHeaders = {
  ...CORS_BASE,
  "Access-Control-Allow-Origin": "https://fathers.com",
};

export function preflight(req: Request): Response | null {
  return req.method === "OPTIONS" ? new Response("ok", { headers: corsFor(req) }) : null;
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsFor(req), "Content-Type": "application/json" },
  });
}
