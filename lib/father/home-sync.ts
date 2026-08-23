/** Browser-safe helpers. Keep cookies and Supabase out of this file. */
export const HOME_SYNC_INTERVAL_MS = 2000;
export const HOME_SYNC_PATH = "/api/father/home-sync";

export type HomeSyncNote = {
  id: string;
  updated_at?: string | null;
};

export type HomeSyncDismissal = {
  note_id?: string | null;
  group_id?: string | null;
  dismissed_at?: string | null;
};

export function noteStamp(notes: HomeSyncNote[]) {
  return [...notes]
    .map((row) => `${row.id}:${row.updated_at ?? ""}`)
    .sort()
    .join(",");
}

export function dismissalStamp(rows: HomeSyncDismissal[]) {
  return [...rows]
    .map((row) => `${row.note_id ?? ""}:${row.group_id ?? ""}:${row.dismissed_at ?? ""}`)
    .sort()
    .join(",");
}

export function homeSyncVersion(input: {
  notes?: HomeSyncNote[];
  dismissals?: HomeSyncDismissal[];
  assignmentCount?: number;
  assignmentAt?: string | null;
  photoCount?: number;
  photoAt?: string | null;
}) {
  return [
    noteStamp(input.notes ?? []) || "none",
    dismissalStamp(input.dismissals ?? []) || "none",
    `${input.assignmentCount ?? 0}:${input.assignmentAt ?? ""}`,
    `${input.photoCount ?? 0}:${input.photoAt ?? ""}`,
  ].join("|");
}
