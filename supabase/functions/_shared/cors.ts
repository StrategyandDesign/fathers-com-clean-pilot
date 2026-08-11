// Reference only: every function inlines these helpers so it can be
// pasted whole into the dashboard editor. Keep the two in sync if edited.
// Shared CORS scaffolding for every Fathers.com Edge Function (WP-B).
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // tighten to deployment origins at cutover
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
export function preflight(req: Request): Response | null {
  return req.method === "OPTIONS" ? new Response("ok", { headers: corsHeaders }) : null;
}
export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
