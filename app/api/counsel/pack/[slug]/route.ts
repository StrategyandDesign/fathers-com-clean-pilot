import { redirect } from "next/navigation";

import { counselPackDownload } from "@/lib/counsel/artifacts";
import { isCounselPackSlug } from "@/lib/counsel/pack";
import { getAuthContext } from "@/lib/auth/session";
import { allowRequestRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

function fail(role: string | null, message: string): never {
  const home =
    role === "admin" ? "/admin/account/counsel" : role === "manager" ? "/manager/account/counsel" : "/login";
  redirect(`${home}?error=${encodeURIComponent(message)}`);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { user, role, deactivated } = await getAuthContext();
  if (!user || deactivated || (role !== "manager" && role !== "admin")) {
    redirect("/login");
  }

  if (!allowRequestRateLimit("counsel.pack_download", request)) {
    fail(role, "Too many downloads. Try again in a few minutes.");
  }

  const { slug } = await context.params;
  if (!isCounselPackSlug(slug)) {
    fail(role, "That counsel pack file was not found.");
  }

  const file = counselPackDownload(slug);
  if (!file) {
    fail(role, "That counsel pack file was not found.");
  }

  return new Response(file.body, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${file.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
