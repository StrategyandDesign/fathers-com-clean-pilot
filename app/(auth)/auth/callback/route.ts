import { NextResponse } from "next/server";

import { ROLE_HOME, resolveRole, safeInternalPath } from "@/lib/auth/roles";
import { applySsoFirstLogin } from "@/lib/identity/provision";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeInternalPath(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=Could+not+finish+organization+sign-in.", url.origin)
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(error?.message || "Could not finish organization sign-in.")}`,
        url.origin
      )
    );
  }

  try {
    const result = await applySsoFirstLogin(data.user);
    if (result.revoked) {
      return NextResponse.redirect(
        new URL("/login?error=This+desk+access+has+been+revoked.", url.origin)
      );
    }
    const role = result.role ?? resolveRole(data.user);
    return NextResponse.redirect(new URL(next ?? ROLE_HOME[role], url.origin));
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Could not finish organization sign-in.";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, url.origin)
    );
  }
}
