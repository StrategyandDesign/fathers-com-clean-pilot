import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { isAuthPath } from "../lib/auth/roles";
import { certificatesRequireClaim, pilotShowTestContent } from "../lib/flags";
import {
  HEBREW_PILOT_GROUP_NAME,
  hidePilotTestStaffMessage,
  filterHiddenPilotTestTrainings,
  hidePilotTestTraining,
  isPilotTestStaffMessage,
  isPilotTestTrainingTitle,
  neutralizePilotOrgName,
  showDeveloperIssueChrome,
} from "../lib/pilot/hygiene";

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

describe("pilot logout", () => {
  it("signs out from /logout and from one Account action", () => {
    const logout = readRepo("app/logout/page.tsx");
    const account = readRepo("components/layout/account-view.tsx");
    const actions = readRepo("lib/auth/actions.ts");

    assert.match(logout, /export default async function LogoutPage/);
    assert.match(logout, /await signOut\(\)/);
    assert.match(account, /href="\/logout"/);
    assert.match(account, /auth\.signOut/);
    assert.doesNotMatch(account, /<form action=\{signOut\}/);
    assert.match(actions, /export async function performSignOut/);
    assert.match(actions, /clearHomeDeskCookie/);
    assert.equal(isAuthPath("/logout"), false);
    assert.equal(isAuthPath("/login"), true);
  });
});

describe("developer issue chrome", () => {
  it("keeps the red Issue overlay off the production and default pilot path", () => {
    const nextConfig = readRepo("next.config.ts");
    const stamp = readRepo("components/dev/version-stamp.tsx");

    assert.match(nextConfig, /devIndicators:\s*false/);
    assert.match(stamp, /NODE_ENV === "production"/);
    assert.equal(showDeveloperIssueChrome(), false);
  });
});

describe("pilot test-content hygiene", () => {
  it("hides Test Training and the test desk note unless the demo flag is on", () => {
    assert.equal(pilotShowTestContent(), false);
    assert.equal(certificatesRequireClaim(), false);

    assert.equal(isPilotTestTrainingTitle("Test Training 1"), true);
    assert.equal(isPilotTestTrainingTitle("test"), true);
    assert.equal(isPilotTestTrainingTitle("Fundamentals"), false);
    assert.equal(
      hidePilotTestTraining({ title: "Test Training 1", working_title: "test" }),
      true
    );
    assert.equal(
      hidePilotTestTraining(
        { title: "Test Training 1" },
        { hasProgress: true }
      ),
      false
    );
    assert.deepEqual(
      filterHiddenPilotTestTrainings([
        { title: "Test Training 1" },
        { title: "Coming Home Present" },
      ]).map((row) => row.title),
      ["Coming Home Present"]
    );

    assert.equal(isPilotTestStaffMessage("Test! Did you receive!"), true);
    assert.equal(isPilotTestStaffMessage("New assessments this week."), false);
    assert.equal(hidePilotTestStaffMessage("Test! Did you receive!"), true);

    const flags = readRepo("lib/flags.ts");
    const father = readRepo("lib/father/data.ts");
    const manager = readRepo("lib/manager/data.ts");
    const catalog = readRepo("lib/manager/catalog.ts");
    const reviewer = readRepo("lib/reviewer/insights.ts");
    const ribbon = readRepo("lib/staff-messages/data.ts");
    const env = readRepo(".env.example");

    assert.match(flags, /PILOT_SHOW_TEST_CONTENT/);
    assert.match(father, /hidePilotTestTraining/);
    assert.match(manager, /hidePilotTestTraining/);
    assert.match(catalog, /hidePilotTestTraining/);
    assert.match(reviewer, /hidePilotTestTraining/);
    assert.match(reviewer, /training_distribution/);
    assert.match(ribbon, /hidePilotTestStaffMessage/);
    assert.match(env, /PILOT_SHOW_TEST_CONTENT=/);
  });

  it("renames the military-looking org and keeps @il seats on a neutral name", () => {
    assert.equal(neutralizePilotOrgName("Unit 8200"), HEBREW_PILOT_GROUP_NAME);
    assert.equal(neutralizePilotOrgName("Returning Home NWA"), "Returning Home NWA");

    const seed = readRepo("supabase/sql/seed_unit_8200.sql");
    const hygiene = readRepo("supabase/sql/pilot_hygiene_issue_17.sql");
    const runbook = readRepo("docs/engineering/PILOT.md");
    const orgPhotos = readRepo("lib/org-photos/data.ts");

    assert.match(seed, /Hebrew Pilot Group/);
    assert.match(seed, /name in \('Hebrew Pilot Group', 'Unit 8200'\)/);
    assert.doesNotMatch(seed, /set name = 'Unit 8200'/);
    assert.match(hygiene, /set name = 'Hebrew Pilot Group'/);
    assert.match(hygiene, /replace\(full_name, 'Unit 8200', 'Hebrew Pilot Group'\)/);
    assert.match(hygiene, /published = false/);
    assert.match(hygiene, /did you receive/);
    assert.match(runbook, /Hebrew Pilot Group/);
    assert.match(runbook, /pilot_hygiene_issue_17\.sql/);
    assert.match(orgPhotos, /neutralizePilotOrgName/);
  });
});
