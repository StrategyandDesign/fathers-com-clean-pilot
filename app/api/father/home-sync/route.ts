import { NextResponse } from "next/server";

import { getAuthContext } from "@/lib/auth/session";
import { loadFatherHomeSyncVersion } from "@/lib/father/home-sync-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, role } = await getAuthContext();
  if (!user || role !== "father") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const version = await loadFatherHomeSyncVersion(user.id);
  return NextResponse.json(
    { version },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
