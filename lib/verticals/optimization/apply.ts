import { verticalPackOptimization } from "@/lib/flags";
import { parseOrganizationType } from "@/lib/organization-type";

/**
 * The env flag is global. Rehab organizations never receive this pack,
 * even when Super-admin turns the flag on for Performance desks.
 */
export function optimizationPackAppliesToOrg(orgType: unknown): boolean {
  if (!verticalPackOptimization()) return false;
  return parseOrganizationType(orgType) === "performance_optimization_group";
}

export function anyOptimizationPackApplies(orgTypes: readonly unknown[]): boolean {
  return orgTypes.some((type) => optimizationPackAppliesToOrg(type));
}

export function hideRehabParticipationLabel(orgType: unknown): boolean {
  return optimizationPackAppliesToOrg(orgType);
}
