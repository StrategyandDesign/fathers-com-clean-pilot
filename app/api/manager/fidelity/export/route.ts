import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { ensureFidelityBoard, loadFidelityTargets, resolveFidelityTarget } from "@/lib/fidelity/data";
import { fidelityExportFilename, fidelitySummaryCsv } from "@/lib/fidelity/export";
import { fidelityBoardEnabled } from "@/lib/flags";
import { allowRequestRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { user } = await requireRole("manager");
  if (!fidelityBoardEnabled()) {
    redirect("/manager/fidelity");
  }
  if (!allowRequestRateLimit("manager.fidelity_export", request)) {
    redirect("/manager/fidelity?error=Too%20many%20downloads.%20Try%20again%20in%20a%20few%20minutes.");
  }

  const url = new URL(request.url);
  const targetId = (url.searchParams.get("target") ?? "").trim();
  const groupQuery = url.searchParams.get("group");
  const targets = targetId
    ? [targetId]
    : (await loadFidelityTargets(user.id)).map((row) => row.id);

  const boards = [];
  for (const id of targets) {
    const resolved = await resolveFidelityTarget(user.id, id, groupQuery);
    if (!resolved) continue;
    const board = await ensureFidelityBoard({
      managerId: user.id,
      groupId: resolved.groupId,
      trainingId: resolved.trainingId,
    });
    if (!board) continue;
    boards.push(board);
  }
  if (boards.length === 0) {
    redirect("/manager/fidelity?error=Nothing%20to%20export%20yet.");
  }

  const csv = boards
    .map((board) =>
      fidelitySummaryCsv({
        groupId: board.groupId,
        groupName: board.groupName,
        trainingId: board.trainingId ?? "",
        trainingTitle: board.trainingTitle,
        items: board.items.map((item) => ({
          itemKey: item.itemKey,
          section: item.section,
          prompt: item.prompt,
          completedBy: item.completedByName,
          completedAt: item.completedAt ?? "",
          notes: item.notes,
        })),
      })
    )
    .join("");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fidelityExportFilename()}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
