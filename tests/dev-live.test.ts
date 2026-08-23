import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  blockingDirty,
  cloneCandidates,
  isFollowableBranch,
  needsRestart,
  parseArgs,
  parseRemoteRefs,
  pickDeskBranch,
  patchFromSharedMark,
  syncRepo,
} from "../scripts/dev-live.mjs";

describe("live local sync", () => {
  it("includes the Desktop and home clones plus the current tree", () => {
    const clones = cloneCandidates("/Users/adm", "/Users/adm/Desktop/fathers-com-platform");
    assert.deepEqual(clones, [
      "/Users/adm/Desktop/fathers-com-platform",
      "/Users/adm/fathers-com-platform",
      "/Users/adm/Desktop/fathers-com-clean-pilot",
      "/Users/adm/fathers-com-clean-pilot",
    ]);
  });

  it("restarts Next only when install or server config files change", () => {
    assert.equal(needsRestart(["lib/i18n/messages/en.ts"]), false);
    assert.equal(needsRestart(["package-lock.json"]), true);
    assert.equal(needsRestart(["next.config.ts"]), true);
    assert.equal(needsRestart([".env.local"]), true);
  });

  it("lets untracked leftovers sit while a fast-forward runs", () => {
    assert.deepEqual(blockingDirty("?? veterans.html\n"), []);
    assert.deepEqual(blockingDirty(" M lib/i18n/messages/en.ts\n"), [
      " M lib/i18n/messages/en.ts",
    ]);
  });

  it("parses watch flags", () => {
    assert.deepEqual(parseArgs(["--watch-only"]), {
      watchOnly: true,
      once: false,
      port: 3000,
    });
  });

  it("fast-forwards a clean clone that is behind origin", () => {
    const calls: string[] = [];
    const runner = (cmd: string, args: string[]) => {
      const key = `${cmd} ${args.join(" ")}`;
      calls.push(key);
      if (key === "git rev-parse --abbrev-ref HEAD") return { status: 0, stdout: "cursor/clean-pilot-ux-refinements-7c78\n" };
      if (key === "git fetch --quiet origin cursor/clean-pilot-ux-refinements-7c78") {
        return { status: 0, stdout: "" };
      }
      if (key === "git rev-parse HEAD") return { status: 0, stdout: "aaa\n" };
      if (key === "git rev-parse origin/cursor/clean-pilot-ux-refinements-7c78") {
        return { status: 0, stdout: "bbb\n" };
      }
      if (key === "git status --porcelain") return { status: 0, stdout: "?? leftovers.html\n" };
      if (key === "git rev-list --count origin/cursor/clean-pilot-ux-refinements-7c78..HEAD") {
        return { status: 0, stdout: "0\n" };
      }
      if (key === "git merge --ff-only --quiet origin/cursor/clean-pilot-ux-refinements-7c78") {
        return { status: 0, stdout: "" };
      }
      if (key === "git diff --name-only aaa bbb") {
        return { status: 0, stdout: "lib/i18n/messages/en.ts\n" };
      }
      return { status: 1, stdout: "" };
    };

    const result = syncRepo("/tmp/repo", runner);
    assert.equal(result.ok, true);
    assert.equal(result.changed, true);
    assert.deepEqual(result.files, ["lib/i18n/messages/en.ts"]);
    assert.equal(calls.includes("git merge --ff-only --quiet origin/cursor/clean-pilot-ux-refinements-7c78"), true);
  });

  it("does not overwrite a dirty tracked file", () => {
    const runner = (cmd: string, args: string[]) => {
      const key = `${cmd} ${args.join(" ")}`;
      if (key === "git rev-parse --abbrev-ref HEAD") return { status: 0, stdout: "main\n" };
      if (key.startsWith("git fetch")) return { status: 0, stdout: "" };
      if (key === "git rev-parse HEAD") return { status: 0, stdout: "aaa\n" };
      if (key === "git rev-parse origin/main") return { status: 0, stdout: "bbb\n" };
      if (key === "git status --porcelain") return { status: 0, stdout: " M app/layout.tsx\n" };
      return { status: 0, stdout: "" };
    };
    const result = syncRepo("/tmp/repo", runner);
    assert.equal(result.ok, false);
    assert.equal(result.reason, "dirty");
  });

  it("follows the Shared desk branch with the newest badge", () => {
    assert.equal(isFollowableBranch("review"), true);
    assert.equal(isFollowableBranch("cursor/cadence-pending-defined-5318"), true);
    assert.equal(isFollowableBranch("submit/2"), false);
    assert.equal(isFollowableBranch("main"), false);
    assert.equal(patchFromSharedMark('{"patch":120}'), 120);
    const picked = pickDeskBranch([
      { branch: "review", patch: 117, at: "2026-08-23T12:00:00.000Z" },
      { branch: "cursor/cadence-pending-defined-5318", patch: 121, at: "2026-08-23T14:00:00.000Z" },
      { branch: "main", patch: 200, at: "2026-08-23T18:00:00.000Z" },
    ]);
    assert.equal(picked?.branch, "cursor/cadence-pending-defined-5318");
    assert.deepEqual(parseRemoteRefs("origin/review|aaa|2026-08-23\norigin/main|bbb|2026-08-23\n"), [
      { ref: "origin/review", branch: "review", sha: "aaa", at: "2026-08-23" },
      { ref: "origin/main", branch: "main", sha: "bbb", at: "2026-08-23" },
    ]);

    const calls: string[] = [];
    const runner = (cmd: string, args: string[]) => {
      const key = `${cmd} ${args.join(" ")}`;
      calls.push(key);
      if (key === "git rev-parse --abbrev-ref HEAD") {
        return {
          status: 0,
          stdout: calls.some((row) => row.includes("checkout"))
            ? "cursor/cadence-pending-defined-5318\n"
            : "review\n",
        };
      }
      if (key === "git rev-parse HEAD") {
        return {
          status: 0,
          stdout: calls.some((row) => row.includes("checkout")) ? "newsha\n" : "oldsha\n",
        };
      }
      if (key === "git fetch --quiet --prune origin") return { status: 0, stdout: "" };
      if (key.startsWith("git for-each-ref")) {
        return {
          status: 0,
          stdout: "origin/review|oldsha|2026-08-23T12:00:00Z\norigin/cursor/cadence-pending-defined-5318|newsha|2026-08-23T14:00:00Z\n",
        };
      }
      if (key === "git show origin/review:shared-mark.json") {
        return { status: 0, stdout: '{"patch":117}\n' };
      }
      if (key === "git show origin/cursor/cadence-pending-defined-5318:shared-mark.json") {
        return { status: 0, stdout: '{"patch":121}\n' };
      }
      if (key === "git status --porcelain") return { status: 0, stdout: "" };
      if (key.startsWith("git rev-list --count")) return { status: 0, stdout: "0\n" };
      if (key === "git checkout --quiet -B cursor/cadence-pending-defined-5318 origin/cursor/cadence-pending-defined-5318") {
        return { status: 0, stdout: "" };
      }
      if (key === "git rev-parse origin/cursor/cadence-pending-defined-5318") {
        return { status: 0, stdout: "newsha\n" };
      }
      if (key === "git diff --name-only oldsha newsha") {
        return { status: 0, stdout: "lib/father/home-sync.ts\n" };
      }
      return { status: 1, stdout: "" };
    };

    const result = syncRepo("/tmp/repo", runner);
    assert.equal(result.ok, true);
    assert.equal(result.changed, true);
    assert.equal(result.reason, "switched");
    assert.deepEqual(result.files, ["lib/father/home-sync.ts"]);
    assert.equal(
      calls.includes(
        "git checkout --quiet -B cursor/cadence-pending-defined-5318 origin/cursor/cadence-pending-defined-5318"
      ),
      true
    );
  });
});
