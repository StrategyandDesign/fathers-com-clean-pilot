const LEADER_NOTE_MARKERS = [
  /leader notes?/i,
  /cohort notes?/i,
  /organization_cohort_notes/i,
  /desk notes?/i,
];

export function leaderNotesExportAllowed(): boolean {
  return false;
}

export function exportIncludesLeaderNotes(text: string): boolean {
  const header = text.split(/\r?\n/).slice(0, 40).join("\n");
  return LEADER_NOTE_MARKERS.some((pattern) => pattern.test(header) && /,\s*leader notes?/i.test(header));
}

export function exportAllowsAnswerDump(): boolean {
  return false;
}

export function exportIncludesAnswerDump(text: string): boolean {
  return /written answers?|answer payload|question text/i.test(text);
}
