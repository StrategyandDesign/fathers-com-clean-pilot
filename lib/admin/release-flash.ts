export type ReleaseFlashAudience = "managers" | "Leaders";

export function releaseFlashNotice(input: {
  scope: string;
  targetCount: number;
  newCount: number;
  notified: boolean;
  notifyFailed: boolean;
  alreadyHave: string;
  audience: ReleaseFlashAudience;
}): string {
  if (input.targetCount === 0) {
    return "No matching organizations to release to.";
  }
  if (input.newCount === 0) {
    return input.alreadyHave;
  }

  const claimNotify = !input.notifyFailed;
  const one = input.audience === "managers" ? "manager" : "Leader";

  if (input.scope === "selected") {
    if (input.newCount === 1) {
      return claimNotify
        ? `Released to 1 organization. That ${one} was notified.`
        : "Released to 1 organization.";
    }
    return claimNotify
      ? `Released to ${input.newCount} organizations. Eligible ${input.audience} were notified.`
      : `Released to ${input.newCount} organizations.`;
  }

  return claimNotify && input.notified
    ? `Released to all organizations. Eligible ${input.audience} were notified.`
    : "Released to all organizations.";
}
