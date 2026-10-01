"use client";

import { useEffect, useRef, useState } from "react";

import { CoverPhoto } from "@/components/brand/cover";
import { useI18n } from "@/components/i18n/locale-provider";
import { saveFilmPosition } from "@/lib/father/actions";
import { youtubeEmbedUrl, type Session } from "@/lib/father/types";

const YT_ORIGINS = new Set([
  "https://www.youtube-nocookie.com",
  "https://www.youtube.com",
]);

function readCurrentTime(data: unknown) {
  if (!data || typeof data !== "object") return null;
  const info = (data as { info?: { currentTime?: unknown } }).info;
  const time = info?.currentTime;
  if (typeof time !== "number" || !Number.isFinite(time) || time < 0) return null;
  return Math.floor(time);
}

function shouldIgnoreTime(time: number, lastSaved: number, lastSeen: number | null) {
  // The embed can report 0 before it honors `start`. Do not wipe a resume point.
  return time === 0 && lastSaved > 0 && lastSeen == null;
}

export function SessionFilmPlayer({
  session,
  coverSrc,
  keyline,
  resumeSeconds = 0,
  persistSessionId,
  onSeconds,
}: {
  session: Pick<Session, "title" | "video_url">;
  coverSrc: string;
  keyline?: string | null;
  resumeSeconds?: number;
  persistSessionId?: string;
  onSeconds?: (seconds: number) => void;
}) {
  const { locale, t } = useI18n();
  const [playing, setPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastSeenRef = useRef<number | null>(null);
  const lastSavedRef = useRef(Math.max(0, Math.floor(resumeSeconds)));
  const persistIdRef = useRef(persistSessionId);
  const onSecondsRef = useRef(onSeconds);
  persistIdRef.current = persistSessionId;
  onSecondsRef.current = onSeconds;

  const line = keyline?.trim() ?? "";
  const canPlay = Boolean(youtubeEmbedUrl(session.video_url));
  const embed = playing
    ? youtubeEmbedUrl(session.video_url, {
        startSeconds: resumeSeconds,
        language: locale,
        hideChrome: true,
        autoplay: true,
      })
    : null;

  useEffect(() => {
    if (!embed || !persistSessionId) return;

    const iframe = iframeRef.current;
    if (!iframe) return;

    const handshake = () => {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "listening", id: 1, channel: "widget" }),
        "*"
      );
    };

    const persist = (seconds: number, keepalive: boolean) => {
      const sessionId = persistIdRef.current;
      if (!sessionId || seconds === lastSavedRef.current) return;
      lastSavedRef.current = seconds;
      if (keepalive) {
        void fetch("/api/session-progress/position", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId, seconds }),
          keepalive: true,
          credentials: "same-origin",
        });
        return;
      }
      void saveFilmPosition(sessionId, seconds);
    };

    const flush = (keepalive: boolean) => {
      const seen = lastSeenRef.current;
      if (seen == null) return;
      persist(seen, keepalive);
    };

    const onMessage = (event: MessageEvent) => {
      if (!YT_ORIGINS.has(event.origin)) return;
      let payload: unknown = event.data;
      if (typeof payload === "string") {
        try {
          payload = JSON.parse(payload);
        } catch {
          return;
        }
      }
      const time = readCurrentTime(payload);
      if (time == null) return;
      if (shouldIgnoreTime(time, lastSavedRef.current, lastSeenRef.current)) return;
      lastSeenRef.current = time;
      onSecondsRef.current?.(time);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush(true);
    };
    const onPageHide = () => flush(true);

    window.addEventListener("message", onMessage);
    iframe.addEventListener("load", handshake);
    handshake();
    const handshakeTimer = window.setInterval(handshake, 2000);
    const saveTimer = window.setInterval(() => flush(false), 2000);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.removeEventListener("message", onMessage);
      iframe.removeEventListener("load", handshake);
      window.clearInterval(handshakeTimer);
      window.clearInterval(saveTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [embed, persistSessionId]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-black">
      {playing && embed ? (
        <div className="relative aspect-video overflow-hidden">
          <iframe
            ref={iframeRef}
            className="absolute inset-x-0 top-[-3.25rem] h-[calc(100%+3.25rem)] w-full"
            src={embed}
            title={session.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      ) : (
        <div className="relative aspect-video">
          <CoverPhoto src={coverSrc} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/25" />
          <div className="absolute inset-x-0 bottom-0 space-y-1 p-4 text-white sm:p-5">
            <p className="font-heading text-2xl font-semibold leading-snug">{session.title}</p>
            {line ? <p className="text-sm leading-snug sm:text-base">{line}</p> : null}
          </div>
          {canPlay ? (
            <button
              type="button"
              className="absolute start-4 top-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
              onClick={() => setPlaying(true)}
            >
              {t("father.session.watchFilm")}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
