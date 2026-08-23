import { parseParticipationMode, type ParticipationMode } from "@/lib/participation";

export const ORGANIZATION_TYPES = [
  "rehab",
  "armed_forces_unit",
  "performance_optimization_group",
  "other",
] as const;

export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  rehab: "Rehab",
  armed_forces_unit: "Armed Forces Unit",
  performance_optimization_group: "Performance Optimization Group",
  other: "Other",
};

export type VerticalPack = "rehab" | "armed_forces" | "performance" | "none";

export type OrganizationFlagRecommendations = {
  participationMode: ParticipationMode;
  verticalPack: VerticalPack;
  recommendMilitarySurface: boolean;
  counselPackRequired: false;
};

export function isOrganizationType(value: unknown): value is OrganizationType {
  return (
    value === "rehab" ||
    value === "armed_forces_unit" ||
    value === "performance_optimization_group" ||
    value === "other"
  );
}

export function parseOrganizationType(value: unknown): OrganizationType | null {
  const raw = typeof value === "string" ? value.trim() : "";
  return isOrganizationType(raw) ? raw : null;
}

export function organizationTypeLabel(value: unknown): string | null {
  const type = parseOrganizationType(value);
  return type ? ORGANIZATION_TYPE_LABELS[type] : null;
}

export function recommendedParticipationMode(type: OrganizationType): ParticipationMode {
  return type === "other" ? "open" : "expected";
}

export function recommendedVerticalPack(type: OrganizationType): VerticalPack {
  if (type === "rehab") return "rehab";
  if (type === "armed_forces_unit") return "armed_forces";
  if (type === "performance_optimization_group") return "performance";
  return "none";
}

export function recommendedFlagsForType(type: OrganizationType): OrganizationFlagRecommendations {
  return {
    participationMode: recommendedParticipationMode(type),
    verticalPack: recommendedVerticalPack(type),
    recommendMilitarySurface: type === "armed_forces_unit",
    counselPackRequired: false,
  };
}

export function organizationInsertFields(type: OrganizationType) {
  return {
    organization_type: type,
    participation_mode: recommendedParticipationMode(type),
  };
}

export function nextParticipationModeForTypeChange(
  currentMode: unknown,
  previousType: unknown,
  nextType: OrganizationType
): ParticipationMode {
  const current = parseParticipationMode(currentMode);
  const previous = parseOrganizationType(previousType);
  const previousRecommended = previous ? recommendedParticipationMode(previous) : "unset";
  if (current === "unset" || current === previousRecommended) {
    return recommendedParticipationMode(nextType);
  }
  return current;
}

export function recommendedFlagSummary(type: OrganizationType): string {
  const flags = recommendedFlagsForType(type);
  const participation = flags.participationMode === "expected" ? "Expected" : "Open";
  if (flags.verticalPack === "rehab") {
    return `Recommended flags: ${participation} participation and the Rehab pack. Desk routes stay the same.`;
  }
  if (flags.verticalPack === "armed_forces") {
    return `Recommended flags: ${participation} participation and the Armed Forces pack. Desk routes stay the same.`;
  }
  if (flags.verticalPack === "performance") {
    return `Recommended flags: ${participation} participation and the Performance pack. Desk routes stay the same.`;
  }
  return `Recommended flags: ${participation} participation. Desk routes stay the same.`;
}

export function organizationTypeHint(type?: OrganizationType | null): string {
  if (type) return recommendedFlagSummary(type);
  return "This sets default flag recommendations only. Expected and Open participation stay a Leader choice. Desk routes stay the same.";
}
