import { optimizationPackAppliesToOrg } from "@/lib/verticals/optimization/apply";

export type JoinPosture = "invite_code" | "invitation_only";

export function joinPostureForOrg(orgType: unknown): JoinPosture {
  return optimizationPackAppliesToOrg(orgType) ? "invitation_only" : "invite_code";
}

export function inviteCodeIsPublic(orgType: unknown): boolean {
  return joinPostureForOrg(orgType) !== "invitation_only";
}

export function signupRequiresInviteCode(): boolean {
  return true;
}
