// checkpoint_submit (WP-C): the server grades; the oracle is closed.
// Enrollment-gated, attempt-budgeted, pass recorded durably, retries flagged.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { preflight, json } from "../_shared/cors.ts";

serve(async (req) => {
  const pf = preflight(req); if (pf) return pf;
  const auth = req.headers.get("Authorization") ?? "";
  const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: userData } = await anon.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return json({ error: "not signed in" }, 401);

  let body: { video_id?: string; answers?: { question_id: string; chosen_index: number }[] };
  try { body = await req.json(); } catch { return json({ error: "malformed body" }, 400); }
  const { video_id, answers } = body;
  if (!video_id || !Array.isArray(answers)) return json({ error: "bad request" }, 400);

  const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // 1. Enrollment gate: the video's course must be actively enrolled.
  const { data: vid } = await svc.from("course_videos").select("course_id").eq("id", video_id).maybeSingle();
  if (!vid) return json({ error: "unknown video" }, 400);
  const { data: enr } = await svc.from("certificate_enrollments").select("id,state").eq("user_id", uid).eq("course_id", vid.course_id).maybeSingle();
  if (!enr || !["enrolled", "in_progress"].includes(enr.state ?? "enrolled")) return json({ error: "not enrolled" }, 403);

  // 2. Attempt budget: three per hour per video.
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await svc.from("quiz_attempts").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("video_id", video_id).gte("created_at", hourAgo);
  if ((count ?? 0) >= 3) return json({ locked: true, retry_after_minutes: 60 });

  const { data: qs, error } = await svc.from("quiz_questions").select("id,correct_index").eq("video_id", video_id);
  if (error || !qs?.length) return json({ error: error?.message ?? "no questions" }, 400);

  const chosen = new Map(answers.map((a) => [a.question_id, a.chosen_index]));
  let right = 0;
  for (const q of qs) {
    const c = chosen.get(q.id);
    const correct = c === q.correct_index;
    if (correct) right++;
    await svc.from("quiz_responses").upsert({ user_id: uid, question_id: q.id, chosen_index: c ?? null, correct }, { onConflict: "user_id,question_id" });
  }
  const total = qs.length;
  const passed = right >= Math.ceil(total * 0.8);

  // 3. Every attempt logged, regardless of outcome.
  await svc.from("quiz_attempts").insert({ user_id: uid, video_id, right_count: right, total, passed });

  // 4. Durable pass record.
  if (passed) await svc.from("checkpoint_passes").upsert({ user_id: uid, video_id, right_count: right, total }, { onConflict: "user_id,video_id" });

  // 5. Anomaly hook: heavy retry pattern across the course flags the record.
  const { count: courseAttempts } = await svc.from("quiz_attempts").select("id", { count: "exact", head: true }).eq("user_id", uid).in("video_id",
    (await svc.from("course_videos").select("id").eq("course_id", vid.course_id)).data?.map((v: { id: string }) => v.id) ?? []);
  if ((courseAttempts ?? 0) > 12) {
    await svc.from("integrity_flags").upsert({ user_id: uid, course_id: vid.course_id, reason: "checkpoint_retry_pattern" }, { onConflict: "user_id,course_id" });
  }
  return json({ passed, right, total });
});
