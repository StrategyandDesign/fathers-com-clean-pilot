import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { loadCounselPackStatesForGroups } from "@/lib/counsel/data";
import { reportRedisclosureEnabled } from "@/lib/counsel/pack";
import { verticalPackArmedForces } from "@/lib/flags";
import { resolveManagerExportLocale } from "@/lib/i18n/org-locale";
import { allowRequestRateLimit } from "@/lib/security/rate-limit";
import { renderReportPdf } from "@/lib/manager/report-pdf";
import {
  loadManagerReport,
  parseReportSearchParams,
  reportFilename,
  reportQuery,
  rowsToCsv,
} from "@/lib/manager/reports";
import {
  buildEventCloseout,
  eventCloseoutCsv,
  eventCloseoutFilename,
  eventCloseoutPrintable,
  isCloseoutPreset,
} from "@/lib/verticals/armed-forces/closeout";

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

  const preset = (url.searchParams.get("preset") ?? "").trim().toLowerCase();
  const closeoutRequested = isCloseoutPreset(preset);
  if (preset && !closeoutRequested) {
    fail("Export preset must be closeout or empty.", parsed.filters);
  }
  if (closeoutRequested && !verticalPackArmedForces()) {
    fail("The event closeout preset is off.", parsed.filters);
  }

  const format = (url.searchParams.get("format") ?? "csv").trim().toLowerCase();
  const allowedFormats = closeoutRequested ? ["csv", "print"] : ["csv", "pdf"];
  if (!allowedFormats.includes(format)) {
    fail(
      closeoutRequested
        ? "Event closeout format must be csv or print."
        : "Export format must be csv or pdf.",
      parsed.filters
    );
  }

  if (!allowRequestRateLimit("manager.reports_export", request)) {
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
  const redisclosure = reportRedisclosureEnabled(scopedCounsel);

  const generatedAt = new Date().toISOString();

  if (closeoutRequested) {
    const closeout = buildEventCloseout(report.rows, {
      organization: report.organization,
      generatedAt,
    });
    if (format === "print") {
      return new Response(eventCloseoutPrintable(closeout), {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${eventCloseoutFilename("print")}"`,
          "Cache-Control": "private, no-store",
        },
      });
    }
    return new Response(eventCloseoutCsv(closeout), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${eventCloseoutFilename("csv")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  if (format === "csv") {
    return new Response(
      rowsToCsv(report.rows, locale, {
        generatedAt,
        organization: report.organization,
        filters: parsed.filters,
        trainings: report.trainings,
        groups: report.groups,
        redisclosure,
      }),
      {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${reportFilename("csv")}"`,
          "Cache-Control": "private, no-store",
        },
      }
    );
  }

  try {
    const bytes = await renderReportPdf(report.rows, parsed.filters, report.trainings, locale, {
      groups: report.groups,
      organization: report.organization,
      redisclosure,
    });
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${reportFilename("pdf")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    fail(error instanceof Error ? error.message : "Could not generate the PDF.", parsed.filters);
  }
}
