import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { loadCounselPackStatesForGroups } from "@/lib/counsel/data";
import { reportRedisclosureEnabled } from "@/lib/counsel/pack";
import { resolveManagerExportLocale } from "@/lib/i18n/org-locale";
import {
  loadManagerReport,
  parseReportSearchParams,
  reportQuery,
} from "@/lib/manager/reports";
import { buildQiPacketZip } from "@/lib/qi/packet";
import { loadQiPacketCredentials, loadQiPacketFidelityBoards } from "@/lib/qi/source";
import { qiPacketFilename } from "@/lib/qi/zip";
import { allowRequestRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

function fail(
  message: string,
  filters: ReturnType<typeof parseReportSearchParams>["filters"]
): never {
  const query = reportQuery(filters, { error: message });
  redirect(query ? `/manager/reports?${query}` : `/manager/reports?error=${encodeURIComponent(message)}`);
}

export async function GET(request: Request) {
  const { user } = await requireRole("manager");
  const url = new URL(request.url);
  const parsed = parseReportSearchParams({
    group_id: url.searchParams.get("group_id") ?? undefined,
    training_id: url.searchParams.get("training_id") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  });

  if (parsed.error) {
    fail(parsed.error, parsed.filters);
  }

  if (!allowRequestRateLimit("manager.qi_packet", request)) {
    fail("Too many downloads. Try again in a few minutes.", parsed.filters);
  }

  const report = await loadManagerReport(user.id, parsed.filters);
  if (report.error) {
    fail(report.error, parsed.filters);
  }

  const locale = await resolveManagerExportLocale(user.id);
  const counsel = await loadCounselPackStatesForGroups(report.groups);
  const scopedCounsel = parsed.filters.groupId
    ? counsel.filter((state) => state.groupId === parsed.filters.groupId)
    : counsel;
  const [boards, credentials] = await Promise.all([
    loadQiPacketFidelityBoards(user.id),
    loadQiPacketCredentials(user.id),
  ]);

  const bytes = buildQiPacketZip({
    rows: report.rows,
    organization: report.organization,
    filters: parsed.filters,
    trainings: report.trainings,
    groups: report.groups,
    locale,
    generatedAt: new Date().toISOString(),
    redisclosure: reportRedisclosureEnabled(scopedCounsel),
    boards,
    credentials,
  });

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${qiPacketFilename()}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
