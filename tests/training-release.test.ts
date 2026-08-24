import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

describe("training release RPC", () => {
  it("does not use OUT column names as ON CONFLICT targets", () => {
    const sql = readRepo(
      "supabase/migrations/20260824190000_qualify_training_release_conflict.sql"
    );

    assert.match(sql, /on conflict on constraint organization_training_reviews_pkey/);
    assert.doesNotMatch(sql, /on conflict \(group_id, training_id\)/);
    assert.match(sql, /internal\.release_training_to_organizations/);
    assert.match(sql, /internal\.seed_group_training_reviews/);
  });

  it("keeps the Super-admin banner tied to a failed release write", () => {
    const actions = readRepo("lib/admin/actions.ts");
    const release = readRepo("lib/admin/release.ts");

    assert.match(actions, /RELEASE_WRITE_ERROR/);
    assert.match(actions, /releaseTrainingToManagers/);
    assert.match(release, /release_training_to_organizations/);
  });
});
