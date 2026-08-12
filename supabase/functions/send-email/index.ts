// Fathers.com : send-email edge function (Deno / Supabase)
// Deploy:  supabase functions deploy send-email
// Secrets (required):
//   RESEND_API_KEY              — Resend API key
//   INTERNAL_FUNCTION_SECRET    — shared secret for server-to-server / arbitrary html
//   SUPABASE_URL                — injected by platform
//   SUPABASE_ANON_KEY           — injected by platform (JWT validation)
//   SUPABASE_SERVICE_ROLE_KEY   — injected by platform (JWT validation fallback)
// Call:    POST { to, template, data }  (Bearer JWT or x-internal-secret)
//          POST { to, subject, html }   (INTERNAL_FUNCTION_SECRET only)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_TEMPLATES = new Set([
  "01-welcome",
  "02-weekly-plan",
  "03-missed-week",
  "04-gift-receipt",
  "05-gift-delivery",
  "06-renewal",
  "07-win-back",
  "08-certificate-issued",
  "09-leader-digest",
  "org-invite",
]);

const SUBJECTS: Record<string, string> = {
  "01-welcome": "Your baseline is saved.",
  "02-weekly-plan": "Week 3: show up on schedule.",
  "03-missed-week": "Week 4 is still on the table.",
  "04-gift-receipt": "Your gift is set for June 21.",
  "05-gift-delivery": "{{FROM_NAME}} sent you a year of Fathers.com.",
  "06-renewal": "Your membership renews March 4.",
  "07-win-back": "New class: Raising Teens.",
  "08-certificate-issued": "Your certificate is ready. Serial {{SERIAL}}.",
  "09-leader-digest": "Your Circle this week: {{WATCHED}} of {{TOTAL}} watched.",
  "org-invite": "You have a seat on Fathers.com.",
};

// Minimal inlined bodies for the two highest-frequency sends.
// For the full designs, load emails/*.html from Supabase Storage
// (bucket: email-templates) or paste them into this map.
const BODIES: Record<string, string> = {
  "03-missed-week": `<div style="font-family:Helvetica,Arial,sans-serif;background:#FFFFFF;padding:36px;border-radius:8px;max-width:600px">
<h1 style="font-family:Georgia,serif;font-size:26px;color:#141210;margin:0 0 14px">Week 4 is still on the table.</h1>
<p style="font-size:15px;color:#3a352e;line-height:1.6">You went quiet last week. It happens.</p>
<p style="font-size:15px;color:#3a352e;line-height:1.6">The plan does not care about perfect. It cares about next.</p>
<p style="font-size:15px;color:#3a352e;line-height:1.6">Week 4 takes 25 minutes total.</p>
<a href="{{PLAN_URL}}" style="display:inline-block;background:#E86A3C;color:#0A0A0A;padding:14px 26px;border-radius:6px;font-weight:bold;text-decoration:none">Pick it back up</a></div>`,
  "org-invite": `<div style="font-family:Helvetica,Arial,sans-serif;background:#FFFFFF;padding:36px;border-radius:8px;max-width:600px">
<h1 style="font-family:Helvetica,Arial,sans-serif;font-weight:600;font-size:25px;color:#141210;margin:0 0 14px">You have a seat on Fathers.com.</h1>
<p style="font-size:15px;color:#3a352e;line-height:1.6">{{ORG}} gave you a seat. Take your baseline, get your plan, and join your Circle.</p>
<a href="{{JOIN_URL}}" style="display:inline-block;background:#E86A3C;color:#0A0A0A;padding:14px 26px;border-radius:6px;font-weight:bold;text-decoration:none">Claim your seat</a></div>`,
  "01-welcome": `<div style="font-family:Helvetica,Arial,sans-serif;background:#FFFFFF;padding:36px;border-radius:8px;max-width:600px">
<h1 style="font-family:Georgia,serif;font-size:26px;color:#141210;margin:0 0 14px">Your baseline is saved.</h1>
<p style="font-size:15px;color:#3a352e;line-height:1.6">Presence Baseline: <b style="font-family:Courier,monospace">{{BASELINE}}</b></p>
<p style="font-size:15px;color:#3a352e;line-height:1.6">Week 1 is ready when you are. One lesson, two actions, 25 minutes total.</p>
<a href="{{PLAN_URL}}" style="display:inline-block;background:#E86A3C;color:#0A0A0A;padding:14px 26px;border-radius:6px;font-weight:bold;text-decoration:none">Start Week 1</a></div>`,
};

function fill(s: string, data: Record<string, string>): string {
  return s.replace(/{{(\w+)}}/g, (_, k) => data[k] ?? "");
}

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

function isEmail(to: unknown): to is string {
  return typeof to === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim());
}

async function callerAuthorized(req: Request): Promise<{ ok: true; internal: boolean } | { ok: false; status: number; error: string }> {
  const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET") ?? "";
  const presented = req.headers.get("x-internal-secret") ?? "";
  if (internalSecret && presented && presented === internalSecret) {
    return { ok: true, internal: true };
  }

  const auth = req.headers.get("Authorization") ?? "";
  const jwt = auth.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return { ok: false, status: 401, error: "Authorization Bearer JWT or x-internal-secret required" };

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (anon) {
    const client = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
    const { data, error } = await client.auth.getUser();
    if (!error && data?.user) return { ok: true, internal: false };
  }
  if (service) {
    const admin = createClient(url, service, { auth: { persistSession: false } });
    const { data, error } = await admin.auth.getUser(jwt);
    if (!error && data?.user) return { ok: true, internal: false };
  }
  return { ok: false, status: 401, error: "invalid session" };
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const authz = await callerAuthorized(req);
    if (!authz.ok) {
      return new Response(JSON.stringify({ error: authz.error }), {
        status: authz.status, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { to, template, data = {}, subject, html } = await req.json();
    if (!isEmail(to)) {
      return new Response(JSON.stringify({ error: "Missing or invalid 'to' email." }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const wantsArbitrary = (subject != null && subject !== "") || (html != null && html !== "");
    if (wantsArbitrary && !authz.internal) {
      return new Response(JSON.stringify({ error: "Arbitrary subject/html requires x-internal-secret" }), {
        status: 403, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    let finalSubject: string;
    let finalHtml: string;

    if (authz.internal && wantsArbitrary) {
      finalSubject = String(subject ?? fill(SUBJECTS[template] ?? "Fathers.com", data));
      finalHtml = String(html ?? fill(BODIES[template] ?? "", data));
    } else {
      if (!template || !ALLOWED_TEMPLATES.has(template)) {
        return new Response(JSON.stringify({ error: "template not allowlisted" }), {
          status: 400, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      finalSubject = fill(SUBJECTS[template] ?? "Fathers.com", data);
      finalHtml = fill(BODIES[template] ?? "", data);
      if (!finalHtml) {
        return new Response(JSON.stringify({ error: `No body for template '${template}'.` }), {
          status: 400, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    }

    if (!finalHtml) {
      return new Response(JSON.stringify({ error: "No email body." }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Fathers.com <plan@updates.fathers.com>",
        to: to.trim(),
        subject: finalSubject,
        html: finalHtml,
      }),
    });
    const out = await r.json();
    return new Response(JSON.stringify(out), {
      status: r.ok ? 200 : 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
