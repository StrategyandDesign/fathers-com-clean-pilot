import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  assignableTrainingIdsForGroup,
  fatherIdsMissingAssignment,
  includedTrainingIds,
  shouldHoldFatherStart,
} from "../lib/manager/assign-included";
import { SHOW_HEBREW } from "../lib/i18n/config";

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

describe("include auto-assign helpers", () => {
  it("assigns included trainings to members who do not already have them", () => {
    assert.deepEqual(
      includedTrainingIds(
        [
          { training_id: "presence", status: "accepted", group_id: "nwa" },
          { training_id: "anger", status: "pending", group_id: "nwa" },
          { training_id: "other", status: "accepted", group_id: "il" },
          { training_id: "presence", status: "accepted", group_id: "nwa" },
        ],
        "nwa"
      ),
      ["presence"]
    );
    assert.deepEqual(
      fatherIdsMissingAssignment(["dad-1", "dad-2", "dad-3"], ["dad-2"]),
      ["dad-1", "dad-3"]
    );
  });

  it("does not duplicate fathers who already have the training", () => {
    assert.deepEqual(fatherIdsMissingAssignment(["dad-1", "dad-1"], ["dad-1"]), []);
    assert.deepEqual(fatherIdsMissingAssignment(["dad-1"], ["dad-1", "dad-1"]), []);
  });

  it("picks up accepted and legacy catalog trainings on join, not pending or declined", () => {
    const ids = assignableTrainingIdsForGroup({
      trainings: [
        {
          id: "accepted",
          published: true,
          released_at: "2026-08-01T00:00:00.000Z",
          first_released_at: "2026-08-01T00:00:00.000Z",
        },
        {
          id: "pending",
          published: true,
          released_at: "2026-08-02T00:00:00.000Z",
          first_released_at: "2026-08-02T00:00:00.000Z",
        },
        {
          id: "legacy",
          published: true,
          first_published_at: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "declined-legacy",
          published: true,
          first_published_at: "2026-01-01T00:00:00.000Z",
        },
      ],
      reviews: [
        { training_id: "accepted", status: "accepted" },
        { training_id: "pending", status: "pending" },
        { training_id: "declined-legacy", status: "declined" },
      ],
    });
    assert.deepEqual(ids, ["accepted", "legacy"]);
  });

  it("holds English start only when the org has nothing to start", () => {
    assert.equal(
      shouldHoldFatherStart({ hasAssignment: false, hasIncludedTraining: false }),
      true
    );
    assert.equal(
      shouldHoldFatherStart({ hasAssignment: true, hasIncludedTraining: false }),
      false
    );
    assert.equal(
      shouldHoldFatherStart({ hasAssignment: false, hasIncludedTraining: true }),
      false
    );
    assert.equal(SHOW_HEBREW, false);
  });

  it("wires Include and join through the existing assign helper", () => {
    const review = readRepo("lib/manager/review-actions.ts");
    const join = readRepo("lib/auth/group-join.ts");
    const sync = readRepo("lib/manager/assign-included-sync.ts");
    const sql = readRepo("supabase/migrations/20260824153415_sync_included_training_assignments.sql");

    assert.match(review, /assignIncludedTrainingToGroupFathers/);
    assert.match(join, /syncIncludedTrainingsForFather/);
    assert.match(sync, /assignTrainingToFather/);
    assert.match(sync, /sync_included_training_assignments/);
    assert.match(sql, /on conflict \(father_id, training_id\) do nothing/);
    assert.match(sql, /perform internal.sync_included_training_assignments\(uid\)/);
    assert.doesNotMatch(review, /Fathers are not enrolled until you assign it/);
  });
});
