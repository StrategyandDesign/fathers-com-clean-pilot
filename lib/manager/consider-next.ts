import {
  buildQuietSuggestion,
  practiceSkipped,
  readyCertificateTitle,
  type CompanionCopy,
  type CompanionNudgeBlock,
  type QuietSuggestion,
} from "@/lib/manager/companion";
import { daysSince, needsNudge, type NudgeLogRow, type NudgeTemplateKey } from "@/lib/manager/nudges";
import type { AttentionItem, ParticipantRow, TrainingProgress } from "@/lib/manager/types";

export const CONSIDER_NEXT_KINDS = [
  "cert_ready",
  "assessment_stalled",
  "practice_skipped",
  "quiet",
  "open_item",
] as const;

export type ConsiderNextKind = (typeof CONSIDER_NEXT_KINDS)[number];

export type ConsiderNextAction = "nudge" | "issue_certificate" | "open_participant";

export type AssessmentStall = {
  fatherId: string;
  title: string;
};

export type ConsiderNextSignals = {
  certReady: boolean;
  assessmentStalled: boolean;
  practiceSkipped: boolean;
  quiet: boolean;
  openItem: boolean;
};

export type ConsiderNextRow = {
  fatherId: string;
  name: string;
  kind: ConsiderNextKind;
  action: ConsiderNextAction;
  reason: CompanionCopy;
  attentionReason?: string;
  score: number;
  trainingId?: string;
  trainingTitle?: string;
  template: NudgeTemplateKey;
  whyTemplate: CompanionCopy;
  canNudge: boolean;
  block: CompanionNudgeBlock;
  cooldownDays: number;
};

export const CONSIDER_NEXT_KIND_WEIGHT: Record<ConsiderNextKind, number> = {
  cert_ready: 40,
  assessment_stalled: 28,
  practice_skipped: 20,
  quiet: 12,
  open_item: 6,
};

export function pickConsiderNextKind(signals: ConsiderNextSignals): ConsiderNextKind | null {
  if (signals.certReady) return "cert_ready";
  if (signals.assessmentStalled) return "assessment_stalled";
  if (signals.practiceSkipped) return "practice_skipped";
  if (signals.quiet) return "quiet";
  if (signals.openItem) return "open_item";
  return null;
}

export function considerNextScore(kind: ConsiderNextKind, daysQuiet: number) {
  const days = Number.isFinite(daysQuiet) ? Math.min(Math.max(daysQuiet, 0), 99) : 99;
  return CONSIDER_NEXT_KIND_WEIGHT[kind] * 100 + days;
}

export function readyCertificateCard(cards: TrainingProgress[]) {
  return (
    cards.find((row) => row.total > 0 && row.completed === row.total && !row.certificate) ?? null
  );
}

export function considerNextDaysQuiet(lastActivity: string | null | undefined) {
  return Number.isFinite(daysSince(lastActivity)) ? daysSince(lastActivity) : 99;
}

function preferredOpenItem(items: AttentionItem[]) {
  return (
    items.find((item) => item.reason.startsWith("Session in progress: ")) ??
    items.find((item) => item.reason === "No training assigned") ??
    items.find((item) => !item.reason.startsWith("Ready for certificate: ")) ??
    null
  );
}

function assessmentReason(
  stallTitle: string | undefined,
  keystoneStalled: boolean
): CompanionCopy | null {
  if (stallTitle) {
    return { key: "manager.considerNext.reasonAssessment", vars: { title: stallTitle } };
  }
  if (keystoneStalled) {
    return { key: "manager.considerNext.reasonKeystone" };
  }
  return null;
}

function actionFor(kind: ConsiderNextKind): ConsiderNextAction {
  if (kind === "cert_ready") return "issue_certificate";
  if (kind === "open_item") return "open_participant";
  return "nudge";
}

function rowFromSuggestion(
  suggestion: QuietSuggestion,
  kind: ConsiderNextKind,
  reason: CompanionCopy,
  extras: Pick<ConsiderNextRow, "attentionReason" | "trainingId" | "trainingTitle"> = {}
): ConsiderNextRow {
  return {
    fatherId: suggestion.fatherId,
    name: suggestion.name,
    kind,
    action: actionFor(kind),
    reason,
    score: considerNextScore(kind, suggestion.daysQuiet),
    template: suggestion.template,
    whyTemplate: suggestion.whyTemplate,
    canNudge: suggestion.canNudge,
    block: suggestion.block,
    cooldownDays: suggestion.cooldownDays,
    ...extras,
  };
}

