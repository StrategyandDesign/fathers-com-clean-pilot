/**
 * Documented local completion-feed shape. The route serves this app only.
 * It does not call an external host.
 */

import { QI_SCOPE_LINE } from "@/lib/qi/dictionary";
import type { ReportRow } from "@/lib/manager/reports";

export const COMPLETION_FEED_SCHEMA = "fathers.com.completion_feed.v1";

export type CompletionFeedItem = {
  participant_id: string;
  training_id: string | null;
  training_title: string;
  completion_status: ReportRow["completionStatus"];
  sessions_completed: number;
  sessions_total: number;
  completed_at: string | null;
  certificate_serial: string;
};

export type CompletionFeedDocument = {
  schema: typeof COMPLETION_FEED_SCHEMA;
  scope: "completion_flags_only";
  includes_answer_text: false;
  includes_clinical_outcomes: false;
  generated_at: string;
  organization: string;
  destination_label: string;
  items: CompletionFeedItem[];
  note: string;
};

export function completionFeedItemsFromReport(rows: ReportRow[]): CompletionFeedItem[] {
  return rows.map((row) => ({
    participant_id: row.fatherId,
    training_id: row.trainingId,
    training_title: row.trainingTitle,
    completion_status: row.completionStatus,
    sessions_completed: row.sessionsCompleted,
    sessions_total: row.sessionsTotal,
    completed_at: row.completedAt,
    certificate_serial: row.certificateSerial,
  }));
}

export function buildCompletionFeedDocument(input: {
  organization: string;
  destinationLabel?: string;
  generatedAt?: string;
  items?: CompletionFeedItem[];
}): CompletionFeedDocument {
  return {
    schema: COMPLETION_FEED_SCHEMA,
    scope: "completion_flags_only",
    includes_answer_text: false,
    includes_clinical_outcomes: false,
    generated_at: input.generatedAt ?? new Date().toISOString(),
    organization: input.organization,
    destination_label: input.destinationLabel ?? "",
    items: input.items ?? [],
    note: `${QI_SCOPE_LINE} Read-only local API. This route does not call an outside host.`,
  };
}

