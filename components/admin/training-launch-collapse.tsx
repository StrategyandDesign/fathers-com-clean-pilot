"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { launchDeskStartsOpen, launchDeskStorageKey } from "@/lib/admin/launch";
import { cn } from "@/lib/utils";

export function TrainingLaunchCollapse({
  trainingId,
  surface = "detail",
  title,
  nowLabel,
  children,
}: {
  trainingId: string;
  surface?: "detail" | "stage";
  title: string;
  nowLabel: string;
  children: ReactNode;
}) {
  const panelId = useId();
  const storageKey = launchDeskStorageKey(trainingId);
  const [open, setOpen] = useState(() => surface === "stage");

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(storageKey);
    } catch {
      stored = null;
    }
    setOpen(launchDeskStartsOpen(stored, window.location.hash, surface));
  }, [storageKey, surface]);

  function toggle() {
    const next = !open;
    setOpen(next);
    try {
      window.localStorage.setItem(storageKey, next ? "1" : "0");
    } catch {
      // Private mode can block storage. The click still toggles this visit.
    }
  }

  return (
    <section
      id="launch"
      className={cn(
        "scroll-mt-[calc(4.5rem+env(safe-area-inset-top))] rounded-xl border border-primary/40 bg-card",
        open ? "space-y-4 p-4 sm:p-6" : "px-4 py-3 sm:px-6"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {surface === "stage" ? (
            <>
              <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                Launch
              </p>
              <h2 className="mt-1 font-heading text-lg font-semibold">{title}</h2>
            </>
          ) : (
            <h2 className="font-heading text-lg font-semibold">{title}</h2>
          )}
          {!open ? <p className="mt-1 text-sm text-muted-foreground">{nowLabel}</p> : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={toggle}
        >
          {open ? "Minimize" : "Show Launch"}
        </Button>
      </div>
      {open ? (
        <div id={panelId} className="space-y-4">
          {children}
        </div>
      ) : null}
    </section>
  );
}
