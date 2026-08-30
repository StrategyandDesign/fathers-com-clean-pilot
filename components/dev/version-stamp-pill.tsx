"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "fathers.version-stamp";

export function VersionStampPill({
  label,
  title,
  href,
}: {
  label: string;
  title: string;
  href: string;
}) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY) === "0") setOpen(false);
    } catch {
      // Private mode can block storage. The pill still works for this visit.
    }
  }, []);

  function persist(next: boolean) {
    setOpen(next);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // The click still toggles this visit.
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className="fixed end-3 bottom-3 z-50 rounded-full border border-border bg-card/95 px-3 py-1 text-xs text-muted-foreground shadow-sm print:hidden"
        aria-label={`Show ${label}`}
        onClick={() => persist(true)}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="fixed end-3 bottom-3 z-50 max-w-[16rem] rounded-xl border border-border bg-card/95 px-3 py-2 text-xs text-muted-foreground shadow-sm print:hidden">
      <div className="flex items-start justify-between gap-2">
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-foreground"
        >
          {label}
        </a>
        <button
          type="button"
          className="shrink-0 text-xs text-muted-foreground underline underline-offset-2"
          onClick={() => persist(false)}
        >
          Minimize
        </button>
      </div>
      {title ? <p className="mt-1 leading-snug">{title}</p> : null}
    </div>
  );
}