export function buildConsiderNext(input: {
  participants: ParticipantRow[];
  trainingProgressFor: (fatherId: string) => TrainingProgress[];
  historyByFather: Map<string, NudgeLogRow[]>;
  reminderPrefs: Map<string, boolean | null>;
  historyUnavailable: boolean;
  assessmentStalls?: AssessmentStall[];
  openItems?: AttentionItem[];
  limit?: number;
}): ConsiderNextRow[] {
  const stallsByFather = new Map<string, string>();
  for (const stall of input.assessmentStalls ?? []) {
    if (!stallsByFather.has(stall.fatherId) && stall.title.trim()) {
      stallsByFather.set(stall.fatherId, stall.title.trim());
    }
  }

  const openByFather = new Map<string, AttentionItem[]>();
  for (const item of input.openItems ?? []) {
    const list = openByFather.get(item.fatherId) ?? [];
    list.push(item);
    openByFather.set(item.fatherId, list);
  }

  const rows: ConsiderNextRow[] = [];

  for (const participant of input.participants) {
    const cards = input.trainingProgressFor(participant.fatherId);
    const certCard = readyCertificateCard(cards);
    const stallTitle = stallsByFather.get(participant.fatherId);
    const keystoneStalled = participant.profileStatus === "in_progress";
    const openItem = preferredOpenItem(openByFather.get(participant.fatherId) ?? []);
    const kind = pickConsiderNextKind({
      certReady: Boolean(certCard) || Boolean(readyCertificateTitle(cards)),
      assessmentStalled: Boolean(stallTitle) || keystoneStalled,
      practiceSkipped: practiceSkipped(cards),
      quiet: needsNudge(participant.lastActivity, cards),
      openItem: Boolean(openItem),
    });
    if (!kind) continue;

    const suggestion = buildQuietSuggestion(
      participant,
      cards,
      input.historyByFather.get(participant.fatherId) ?? [],
      input.reminderPrefs.get(participant.fatherId) ?? null,
      input.historyUnavailable
    );

    if (kind === "cert_ready" && certCard) {
      rows.push(
        rowFromSuggestion(
          suggestion,
          kind,
          {
            key: "manager.considerNext.reasonCert",
            vars: { title: certCard.training.title },
          },
          {
            trainingId: certCard.training.id,
            trainingTitle: certCard.training.title,
          }
        )
      );
      continue;
    }

    if (kind === "assessment_stalled") {
      const reason = assessmentReason(stallTitle, keystoneStalled);
      if (reason) {
        rows.push(rowFromSuggestion(suggestion, kind, reason));
        continue;
      }
    }

    if (kind === "practice_skipped") {
      rows.push(
        rowFromSuggestion(suggestion, kind, { key: "manager.companion.reasonPracticeSkipped" })
      );
      continue;
    }

    if (kind === "quiet") {
      rows.push(rowFromSuggestion(suggestion, kind, suggestion.reason));
      continue;
    }

    if (kind === "open_item" && openItem) {
      rows.push(
        rowFromSuggestion(
          suggestion,
          kind,
          { key: "manager.considerNext.reasonOpen" },
          { attentionReason: openItem.reason }
        )
      );
    }
  }

  return rows
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.name.localeCompare(right.name);
    })
    .slice(0, input.limit ?? 8);
}

export function considerNextHistoryIds(
  participants: ParticipantRow[],
  trainingProgressFor: (fatherId: string) => TrainingProgress[],
  assessmentStalls: AssessmentStall[],
  openItems: AttentionItem[]
) {
  const ids = new Set<string>();
  for (const participant of participants) {
    const cards = trainingProgressFor(participant.fatherId);
    if (
      needsNudge(participant.lastActivity, cards) ||
      practiceSkipped(cards) ||
      Boolean(readyCertificateTitle(cards)) ||
      participant.profileStatus === "in_progress"
    ) {
      ids.add(participant.fatherId);
    }
  }
  for (const stall of assessmentStalls) ids.add(stall.fatherId);
  for (const item of openItems) ids.add(item.fatherId);
  return [...ids];
}
