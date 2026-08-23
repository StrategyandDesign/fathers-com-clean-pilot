import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  nextParticipationModeForTypeChange,
  organizationInsertFields,
  organizationTypeHint,
  organizationTypeLabel,
  parseOrganizationType,
  recommendedFlagsForType,
  recommendedFlagSummary,
  recommendedParticipationMode,
} from "../lib/organization-type";

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

describe("organization type taxonomy", () => {
  it("parses the four selectable types and rejects free text", () => {
    assert.equal(parseOrganizationType("rehab"), "rehab");
    assert.equal(parseOrganizationType("armed_forces_unit"), "armed_forces_unit");
    assert.equal(parseOrganizationType("performance_optimization_group"), "performance_optimization_group");
    assert.equal(parseOrganizationType("other"), "other");
    assert.equal(parseOrganizationType("Rehab house"), null);
    assert.equal(parseOrganizationType(""), null);
    assert.equal(parseOrganizationType(null), null);
  });

  it("spells labels out plainly", () => {
    assert.equal(organizationTypeLabel("rehab"), "Rehab");
    assert.equal(organizationTypeLabel("armed_forces_unit"), "Armed Forces Unit");
    assert.equal(
      organizationTypeLabel("performance_optimization_group"),
      "Performance Optimization Group"
    );
    assert.equal(organizationTypeLabel("other"), "Other");
    assert.equal(organizationTypeLabel(null), null);
  });

  it("recommends Expected participation for the three named rooms", () => {
    assert.equal(recommendedParticipationMode("rehab"), "expected");
    assert.equal(recommendedParticipationMode("armed_forces_unit"), "expected");
    assert.equal(recommendedParticipationMode("performance_optimization_group"), "expected");
    assert.equal(recommendedParticipationMode("other"), "open");
  });

  it("maps type to vertical-pack flag recommendations without a second spine", () => {
    assert.deepEqual(recommendedFlagsForType("rehab"), {
      participationMode: "expected",
      verticalPack: "rehab",
      recommendMilitarySurface: false,
      counselPackRequired: false,
      leaderAssessmentAnswers: false,
      ssoEnabled: false,
      secureExportEnabled: false,
    });
    assert.deepEqual(recommendedFlagsForType("armed_forces_unit"), {
      participationMode: "expected",
      verticalPack: "armed_forces",
      recommendMilitarySurface: true,
      counselPackRequired: false,
      leaderAssessmentAnswers: false,
      ssoEnabled: false,
      secureExportEnabled: false,
    });
    assert.deepEqual(recommendedFlagsForType("performance_optimization_group"), {
      participationMode: "expected",
      verticalPack: "performance",
      recommendMilitarySurface: false,
      counselPackRequired: false,
      leaderAssessmentAnswers: false,
      ssoEnabled: false,
      secureExportEnabled: false,
    });
    assert.deepEqual(recommendedFlagsForType("other"), {
      participationMode: "open",
      verticalPack: "none",
      recommendMilitarySurface: false,
      counselPackRequired: false,
      leaderAssessmentAnswers: false,
      ssoEnabled: false,
      secureExportEnabled: false,
    });
  });

  it("writes recommended flags on mint and only updates participation when it still matches the last recommendation", () => {
    assert.deepEqual(organizationInsertFields("rehab"), {
      organization_type: "rehab",
      participation_mode: "expected",
    });
    assert.equal(
      nextParticipationModeForTypeChange("expected", "rehab", "other"),
      "open"
    );
    assert.equal(
      nextParticipationModeForTypeChange("open", "rehab", "other"),
      "open"
    );
    assert.equal(
      nextParticipationModeForTypeChange("unset", null, "rehab"),
      "expected"
    );
  });

  it("keeps Expected and Open as the participation framing in the hint", () => {
    assert.match(recommendedFlagSummary("rehab"), /Expected participation/);
    assert.match(recommendedFlagSummary("other"), /Open participation/);
    assert.match(organizationTypeHint(null), /Expected and Open participation/);
    assert.equal(recommendedFlagSummary("rehab").includes("—"), false);
    assert.equal(organizationTypeHint(null).includes("—"), false);
  });
});

describe("organization type Super-admin wiring", () => {
  it("requires a type on the new-org form and the edit form", () => {
    const created = readRepo("app/(admin)/admin/organizations/new/page.tsx");
    const edit = readRepo("app/(admin)/admin/organizations/[id]/page.tsx");
    const field = readRepo("components/admin/organization-type-field.tsx");
    const actions = readRepo("lib/admin/actions.ts");
    const labels = readRepo("lib/organization-type.ts");

    assert.match(created, /OrganizationTypeField/);
    assert.match(edit, /OrganizationTypeField/);
    assert.match(field, /name="organization_type"/);
    assert.match(field, /required/);
    assert.match(labels, /Rehab/);
    assert.match(labels, /Armed Forces Unit/);
    assert.match(labels, /Performance Optimization Group/);
    assert.match(actions, /Choose an organization type/);
    assert.match(actions, /organizationInsertFields/);
  });

  it("does not fork Desk routes by organization type", () => {
    const typeModule = readRepo("lib/organization-type.ts");
    const fatherLayout = readRepo("app/(father)/layout.tsx");
    const managerLayout = readRepo("app/(manager)/layout.tsx");
    assert.match(typeModule, /Desk routes stay the same/);
    assert.doesNotMatch(fatherLayout, /organization_type|organizationType/);
    assert.doesNotMatch(managerLayout, /organization_type|organizationType/);
  });

  it("seeds Returning Home NWA as rehab", () => {
    const migration = readRepo("supabase/migrations/20260823050000_organization_type.sql");
    const seed = readRepo("supabase/sql/seed_returning_home_nwa.sql");
    assert.match(migration, /organization_type = 'rehab'/);
    assert.match(migration, /code = 'NWA'/);
    assert.match(seed, /organization_type = 'rehab'/);
  });
});
