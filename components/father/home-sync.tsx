"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  isDeskEditingTarget,
  shouldHoldDeskRefresh,
  shouldRefreshDesk,
} from "@/lib/manager/desk-sync";
import { HOME_SYNC_INTERVAL_MS, HOME_SYNC_PATH } from "@/lib/father/home-sync";

/** Keep Father Home in step when a leader posts or swaps an update. */
export function FatherHomeSync() {
  const router = useRouter();

  useEffect(() => {
    let current: string | null = null;
    let cancelled = false;

    const tick = async () => {
      if (document.hidden) return;
      const editing = isDeskEditingTarget(document.activeElement);

      try {
        const response = await fetch(HOME_SYNC_PATH, { cache: "no-store" });
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as { version?: string };
        if (typeof data.version !== "string" || !data.version) return;
        if (
          shouldRefreshDesk(current, data.version) &&
          !shouldHoldDeskRefresh({ hidden: false, editing })
        ) {
          router.refresh();
        }
        if (!editing || !current) current = data.version;
      } catch {
        /* Next may still be starting */
      }
    };

    void tick();
    const id = window.setInterval(tick, HOME_SYNC_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  return null;
}
