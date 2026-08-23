import { redirect } from "next/navigation";

import { getAuthContext } from "@/lib/auth/session";
import { allowRequestRateLimit } from "@/lib/security/rate-limit";
import { optimizationPackDownload } from "@/lib/verticals/optimization/artifacts";
import { isOptimizationPackSlug } from "@/lib/verticals/optimization/pack";

export const runtime = "nodejs";

function fail(message: string): never {
  redirect(`/admin/verticals/optimization?error=${encodeURIComponent(message)}`);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { user, role, deactivated } = await getAuthContext();
  if (!user || deactivated || role !== "admin") {
    redirect("/login");
  }

  if (!allowRequestRateLimit("optimization.pack_download", request)) {
    fail("Too many downloads. Try again in a few minutes.");
  }

  const { slug } = await context.params;
  if (!isOptimizationPackSlug(slug)) {
    fail("That bonded-group pack file was not found.");
  }

  const file = optimizationPackDownload(slug);
  if (!file) {
    fail("That bonded-group pack file was not found.");
  }

  return new Response(file.body, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${file.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
