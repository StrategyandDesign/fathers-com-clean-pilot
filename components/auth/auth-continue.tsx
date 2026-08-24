"use client";

import { useLayoutEffect } from "react";

import { useT } from "@/components/i18n/locale-provider";
import { interactiveUnderlineClassName } from "@/lib/ui";

export function AuthContinue({ next }: { next: string }) {
  const t = useT();

  useLayoutEffect(() => {
    window.location.replace(next);
  }, [next]);

  return (
    <p className="text-center text-sm text-white/85">
      <a href={next} className={interactiveUnderlineClassName}>
        {t("common.continue")}
      </a>
    </p>
  );
}
