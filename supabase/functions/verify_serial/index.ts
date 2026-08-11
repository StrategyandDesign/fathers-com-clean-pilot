// verify_serial (AUDIT-V42 PL-7): the public registry answers through a
// rate-limited function instead of anonymous table reads, so names of men
// in recovery and reentry cohorts cannot be enumerated by script.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { preflight, json } from "../_shared/cors.ts";

serve(async (req) => {
  const pf = preflight(req); if (pf) return pf;
  let body: { serial?: string };
  try { body = await req.json(); } catch { return json({ error: "malformed body" }, 400); }
  const serial = (body.serial ?? "").trim().toUpperCase();
  if (!serial || serial.length > 24) return json({ error: "bad serial" }, 400);

  const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  const bucket = new Date(); bucket.setMinutes(0, 0, 0);
  const { data: hit } = await svc.from("verify_hits").select("hits").eq("ip", ip).eq("hour_bucket", bucket.toISOString()).maybeSingle();
  if ((hit?.hits ?? 0) >= 20) return json({ error: "rate limited", retry_after_minutes: 60 }, 429);
  await svc.from("verify_hits").upsert({ ip, hour_bucket: bucket.toISOString(), hits: (hit?.hits ?? 0) + 1 }, { onConflict: "ip,hour_bucket" });

  const { data } = await svc.from("public_certificates")
    .select("serial,status,recipient_display,course_title,issued_at,contact_hours,attestation_method,snapshot_independent_seconds")
    .eq("serial", serial).maybeSingle();
  return json({ data: data ?? null });
});
