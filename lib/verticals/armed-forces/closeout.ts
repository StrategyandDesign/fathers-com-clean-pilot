import { summarizeReport, type ReportRow, type ReportSummary } from "@/lib/manager/reports";

export const CLOSEOUT_PRESET = "closeout";

export type EventCloseout = ReportSummary & {
  organization: string;
  generatedAt: string;
  sessionsCompleted: number;
  certificatesIssued: number;
};

export function buildEventCloseout(
  rows: ReportRow[],
  options: { organization?: string; generatedAt?: string } = {}
): EventCloseout {
  const summary = summarizeReport(rows);
  return {
    ...summary,
    organization: options.organization?.trim() || "Your organization",
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    sessionsCompleted: rows.reduce((sum, row) => sum + row.sessionsCompleted, 0),
    certificatesIssued: rows.filter((row) => row.certificateSerial).length,
  };
}

function csvCell(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function eventCloseoutCsv(closeout: EventCloseout) {
  const notes = [
    "# Fathers.com event closeout",
    "# Attendance and completion aggregates only",
    "# Not counseling content",
    "# Not a clinical chart",
    `# Organization: ${closeout.organization}`,
    `# Generated: ${closeout.generatedAt}`,
  ];
  const header = [
    "Organization",
    "Generated at UTC",
    "Men",
    "Assignment rows",
    "Trainings completed",
    "Trainings in progress",
    "Trainings not started",
    "Sessions completed",
    "Certificates issued",
  ];
  const values = [
    closeout.organization,
    closeout.generatedAt,
    String(closeout.men),
    String(closeout.rows),
    String(closeout.completed),
    String(closeout.inProgress),
    String(closeout.notStarted),
    String(closeout.sessionsCompleted),
    String(closeout.certificatesIssued),
  ];
  return `\uFEFF${[...notes, header.map(csvCell).join(","), values.map(csvCell).join(",")].join("\r\n")}\r\n`;
}

export function eventCloseoutPrintable(closeout: EventCloseout) {
  return [
    "# Event closeout",
    "",
    "Attendance and completion aggregates only. Not counseling content. Not a clinical chart.",
    "",
    `- Organization: ${closeout.organization}`,
    `- Generated: ${closeout.generatedAt}`,
    `- Men: ${closeout.men}`,
    `- Assignment rows: ${closeout.rows}`,
    `- Trainings completed: ${closeout.completed}`,
    `- Trainings in progress: ${closeout.inProgress}`,
    `- Trainings not started: ${closeout.notStarted}`,
    `- Sessions completed: ${closeout.sessionsCompleted}`,
    `- Certificates issued: ${closeout.certificatesIssued}`,
    "",
  ].join("\n");
}

export function eventCloseoutFilename(format: "csv" | "print") {
  const day = new Date().toISOString().slice(0, 10);
  return format === "csv"
    ? `fathers-com-event-closeout-${day}.csv`
    : `fathers-com-event-closeout-${day}.md`;
}

export function isCloseoutPreset(value: unknown) {
  return value === CLOSEOUT_PRESET;
}
