import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { loadFacilitatorRegistry } from "@/lib/fidelity/data";
import { facilitatorCredentialCsv, facilitatorExportFilename } from "@/lib/fidelity/export";
import { fidelityBoardEnabled } from "@/lib/flags";
import { allowRequestRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { user } = await requireRole("manager");
  if (!fidelityBoardEnabled()) {
    redirect("/manager/team/facilitators");
  }
  if (!allowRequestRateLimit("manager.facilitator_export", request)) {
    redirect("/manager/team/facilitators?error=Too%20many%20downloads.%20Try%20again%20in%20a%20few%20minutes.");
  }

  const rows = await loadFacilitatorRegistry(user.id);
  const csv = facilitatorCredentialCsv(
    rows.map((row) => ({
      orgId: row.orgId,
      orgName: row.orgName,
      userId: row.userId,
      name: row.name,
      status: row.status,
      earnedAt: row.earnedAt ?? "",
      evidencePath: row.evidencePath,
      attestedBy: row.attestedByName,
    }))
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${facilitatorExportFilename()}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
