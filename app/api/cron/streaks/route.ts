import { NextResponse } from "next/server";

import { evaluateClosedStreaks } from "@/lib/father/streak-admin";
import { cronAuthorized } from "@/lib/security/cron-auth";

export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await evaluateClosedStreaks();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[cron] streaks failed", error);
    return NextResponse.json({ ok: false, error: "evaluate_failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
