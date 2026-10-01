"use client";

import { useState } from "react";

import { SessionAdvanceButton } from "@/components/father/session-advance-button";
import { SessionFilmPlayer } from "@/components/father/session-film-player";
import { filmWatchUnlocksCheckpoint } from "@/lib/father/film-seat";

export function FilmSeat({
  action,
  sessionId,
  title,
  keyline,
  videoUrl,
  coverSrc,
  resumeSeconds,
  durationSeconds,
  continueLabel,
  lockedLabel,
  unmeasuredLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  sessionId: string;
  title: string;
  keyline?: string | null;
  videoUrl: string | null;
  coverSrc: string;
  resumeSeconds: number;
  durationSeconds?: number | null;
  continueLabel: string;
  lockedLabel: string;
  unmeasuredLabel: string;
}) {
  const [seconds, setSeconds] = useState(Math.max(0, Math.floor(resumeSeconds)));
  const measured = typeof durationSeconds === "number" && durationSeconds > 0;
  const unlocked = filmWatchUnlocksCheckpoint(seconds, durationSeconds);

  return (
    <div className="space-y-4">
      <SessionFilmPlayer
        session={{ title, video_url: videoUrl }}
        coverSrc={coverSrc}
        keyline={keyline}
        resumeSeconds={resumeSeconds}
        persistSessionId={sessionId}
        onSeconds={setSeconds}
      />
      <form action={action} className="mx-auto max-w-lg space-y-3 text-center">
        <input type="hidden" name="session_id" value={sessionId} />
        <input type="hidden" name="watched_seconds" value={String(seconds)} />
        {unlocked ? (
          <SessionAdvanceButton label={continueLabel} />
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {measured ? lockedLabel : unmeasuredLabel}
          </p>
        )}
      </form>
    </div>
  );
}
