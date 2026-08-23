import { lookupFeedDestinationByHash } from "@/lib/export/data";
import { buildCompletionFeedDocument, type CompletionFeedItem } from "@/lib/export/feed";
import { PUSH_NOT_ENABLED } from "@/lib/export/push";
import { hashExportToken } from "@/lib/export/token";
import { secureExportEnabled } from "@/lib/flags";
import { allowRequestRateLimit } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}

function readToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const bearer = header.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (bearer) return bearer;
  return new URL(request.url).searchParams.get("token")?.trim() ?? "";
}

export async function GET(request: Request) {
  if (!allowRequestRateLimit("export.completion_feed", request)) {
    return json({ error: "Too many requests." }, 429);
  }
  if (!secureExportEnabled()) {
    return json({ error: PUSH_NOT_ENABLED }, 403);
  }

  const token = readToken(request);
  if (!token) {
    return json({ error: "Provide a local feed token." }, 401);
  }

  const found = await lookupFeedDestinationByHash(hashExportToken(token));
  if (!found) {
    return json({ error: "That local feed token is not valid." }, 401);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("export_completion_feed_for_token", {
    token_hash: hashExportToken(token),
  });
  if (error) {
    return json(
      buildCompletionFeedDocument({
        organization: found.label || found.groupId,
        destinationLabel: found.label,
        items: [],
      })
    );
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const items = rows.map((row) => ({
    participant_id: String(row.participant_id ?? ""),
    training_id: row.training_id ? String(row.training_id) : null,
    training_title: String(row.training_title ?? ""),
    completion_status: "completed",
    sessions_completed: Number(row.sessions_completed ?? 0),
    sessions_total: Number(row.sessions_total ?? 0),
    completed_at: row.completed_at ? String(row.completed_at) : null,
    certificate_serial: String(row.certificate_serial ?? ""),
  })) satisfies CompletionFeedItem[];

  return json(
    buildCompletionFeedDocument({
      organization: String(rows[0]?.organization ?? found.label ?? found.groupId),
      destinationLabel: found.label,
      items,
    })
  );
}
