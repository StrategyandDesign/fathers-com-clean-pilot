import { redirect } from "next/navigation";

import { ROLE_HOME } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { loadOnboardingState } from "@/lib/father/onboarding-data";
import { onboardingHref } from "@/lib/father/onboarding";

export default async function FatherStartIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { user } = await requireRole("father");
  const state = await loadOnboardingState(user.id);
  if (state.mode === "done" || state.step === "done" || state.step === "session") {
    redirect(ROLE_HOME.father);
  }
  const href = onboardingHref(state.step);
  if (error) {
    redirect(`${href}?error=${encodeURIComponent(error)}`);
  }
  redirect(href);
}
