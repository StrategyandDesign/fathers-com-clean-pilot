import { pilotShowTestContent } from "@/lib/flags";

export const HEBREW_PILOT_GROUP_NAME = "Hebrew Pilot Group";

const TEST_TRAINING_TITLE = /^test(\s+training)?(\s+\d+)?$/i;
const TEST_STAFF_MESSAGE = /^(test[!?.]|test\b.*did you receive)/i;
const MILITARY_UNIT_ORG = /^unit\s*8200$/i;

export function isPilotTestTrainingTitle(value: string | null | undefined) {
  const title = value?.trim() ?? "";
  return title.length > 0 && TEST_TRAINING_TITLE.test(title);
}

export function isPilotTestTraining(training: {
  title?: string | null;
  working_title?: string | null;
}) {
  return (
    isPilotTestTrainingTitle(training.title) ||
    isPilotTestTrainingTitle(training.working_title)
  );
}

export function isPilotTestStaffMessage(body: string | null | undefined) {
  const text = body?.trim() ?? "";
  return text.length > 0 && TEST_STAFF_MESSAGE.test(text);
}

export function neutralizePilotOrgName(name: string | null | undefined) {
  const trimmed = name?.trim() ?? "";
  if (!trimmed) return trimmed;
  if (pilotShowTestContent()) return trimmed;
  if (MILITARY_UNIT_ORG.test(trimmed)) return HEBREW_PILOT_GROUP_NAME;
  return trimmed;
}

export function hidePilotTestTraining(
  training: {
    title?: string | null;
    working_title?: string | null;
  },
  access: {
    hasProgress?: boolean;
    hasCertificate?: boolean;
  } = {}
) {
  if (pilotShowTestContent()) return false;
  if (access.hasProgress || access.hasCertificate) return false;
  return isPilotTestTraining(training);
}

export function hidePilotTestStaffMessage(body: string | null | undefined) {
  if (pilotShowTestContent()) return false;
  return isPilotTestStaffMessage(body);
}

export function showDeveloperIssueChrome() {
  return process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_SHOW_DEV_ISSUES === "1";
}
