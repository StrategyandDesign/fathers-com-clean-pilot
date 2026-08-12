// progress_beat (WP-D): server-credited time, scoped and honest.
// Enrollment-gated; touches only this course's enrollment and never regresses
// a later state; null-duration films earn nothing and never complete; rejected
// beats are recorded with reasons; the client's opinion of completion is ignored.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// CORS helpers inlined so this function deploys as a single pasted file
// from the Supabase dashboard editor, no shared-module resolution required.
const CORS_BASE = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function allowedOrigin(origin: string | null): string | null {
  if (!origin) return null;
  if (origin === "http://localhost:3000") return origin;
  if (/^https:\/\/([a-z0-9-]+\.)?fathers\.com$/.test(origin)) return origin;
  if (/^https:\/\/[a-z0-9-]+-strategyanddesign\.vercel\.app$/.test(origin)) return origin;
  if (/^https:\/\/fathers-com-platform[a-z0-9-]*\.vercel\.app$/.test(origin)) return origin;
  return null;
}
function corsFor(req: Request): Record<string, string> {
  const allowed = allowedOrigin(req.headers.get("Origin"));
  return {
    ...CORS_BASE,
    "Access-Control-Allow-Origin": allowed ?? "https://fathers.com",
  };
}
function preflight(req: Request): Response | null {
  return req.method === "OPTIONS" ? new Response("ok", { headers: corsFor(req) }) : null;
}
function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsFor(req), "Content-Type": "application/json" } });
}


serve(async (req) => {
  const pf = preflight(req); if (pf) return pf;
  const auth = req.headers.get("Authorization") ?? "";
  const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: userData } = await anon.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return json(req, { error: "not signed in" }, 401);

  let body: { video_id?: string; position_seconds?: number };
  try { body = await req.json(); } catch { return json(req, { error: "malformed body" }, 400); }
  const { video_id, position_seconds } = body;
  if (!video_id || typeof position_seconds !== "number") return json(req, { error: "bad request" }, 400);

  const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const now = new Date();

  const { data: vid } = await svc.from("course_videos").select("course_id,duration_seconds").eq("id", video_id).maybeSingle();
  if (!vid) return json(req, { error: "unknown video" }, 400);
  const { data: enr } = await svc.from("certificate_enrollments").select("id,state").eq("user_id", uid).eq("course_id", vid.course_id).maybeSingle();
  if (!enr) return json(req, { error: "not enrolled" }, 403);

  const duration = vid.duration_seconds ?? 0;
  async function reject(reason: string) {
    await svc.from("progress_events").insert({ user_id: uid, video_id, position_seconds, credited_seconds: 0, reason });
    return json(req, { credited: 0, reason });
  }
  if (!duration) return reject("no film");
  if (position_seconds > duration + 5) return reject("position past duration");

  const { data: last } = await svc.from("progress_events").select("video_id,position_seconds,created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(1).maybeSingle();
  let credited = 0;
  if (last) {
    const wall = (now.getTime() - new Date(last.created_at).getTime()) / 1000;
    if (wall < 25) return reject("too soon");
    if (last.video_id !== video_id && wall < 60) return reject("concurrent session");
    const posDelta = last.video_id === video_id ? Math.max(0, position_seconds - last.position_seconds) : 0;
    credited = Math.max(0, Math.min(wall, posDelta, 45));
  }
  await svc.from("progress_events").insert({ user_id: uid, video_id, position_seconds, credited_seconds: credited });

  const { data: sum } = await svc.rpc("credited_total", { p_user: uid, p_video: video_id });
  let total = typeof sum === "number" ? sum : 0;
  total = Math.min(total, duration);
  const done = total >= duration * 0.9;
  await svc.from("video_progress").upsert({ user_id: uid, video_id, watched_seconds: Math.round(total), completed: done, updated_at: now.toISOString() }, { onConflict: "user_id,video_id" });

  // Scoped, non-regressing enrollment touch: enrolled -> in_progress only.
  await svc.from("certificate_enrollments").update({ last_activity_at: now.toISOString(), state: "in_progress" })
    .eq("user_id", uid).eq("course_id", vid.course_id).eq("state", "enrolled");
  await svc.from("certificate_enrollments").update({ last_activity_at: now.toISOString() })
    .eq("user_id", uid).eq("course_id", vid.course_id).eq("state", "in_progress");

  return json(req, { credited, total, completed: done });
});
