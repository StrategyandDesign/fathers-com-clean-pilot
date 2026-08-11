// review_award (WP-F): the approval path. Facilitator or admin only, legal
// transitions only, contact hours and attestation frozen at approval, the
// serial minted at signing, every action audited with the reviewer as actor.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { preflight, json } from "../_shared/cors.ts";

serve(async (req) => {
  const pf = preflight(req); if (pf) return pf;
  const auth = req.headers.get("Authorization") ?? "";
  const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: userData } = await anon.auth.getUser();
  const reviewer = userData?.user?.id;
  if (!reviewer) return json({ error: "not signed in" }, 401);

  const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: roles } = await svc.from("user_roles").select("role").eq("user_id", reviewer);
  const allowed = (roles ?? []).some((r: { role: string }) => ["facilitator", "admin", "owner"].includes(r.role));
  if (!allowed) return json({ error: "reviewer role required" }, 403);

  let body: { user_id?: string; course_id?: string; action?: string; note?: string; contact_hours?: number; attestation_method?: string; integrity_cleared?: boolean };
  try { body = await req.json(); } catch { return json({ error: "malformed body" }, 400); }
  const { user_id, course_id, action, note, contact_hours, attestation_method } = body;

  // Reviewer read path: the queue of submitted awards with evidence, plus the
  // 72-hour absence list. Reads run with the service role because RLS scopes
  // participants to their own rows; the role gate above is the authority here.
  if (action === "queue") {
    const { data: subs } = await svc.from("certificate_awards").select("user_id,course_id,status,record_integrity,snapshot_independent_seconds,snapshot_checkpoints,snapshot_final_answers_count,snapshot_at").eq("status", "submitted");
    const { data: flags } = await svc.from("integrity_flags").select("user_id,course_id,reason");
    const cutoff = new Date(Date.now() - 72 * 3600_000).toISOString();
    const { data: enrs } = await svc.from("certificate_enrollments").select("user_id,course_id,state,last_activity_at").in("state", ["enrolled", "in_progress"]);
    const absent = (enrs ?? []).filter((e: { last_activity_at?: string }) => !e.last_activity_at || e.last_activity_at < cutoff);
    return json({ data: { submitted: subs ?? [], flags: flags ?? [], absent } });
  }
  if (!user_id || !course_id || !action) return json({ error: "bad request" }, 400);

  const { data: cur } = await svc.from("certificate_awards").select("*").eq("user_id", user_id).eq("course_id", course_id).maybeSingle();
  if (!cur) return json({ error: "no award" }, 404);

  const legal: Record<string, string[]> = { approve: ["submitted"], return: ["submitted"], sign: ["approved"] };
  if (!legal[action]?.includes(cur.status)) return json({ error: `cannot ${action} from ${cur.status}` }, 409);

  if (cur.record_integrity === "flagged" && action === "approve" && !body.integrity_cleared) {
    return json({ error: "record is flagged; review and set integrity_cleared with a note" }, 409);
  }

  if (action === "approve") {
    if (typeof contact_hours !== "number" || !["facilitator", "id"].includes(attestation_method ?? "")) {
      return json({ error: "approve requires contact_hours and attestation_method" }, 400);
    }
    await svc.from("certificate_awards").update({
      status: "approved", contact_hours, attestation_method,
      review_note: note ?? null,
      integrity_cleared: body.integrity_cleared ? true : cur.integrity_cleared ?? null,
    }).eq("user_id", user_id).eq("course_id", course_id);
  } else if (action === "return") {
    await svc.from("certificate_awards").update({ status: "returned", review_note: note ?? null }).eq("user_id", user_id).eq("course_id", course_id);
  } else if (action === "sign") {
    let serial = "";
    for (let i = 0; i < 8; i++) {
      serial = "FC-2026-" + String(Math.floor(100000 + Math.random() * 900000));
      const { data: clash } = await svc.from("public_certificates").select("serial").eq("serial", serial).maybeSingle();
      if (!clash) break;
    }
    const issued_at = new Date().toISOString();
    await svc.from("certificate_awards").update({ status: "signed", serial, issued_at }).eq("user_id", user_id).eq("course_id", course_id);
    const { data: course } = await svc.from("certificate_courses").select("title").eq("id", course_id).maybeSingle();
    await svc.from("public_certificates").upsert({
      serial, status: "issued", issued_at,
      course_title: course?.title ?? "",
      recipient_display: cur.recipient_display ?? "",
      contact_hours: cur.contact_hours ?? 0,
      attestation_method: cur.attestation_method ?? "facilitator",
      snapshot_independent_seconds: cur.snapshot_independent_seconds ?? 0,
    }, { onConflict: "serial" });
  } else {
    return json({ error: "unknown action" }, 400);
  }
  await svc.from("award_audit").insert({ user_id, course_id, actor: reviewer, from_status: cur.status, to_status: action === "approve" ? "approved" : action === "return" ? "returned" : "signed", ip: req.headers.get("x-forwarded-for") ?? null });
  return json({ data: { ok: true } });
});
