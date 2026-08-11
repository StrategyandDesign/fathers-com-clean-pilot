// submit_award (WP-E): the server verifies the work before anything is submitted,
// and freezes the evidence into the award row. The participant's only legal
// transition remains -> submitted. Failure names the specific gaps.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// CORS helpers inlined so this function deploys as a single pasted file
// from the Supabase dashboard editor, no shared-module resolution required.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function preflight(req: Request): Response | null {
  return req.method === "OPTIONS" ? new Response("ok", { headers: corsHeaders }) : null;
}
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

serve(async (req) => {
  const pf = preflight(req); if (pf) return pf;
  const auth = req.headers.get("Authorization") ?? "";
  const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: userData } = await anon.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return json({ error: "not signed in" }, 401);

  let body: { course_id?: string };
  try { body = await req.json(); } catch { return json({ error: "malformed body" }, 400); }
  const course_id = body.course_id;
  if (!course_id) return json({ error: "bad request" }, 400);

  const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const gaps: string[] = [];

  const { data: enr } = await svc.from("certificate_enrollments").select("id,state").eq("user_id", uid).eq("course_id", course_id).maybeSingle();
  if (!enr) return json({ error: "not enrolled" }, 403);

  const { data: vids } = await svc.from("course_videos").select("id,ord,title,duration_seconds").eq("course_id", course_id).order("ord");
  const videoIds = (vids ?? []).map((v: { id: string }) => v.id);
  const { data: prog } = videoIds.length ? await svc.from("video_progress").select("video_id,completed,watched_seconds").eq("user_id", uid).in("video_id", videoIds) : { data: [] };
  const { data: passes } = videoIds.length ? await svc.from("checkpoint_passes").select("video_id,right_count,total").eq("user_id", uid).in("video_id", videoIds) : { data: [] };
  const progBy = new Map((prog ?? []).map((p: { video_id: string }) => [p.video_id, p]));
  const passBy = new Map((passes ?? []).map((p: { video_id: string }) => [p.video_id, p]));
  for (const v of vids ?? []) {
    const p = progBy.get(v.id) as { completed?: boolean } | undefined;
    if (!p?.completed) gaps.push(`Finish session ${v.ord}: ${v.title}`);
    if (!passBy.get(v.id)) gaps.push(`Pass the checkpoint for session ${v.ord}: ${v.title}`);
  }

  const { data: fq } = await svc.from("final_qa_questions").select("id,ord").eq("course_id", course_id).order("ord");
  const fqIds = (fq ?? []).map((q: { id: string }) => q.id);
  const { data: fr } = fqIds.length ? await svc.from("final_qa_responses").select("question_id,answer_text").eq("user_id", uid).in("question_id", fqIds) : { data: [] };
  const answered = new Set((fr ?? []).filter((r: { answer_text?: string }) => (r.answer_text ?? "").trim().length > 0).map((r: { question_id: string }) => r.question_id));
  for (const q of fq ?? []) if (!answered.has(q.id)) gaps.push(`Answer final question ${q.ord}`);

  if (gaps.length) return json({ error: "incomplete", gaps }, 409);

  const { data: cur } = await svc.from("certificate_awards").select("status,recipient_display").eq("user_id", uid).eq("course_id", course_id).maybeSingle();
  const from = cur?.status ?? "not_started";
  if (!["not_started", "in_progress", "returned"].includes(from)) return json({ error: `cannot submit from ${from}` }, 409);

  const displayName = (userData?.user?.user_metadata?.full_name as string | undefined)
    ?? (userData?.user?.user_metadata?.name as string | undefined)
    ?? (userData?.user?.email ? String(userData.user.email).split("@")[0] : "");
  const independent = (prog ?? []).reduce((a: number, p: { watched_seconds?: number }) => a + (p.watched_seconds ?? 0), 0);
  const snapshot = Object.fromEntries((passes ?? []).map((p: { video_id: string; right_count: number; total: number }) => [p.video_id, { right: p.right_count, total: p.total }]));
  const { error } = await svc.from("certificate_awards").upsert({
    user_id: uid, course_id, status: "submitted",
    recipient_display: cur?.recipient_display ?? displayName,
    snapshot_independent_seconds: Math.round(independent),
    snapshot_checkpoints: snapshot,
    snapshot_final_answers_count: answered.size,
    snapshot_at: new Date().toISOString(),
  }, { onConflict: "user_id,course_id" });
  if (error) return json({ error: error.message }, 400);
  await svc.from("award_audit").insert({ user_id: uid, course_id, actor: uid, from_status: from, to_status: "submitted", ip: req.headers.get("x-forwarded-for") ?? null });
  return json({ data: { ok: true } });
});
