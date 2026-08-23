import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

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
