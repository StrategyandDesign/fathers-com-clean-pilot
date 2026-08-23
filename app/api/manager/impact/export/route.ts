import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { resolveManagerExportLocale } from "@/lib/i18n/org-locale";
import { renderImpactPdf } from "@/lib/manager/impact-pdf";
import { impactFilename, loadManagerImpact } from "@/lib/manager/impact";
import { logServerError, publicErrorMessage } from "@/lib/security/public-error";
import { allowRequestRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

function fail(message: string): never {
  redirect(`/manager/impact?error=${encodeURIComponent(message)}`);
}

export async function GET(request: Request) {
  const { user } = await requireRole("manager");

  if (!allowRequestRateLimit("manager.impact_export", request)) {
    fail("Too many snapshot downloads. Try again in a few minutes.");
  }

  try {
    const locale = await resolveManagerExportLocale(user.id);
    const snapshot = await loadManagerImpact(user.id, locale);
    const bytes = await renderImpactPdf(snapshot, locale);
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${impactFilename()}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    logServerError("manager.impact_export", error);
    fail(publicErrorMessage(error, "Could not generate the snapshot PDF."));
  }
}
