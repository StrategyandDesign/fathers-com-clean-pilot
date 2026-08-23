import { NextResponse } from "next/server";

import { dispatchDueReminders } from "@/lib/notifications/dispatch";
import { cronAuthorized } from "@/lib/security/cron-auth";

export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await dispatchDueReminders();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[cron] reminders failed", error);
    return NextResponse.json({ ok: false, error: "dispatch_failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
