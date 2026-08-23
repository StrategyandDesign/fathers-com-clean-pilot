import { redirect } from "next/navigation";

import { getAuthContext } from "@/lib/auth/session";
import { allowRequestRateLimit } from "@/lib/security/rate-limit";
import { armedForcesPackDownload } from "@/lib/verticals/armed-forces/artifacts";
import { isArmedForcesPackSlug } from "@/lib/verticals/armed-forces/pack";

export const runtime = "nodejs";

function fail(message: string): never {
  redirect(`/admin/verticals/armed-forces?error=${encodeURIComponent(message)}`);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { user, role, deactivated } = await getAuthContext();
  if (!user || deactivated || role !== "admin") {
    redirect("/login");
  }

  if (!allowRequestRateLimit("armed_forces.pack_download", request)) {
    fail("Too many downloads. Try again in a few minutes.");
  }

  const { slug } = await context.params;
  if (!isArmedForcesPackSlug(slug)) {
    fail("That Armed Forces pack file was not found.");
  }

  const file = armedForcesPackDownload(slug);
  if (!file) {
    fail("That Armed Forces pack file was not found.");
  }

  return new Response(file.body, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${file.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
