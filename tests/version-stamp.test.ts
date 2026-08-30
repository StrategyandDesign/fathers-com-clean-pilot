import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { deskStampLabel, formatSharedLabel, formatSharedRevision, loadSharedMark } from "../lib/dev/shared-mark";

describe("version stamp", () => {
  it("reads the Shared mark from shared-mark.json", () => {
    const mark = loadSharedMark();
    assert.ok(mark);
    assert.match(mark.label, /^Shared 1-1\.\d+$/);
    assert.equal(mark.label, formatSharedLabel(1, mark.patch));
    const ledger = readFileSync(fileURLToPath(new URL("../SHARED.md", import.meta.url)), "utf8");
    assert.equal(ledger.includes(`The badge on this checkout is **${mark.label}**`), true);
  });

  it("formats Shared 1-1.01 and the next ticks", () => {
    assert.equal(formatSharedRevision(1, 0), "");
    assert.equal(formatSharedLabel(1, 0), "Shared 1");
    assert.equal(formatSharedRevision(1, 1), "1.01");
    assert.equal(formatSharedLabel(1, 1), "Shared 1-1.01");
    assert.equal(formatSharedLabel(1, 12), "Shared 1-1.12");
  });

  it("puts Shared N on the root layout", () => {
    const layout = readFileSync(
      fileURLToPath(new URL("../app/layout.tsx", import.meta.url)),
      "utf8"
    );
    assert.match(layout, /<VersionStamp/);
  });

  it("renders the desk label on the stamp", () => {
    const stamp = readFileSync(
      fileURLToPath(new URL("../components/dev/version-stamp.tsx", import.meta.url)),
      "utf8"
    );
    const pill = readFileSync(
      fileURLToPath(new URL("../components/dev/version-stamp-pill.tsx", import.meta.url)),
      "utf8"
    );
    assert.match(stamp, /deskStampLabel/);
    assert.match(stamp, /VersionStampPill/);
    assert.match(stamp, /shared\.title/);
    assert.match(pill, /\{label\}/);
    assert.match(pill, /\{title\}/);
    assert.match(pill, /Minimize/);
    assert.doesNotMatch(pill, / title=/);
    assert.equal(deskStampLabel(130), "Shared 1-1.130");
  });

  it("keeps the Shared desk hook on the pre-commit path", () => {
    const hook = readFileSync(
      fileURLToPath(new URL("../scripts/git-hooks/pre-commit", import.meta.url)),
      "utf8"
    );
    assert.match(hook, /shared-revision\.mjs" --pre-commit/);
  });
});
