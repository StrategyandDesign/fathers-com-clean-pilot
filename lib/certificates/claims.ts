import { createClient, type createClient as createClientType } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClientType>>;

export async function resolveFatherClaimId(
  supabase: ServerClient,
  fatherId: string
): Promise<string | null> {
  const { data, error } = await supabase.rpc("ensure_participant_claim", {
    p_father_id: fatherId,
  });

  if (error) {
    console.error("[certificates.claim] ensure failed", error.message);
    return null;
  }

  if (typeof data === "string" && data.trim()) return data;
  if (Array.isArray(data) && typeof data[0] === "string") return data[0];
  return null;
}

/** Active claimed seats for these fathers. `ok: false` means the check did not load. */
export async function loadActiveClaimFatherIds(fatherIds: string[]) {
  const ids = [...new Set(fatherIds.filter(Boolean))];
  if (ids.length === 0) return { ok: true as const, ids: new Set<string>() };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("participant_claims")
    .select("father_id")
    .in("father_id", ids)
    .eq("status", "active");

  if (error) {
    console.error("[certificates.claim] roster failed", error.message);
    return { ok: false as const, ids: new Set<string>() };
  }

  return {
    ok: true as const,
    ids: new Set((data ?? []).map((row) => row.father_id).filter((id): id is string => Boolean(id))),
  };
}
