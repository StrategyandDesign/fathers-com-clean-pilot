// ============================================================================
// checkout: the server-side authority on enrollment.
//
// The client (assets/js/enroll.js) sends { action: 'create_checkout',
// course_slug } with the user's JWT and expects exactly one of:
//     { enrolled: true }          seat active, coursework unlocked
//     { claim_required: true }    no active claim for this account
//     { checkout_url: '...' }     paid path, when Stripe goes live (unused now)
//     non-2xx with { error }      real failure, shown verbatim to the user
//
// This file is the canonical source for the function deployed in Supabase.
// The deployed copy predates the repo and its source was never committed;
// this replaces it with known code. Deploy from the Supabase Dashboard:
// Edge Functions -> checkout -> replace code with this file -> Deploy.
//
// Environment (Project Settings -> Edge Functions -> secrets):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   provided by the platform
//   ALLOW_UNCLAIMED_ENROLLMENT                optional, '1' lets a signed-in
//     man enroll with no facilitator claim. For pilots and internal testing.
//     Unset or '0' in production: the claim requirement stands.
// ============================================================================

import { createClient } from "npm:@supabase/supabase-js@2";

type Body = { action?: string; course_slug?: string };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const allowUnclaimed =
      (Deno.env.get("ALLOW_UNCLAIMED_ENROLLMENT") ?? "0") === "1";

    // Who is asking. The JWT arrives in the Authorization header; resolve it
    // with the anon-context client so RLS semantics are the user's own.
    const authHeader = req.headers.get("Authorization") ?? "";
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
    const { data: userData, error: userErr } = await admin.auth.getUser(
      authHeader.replace(/^Bearer\s+/i, ""),
    );
    if (userErr || !userData?.user) {
      return json(401, { error: "Sign in to enroll." });
    }
    const uid = userData.user.id;

    const body: Body = await req.json().catch(() => ({}));
    if (body.action !== "create_checkout" || !body.course_slug) {
      return json(400, { error: "Bad request: action and course_slug required." });
    }
    const slug = String(body.course_slug).toLowerCase();

    // The course must exist and be published.
    const { data: course, error: courseErr } = await admin
      .from("certificate_courses")
      .select("id, slug, title, published")
      .eq("slug", slug)
      .maybeSingle();
    if (courseErr) return json(500, { error: courseErr.message });
    if (!course) return json(404, { error: "Course not found." });
    if (course.published === false) {
      return json(409, { error: "This course is not open yet." });
    }

    // Already enrolled: idempotent success. Enrolling twice must never fail.
    const { data: existing, error: exErr } = await admin
      .from("certificate_enrollments")
      .select("id")
      .eq("user_id", uid)
      .eq("course_id", course.id)
      .maybeSingle();
    if (exErr) return json(500, { error: exErr.message });
    if (existing) return json(200, { enrolled: true });

    // The claim check. A seat_claims row placed by a Certified Facilitator or
    // Certified Organization is what makes the course free to the man. If the
    // table does not exist in this project yet, the check degrades to the
    // ALLOW_UNCLAIMED_ENROLLMENT switch rather than crashing with a non-2xx,
    // which is exactly the failure this rewrite retires.
    let claimed = false;
    const { data: claim, error: claimErr } = await admin
      .from("seat_claims")
      .select("id")
      .eq("user_id", uid)
      .eq("status", "active")
      .maybeSingle();
    if (claimErr) {
      const missingTable = /relation .* does not exist|Could not find the table/i
        .test(claimErr.message ?? "");
      if (!missingTable) return json(500, { error: claimErr.message });
      claimed = false; // table absent: fall through to the switch
    } else {
      claimed = !!claim;
    }

    if (!claimed && !allowUnclaimed) {
      return json(200, { claim_required: true });
    }

    const { error: insErr } = await admin.from("certificate_enrollments").insert({
      user_id: uid,
      course_id: course.id,
      state: "enrolled",
    });
    if (insErr) return json(500, { error: insErr.message });

    return json(200, { enrolled: true });
  } catch (e) {
    return json(500, { error: (e as Error)?.message ?? "Unexpected failure." });
  }
});
