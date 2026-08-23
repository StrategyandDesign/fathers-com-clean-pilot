import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  HOME_SYNC_INTERVAL_MS,
  HOME_SYNC_PATH,
  homeSyncVersion,
} from "../lib/father/home-sync";
import { shouldHoldDeskRefresh, shouldRefreshDesk } from "../lib/manager/desk-sync";

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

describe("father home live updates", () => {
  it("changes the stamp when a leader posts or a father dismisses", () => {
    const quiet = homeSyncVersion({ notes: [] });
    const posted = homeSyncVersion({
      notes: [{ id: "n1", updated_at: "2026-08-23T18:00:00.000Z" }],
    });
    const replaced = homeSyncVersion({
      notes: [{ id: "n1", updated_at: "2026-08-23T18:05:00.000Z" }],
    });
    const dismissed = homeSyncVersion({
      notes: [{ id: "n1", updated_at: "2026-08-23T18:05:00.000Z" }],
      dismissals: [{ note_id: "n1", dismissed_at: "2026-08-23T18:06:00.000Z" }],
    });
    assert.notEqual(quiet, posted);
    assert.notEqual(posted, replaced);
    assert.notEqual(replaced, dismissed);
    assert.equal(shouldRefreshDesk(posted, replaced), true);
    assert.equal(shouldHoldDeskRefresh({ hidden: true, editing: false }), true);
  });

  it("polls Father Home and refreshes when the update stamp moves", () => {
    const layout = readRepo("app/(father)/layout.tsx");
    const route = readRepo("app/api/father/home-sync/route.ts");
    const client = readRepo("components/father/home-sync.tsx");
    const data = readRepo("lib/father/home-sync-data.ts");
    assert.equal(HOME_SYNC_PATH, "/api/father/home-sync");
    assert.equal(HOME_SYNC_INTERVAL_MS, 2000);
    assert.match(layout, /<FatherHomeSync/);
    assert.match(route, /role !== "father"/);
    assert.match(route, /loadFatherHomeSyncVersion/);
    assert.match(client, /router\.refresh/);
    assert.match(client, /HOME_SYNC_PATH/);
    assert.match(data, /import "server-only"/);
    assert.match(data, /organization_cohort_notes/);
    assert.match(data, /organization_cohort_note_dismissals/);
    assert.doesNotMatch(client, /home-sync-data/);
    assert.doesNotMatch(client, /supabase\/server/);
  });
});
