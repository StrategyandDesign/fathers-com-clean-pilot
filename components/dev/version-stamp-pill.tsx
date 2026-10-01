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
        className="fixed start-3 top-1 z-50 rounded-full border border-border bg-card/95 px-3 py-1 text-xs text-muted-foreground shadow-sm print:hidden"
        aria-label={`Show ${label}`}
        onClick={() => persist(true)}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center gap-3 border-b border-border bg-card px-3 py-1.5 text-xs text-muted-foreground print:hidden">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="shrink-0 font-medium text-foreground"
      >
        {label}
      </a>
      {title ? <p className="min-w-0 flex-1 truncate">{title}</p> : null}
      <button
        type="button"
        className="shrink-0 text-xs text-muted-foreground underline underline-offset-2"
        onClick={() => persist(false)}
      >
        Minimize
      </button>
    </div>
  );
}
