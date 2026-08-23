import { redirect } from "next/navigation";

import { getAuthContext } from "@/lib/auth/session";
import { allowRequestRateLimit } from "@/lib/security/rate-limit";
import { trustPackDownload } from "@/lib/trust/artifacts";
import { isTrustPackSlug } from "@/lib/trust/pack";

export const runtime = "nodejs";

function fail(message: string): never {
  redirect(`/admin/trust?error=${encodeURIComponent(message)}`);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { user, role, deactivated } = await getAuthContext();
  if (!user || deactivated || role !== "admin") {
    redirect("/login");
  }

  if (!allowRequestRateLimit("trust.pack_download", request)) {
    fail("Too many downloads. Try again in a few minutes.");
  }

  const { slug } = await context.params;
  if (!isTrustPackSlug(slug)) {
    fail("That security questionnaire file was not found.");
  }

  const file = trustPackDownload(slug);
  if (!file) {
    fail("That security questionnaire file was not found.");
  }

  return new Response(file.body, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${file.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
