// Fathers.com : issue-certificate edge function (Deno / Supabase)
// SECURITY: runs with the service role. A certificate can ONLY be issued here,
// never from the browser, and ONLY after the enrollment provably meets every
// requirement. This prevents a user from forging a certificate for themselves.
//
// Deploy:  supabase functions deploy issue-certificate
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (platform-injected)
// Call:    POST { enrollment_id }  with Authorization: Bearer <JWT>
// Auth:    admin or content_reviewer in user_roles only (participant self-issue
//          goes through the award / review pipeline, not this mint path).
//
// Requirements enforced before issuance:
//   1. ID verified at enrollment (id_verified_at is set)
//   2. Enough time logged for the course hours (seconds_logged >= hours * 3600 * 0.9)
//   3. Final assessment passed (passed_final = true)
//   4. Not already issued
//
// On success: mints a unique serial, writes the certificates row, marks the
// enrollment issued, and returns the serial. Optionally fires the issued email.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsFor(req), "Content-Type": "application/json" },
  });
}

// A readable, unique serial: PREFIX-YYYY-NNNNNN. Prefix defaults to FC
// (NCF); a course tied to a platform_verticals row mints under that
// vertical's cert_prefix (engine verticals, v4.7.0).
async function mintSerial(sb: any, prefix = "FC"): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 8; attempt++) {
    const n = Math.floor(100000 + Math.random() * 900000);
    const serial = `${prefix}-${year}-${n}`;
    const { data } = await sb.from("certificates").select("id").eq("serial", serial).maybeSingle();
    if (!data) return serial;
  }
  throw new Error("Could not mint a unique serial");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsFor(req) });
  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!jwt) return json(req, { error: "not signed in" }, 401);

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    const { data: userData, error: userErr } = await sb.auth.getUser(jwt);
    if (userErr || !userData?.user) return json(req, { error: "invalid session" }, 401);
    const callerId = userData.user.id;

    // Issuance is admin / content_reviewer only. Participants go through awards.
    const { data: roles } = await sb.from("user_roles").select("role").eq("user_id", callerId);
    const roleSet = new Set((roles ?? []).map((r: { role: string }) => r.role));
    const canIssue = roleSet.has("admin") || roleSet.has("content_reviewer");
    if (!canIssue) return json(req, { error: "admin or content_reviewer role required" }, 403);

    const { enrollment_id } = await req.json();
    if (!enrollment_id) {
      return json(req, { error: "enrollment_id required" }, 400);
    }

    // Pull the enrollment + its course + the recipient's display name.
    const { data: enr, error: enrErr } = await sb
      .from("certificate_enrollments")
      .select("id, user_id, course_id, id_verified_at, seconds_logged, passed_final, status")
      .eq("id", enrollment_id)
      .single();
    if (enrErr || !enr) {
      return json(req, { error: "Enrollment not found" }, 404);
    }
    if (enr.status === "issued") {
      return json(req, { error: "Already issued" }, 409);
    }

    const { data: course } = await sb
      .from("certificate_courses").select("*").eq("id", enr.course_id).single();
    if (!course) {
      return json(req, { error: "Course not found" }, 404);
    }

    // ---- enforce every requirement ----
    const failures: string[] = [];
    if (!enr.id_verified_at) failures.push("identity not verified");
    const requiredSeconds = Math.floor(Number(course.hours) * 3600 * 0.9); // 90% of hours on task
    if ((enr.seconds_logged ?? 0) < requiredSeconds) failures.push("insufficient time logged");
    if (!enr.passed_final) failures.push("final assessment not passed");
    if (failures.length) {
      return json(req, { error: "Requirements not met", failures }, 422);
    }

    // recipient display: "First L." from the profile
    const { data: profile } = await sb
      .from("profiles").select("full_name").eq("id", enr.user_id).single();
    let display = "A Father";
    if (profile?.full_name) {
      const parts = String(profile.full_name).trim().split(/\s+/);
      display = parts.length > 1
        ? `${parts[0]} ${parts[parts.length - 1][0]}.`
        : parts[0];
    }

    // ---- mint + issue ----
    // Engine verticals: resolve the signing authority and serial prefix.
    // NCF is the default in every case (docs/ENGINE.md).
    let sigName = "Dr. Ken Canfield";
    let sigTitle = "Founder, National Center for Fathering";
    let certPrefix = "FC";
    let verticalSlug = null;
    if (course.vertical_id) {
      const { data: vert } = await sb.from("platform_verticals")
        .select("slug, cert_prefix, authority_name, authority_title")
        .eq("id", course.vertical_id).maybeSingle();
      if (vert) {
        certPrefix = vert.cert_prefix || certPrefix;
        sigName = vert.authority_name || sigName;
        sigTitle = vert.authority_title || sigTitle;
        verticalSlug = vert.slug || null;
      }
    }
    const serial = await mintSerial(sb, certPrefix);
    const { data: cert, error: certErr } = await sb.from("certificates").insert({
      serial,
      enrollment_id: enr.id,
      recipient_display: display,
      course_title: course.title,
      hours: course.hours,
      signatory_name: sigName,
      signatory_title: sigTitle,
      vertical_slug: verticalSlug,
    }).select().single();
    if (certErr) throw certErr;

    await sb.from("certificate_enrollments").update({ status: "issued" }).eq("id", enr.id);

    return json(req, {
      ok: true,
      serial: cert.serial,
      recipient: display,
      course: course.title,
      hours: course.hours,
      signatory: sigName,
    });

  } catch (e) {
    return json(req, { error: String(e?.message ?? e) }, 500);
  }
});
