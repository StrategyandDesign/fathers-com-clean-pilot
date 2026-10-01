/** Share of a measured film that opens the checkpoint. A tap is not a watch. */
export const FILM_UNLOCK_RATIO = 0.95;

export function filmWatchUnlocksCheckpoint(
  watchedSeconds: number,
  durationSeconds: number | null | undefined
) {
  if (durationSeconds == null || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return false;
  }
  if (!Number.isFinite(watchedSeconds) || watchedSeconds < 0) return false;
  return watchedSeconds / durationSeconds >= FILM_UNLOCK_RATIO;
}
