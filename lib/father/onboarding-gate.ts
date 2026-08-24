import { redirect } from "next/navigation";

import { loadOnboardingState } from "@/lib/father/onboarding-data";
import { fatherOnboardingRedirect, isOnboardingActive } from "@/lib/father/onboarding";

export async function gateFatherOnboarding(fatherId: string, pathname: string) {
  const state = await loadOnboardingState(fatherId);
  const active = isOnboardingActive(state.mode, state.step);
  const next = fatherOnboardingRedirect({
    pathname,
    active,
    step: state.step,
    firstSessionId: state.firstSessionId,
  });
  if (next) redirect(next);
  return { active };
}
