import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  formatSharedLabel,
  isInternalRemote,
  isSharedRemote,
  maxPatchInRevisions,
  nextSharedMark,
  parseDeskRevisions,
  parseSharedLedger,
  readSharedMark,
  renderSharedLedger,
  shouldPreserve,
  upsertLedgerRow,
} from "../scripts/publish-shared.mjs";
import { applySharedRevision, nextSharedPatch, shouldBumpSharedPatch } from "../scripts/shared-revision.mjs";

describe("shared publish marks", () => {
  it("numbers the next mark from shared/ tags and starts at 1", () => {
    assert.equal(nextSharedMark([]), 1);
    assert.equal(nextSharedMark(["shared/1", "shared/3", "submit/2"]), 4);
  });

  it("keeps the isolated Hebrew catalog when overlaying an internal tree", () => {
    assert.equal(shouldPreserve("lib/i18n/messages/he.ts"), true);
    assert.equal(shouldPreserve("lib/i18n/translate.ts"), true);
    assert.equal(shouldPreserve("app/(admin)/admin/assessments/page.tsx"), false);
  });

  it("treats the isolated remote as Eric's shared repo, not the internal one", () => {
    assert.equal(isSharedRemote("clean-pilot-only", "https://github.com/StrategyandDesign/fathers-com-clean-pilot"), true);
    assert.equal(isInternalRemote("origin", "https://github.com/StrategyandDesign/fathers-com-platform"), true);
    assert.equal(isSharedRemote("origin", "https://github.com/StrategyandDesign/fathers-com-platform"), false);
  });

  it("round-trips the numbered ledger Eric can open on GitHub", () => {
    const markdown = renderSharedLedger([
      {
        mark: 1,
        date: "2026-08-19",
        tag: "shared/1",
        internalSha: "b6ab1daabcdef",
        title: "Bring researcher assessments onto the Super-admin desk.",
      },
    ]);
    const rows = parseSharedLedger(markdown);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].mark, 1);
    assert.equal(rows[0].tag, "shared/1");
    assert.equal(rows[0].internalSha, "b6ab1da");
    assert.match(markdown, /not official Submit stamps/);
    assert.match(markdown, /shared-revision\.mjs --stamp/);
    const updated = upsertLedgerRow(rows, {
      mark: 1,
      date: "2026-08-19",
      tag: "shared/1",
      internalSha: "cafebab",
      title: "Updated title",
    });
    assert.equal(updated.length, 1);
    assert.equal(updated[0].internalSha, "cafebab");
    assert.doesNotMatch(markdown, /Desk revisions/);
  });

  it("keeps desk revisions under the Shared 1 mark", () => {
    const markdown = renderSharedLedger(
      [
        {
          mark: 1,
          date: "2026-08-19",
          tag: "shared/1",
          internalSha: "2549c76",
          title: "Make the shared-repo sync script run on its own.",
        },
      ],
      [
        {
          revision: "1.01",
          date: "2026-08-19",
          title: "Show Shared 1-1.01 on the desk and tick it on each push.",
          label: "Shared 1-1.01",
        },
      ]
    );
    const rows = parseDeskRevisions(markdown);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].revision, "1.01");
    assert.match(markdown, /Shared 1-1.01/);
    assert.match(markdown, /does not create Shared 2/);
    assert.match(markdown, /ticks again on each push of the Shared 1 desk/);
    assert.match(markdown, /The next tick will be \*\*1\.02\*\*/);
    assert.equal(formatSharedLabel(1, 1), "Shared 1-1.01");
  });

  it("ticks the desk patch once per push", () => {
    assert.equal(shouldBumpSharedPatch(0, 0, 0), true);
    assert.equal(nextSharedPatch(0, 0, 0), 1);
    assert.equal(shouldBumpSharedPatch(0, 0, 1), false);
    assert.equal(nextSharedPatch(0, 0, 1), 2);
    assert.equal(shouldBumpSharedPatch(1, 1, 1), true);
    assert.equal(nextSharedPatch(1, 1, 1), 2);
    assert.equal(shouldBumpSharedPatch(1, 2, 2), false);
    assert.equal(nextSharedPatch(1, 2, 2), 3);
  });

  it("skips historical ledger rows so the next real bump is after the highest desk revision", () => {
    assert.equal(shouldBumpSharedPatch(101, 101, 101), true);
    assert.equal(nextSharedPatch(101, 101, 101, 126), 127);
    assert.equal(nextSharedPatch(101, 101, 101, 101), 102);
    assert.equal(
      maxPatchInRevisions([
        { patch: 101, revision: "1.101" },
        { revision: "1.126" },
        { label: "Shared 1-1.102" },
      ]),
      126
    );
    const mark = readSharedMark(
      readFileSync(fileURLToPath(new URL("../shared-mark.json", import.meta.url)), "utf8")
    );
    const ledger = parseDeskRevisions(
      readFileSync(fileURLToPath(new URL("../SHARED.md", import.meta.url)), "utf8")
    );
    assert.ok(mark);
    const ledgerPatch = Math.max(maxPatchInRevisions(mark.revisions), maxPatchInRevisions(ledger));
    assert.equal(nextSharedPatch(mark.patch, mark.patch, mark.patch, ledgerPatch), ledgerPatch + 1);
    const held = renderSharedLedger(
      [
        {
          mark: 1,
          date: "2026-08-19",
          tag: "shared/1",
          internalSha: "2549c76",
          title: "Make the shared-repo sync script run on its own.",
        },
      ],
      [
        {
          patch: 101,
          revision: "1.101",
          label: "Shared 1-1.101",
          date: "2026-08-21",
          title: "Put a created assessment in the cohort as included.",
        },
        {
          patch: 126,
          revision: "1.126",
          label: "Shared 1-1.126",
          date: "2026-08-24",
          title: "Show the circled Group invite code crop on Leader start.",
        },
      ],
      "Shared 1-1.101"
    );
    assert.match(held, /The badge on this checkout is \*\*Shared 1-1\.101\*\*/);
    assert.match(held, /The next tick will be \*\*1\.127\*\*/);
    assert.match(held, /Rows 1\.102–1\.126 landed while the badge was held/);
    assert.equal(formatSharedLabel(1, nextSharedPatch(101, 101, 101, 126)), "Shared 1-1.127");
  });

  it("keeps desk labels on Shared 1-1.N even when the coarse mark is 7", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "shared-desk-"));
    try {
      writeFileSync(
        path.join(dir, "shared-mark.json"),
        `${JSON.stringify({
          mark: 7,
          patch: 101,
          label: "Shared 1-1.101",
          tag: "shared/7",
          at: "2026-08-21T00:00:00.000Z",
          internalSha: "aaa",
          sharedSha: "",
          title: "Held",
          url: "",
          revisions: [
            { patch: 101, revision: "1.101", label: "Shared 1-1.101", at: "2026-08-21", title: "Held" },
            { patch: 126, revision: "1.126", label: "Shared 1-1.126", at: "2026-08-24", title: "Later" },
          ],
        }, null, 2)}\n`
      );
      writeFileSync(path.join(dir, "SHARED.md"), "# Shared marks\n");
      const next = applySharedRevision(dir, {
        patch: 127,
        title: "Resume ticks",
        at: "2026-08-24T00:00:00.000Z",
      });
      assert.equal(next?.mark, 7);
      assert.equal(next?.patch, 127);
      assert.equal(next?.label, "Shared 1-1.127");
      assert.equal(next?.revisions.at(-1)?.revision, "1.127");
      assert.equal(next?.revisions.at(-1)?.label, "Shared 1-1.127");
      const written = JSON.parse(readFileSync(path.join(dir, "shared-mark.json"), "utf8"));
      assert.equal(written.mark, 7);
      assert.equal(written.label, "Shared 1-1.127");
      assert.doesNotMatch(written.label, /^Shared 7-/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("holds the Shared marks copy on review and does not schedule it", () => {
    const source = JSON.parse(
      readFileSync(fileURLToPath(new URL("../shared-source.json", import.meta.url)), "utf8")
    );
    const workflow = readFileSync(
      fileURLToPath(new URL("../.github/workflows/shared-sync.yml", import.meta.url)),
      "utf8"
    );
    assert.equal(source.repo, "StrategyandDesign/fathers-com-platform");
    assert.equal(source.branch, "review");
    assert.equal(source.hold, true);
    assert.match(workflow, /workflow_dispatch:/);
    assert.doesNotMatch(workflow, /cron:\s*"\*\/2 \* \* \* \*"/);
    assert.match(workflow, /github\.ref == 'refs\/heads\/review'/);
    assert.match(workflow, /if: steps\.hold\.outputs\.skip != 'true'/);
    assert.match(workflow, /git clone --depth 1 --branch "\$SOURCE_BRANCH"/);
  });

  it("reads the local Shared badge file", () => {
    const mark = readSharedMark(
      JSON.stringify({
        mark: 2,
        tag: "shared/2",
        at: "2026-08-19T15:00:00.000Z",
        internalSha: "aaa",
        sharedSha: "bbb",
        title: "Example",
        url: "https://github.com/StrategyandDesign/fathers-com-clean-pilot/releases/tag/shared/2",
      })
    );
    assert.equal(mark?.mark, 2);
    assert.equal(mark?.tag, "shared/2");
    assert.equal(mark?.label, "Shared 2");
    assert.equal(readSharedMark("{"), null);
  });
});
