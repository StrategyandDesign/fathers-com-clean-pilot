"use client";

import { useLayoutEffect } from "react";

export function AuthContinue({ next }: { next: string }) {
  useLayoutEffect(() => {
    window.location.replace(next);
  }, [next]);

  return (
    <noscript>
      <p>
        <a href={next}>Continue</a>
      </p>
    </noscript>
  );
}
