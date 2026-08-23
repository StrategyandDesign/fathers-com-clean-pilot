import { hideRehabParticipationLabel } from "@/lib/verticals/optimization/apply";

export const REHAB_PARTICIPATION_LABEL = "Rehab";

export const DEFAULT_PARTICIPATION_EXPECTED_HINT =
  "Rehab, Armed Forces Unit, or Performance Optimization Group where completion is expected.";

export const OPTIMIZATION_PARTICIPATION_EXPECTED_HINT =
  "Performance Optimization Group where completion is expected.";

export function participationExpectedHint(orgType: unknown): string {
  if (hideRehabParticipationLabel(orgType)) {
    return OPTIMIZATION_PARTICIPATION_EXPECTED_HINT;
  }
  return DEFAULT_PARTICIPATION_EXPECTED_HINT;
}

export function fatherChromeOmitsRehabLabel(orgType: unknown, text: string): boolean {
  if (!hideRehabParticipationLabel(orgType)) return false;
  return !text.includes(REHAB_PARTICIPATION_LABEL);
}

export function stripRehabParticipationLabel(text: string): string {
  return text
    .replace(/Rehab,\s*/g, "")
    .replace(/\s*,\s*Rehab\s*/g, "")
    .replace(/\s*or Rehab\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
