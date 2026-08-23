import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

describe("documentation layout", () => {
  it("keeps only the transfer-facing markdown files at the repo root", () => {
    const markdown = readdirSync(root)
      .filter((name) => name.endsWith(".md"))
      .sort();
    assert.deepEqual(markdown, [
      "AGENTS.md",
      "CONTRIBUTING.md",
      "README.md",
      "SHARED.md",
      "SUBMITS.md",
    ]);
  });

  it("does not leave static HTML at the repo root", () => {
    const html = readdirSync(root).filter((name) => name.endsWith(".html"));
    assert.deepEqual(html, []);
  });

  it("keeps runbooks and the archived site on their documented paths", () => {
    assert.ok(existsSync(join(root, "docs/README.md")));
    assert.ok(existsSync(join(root, "docs/engineering/PILOT.md")));
    assert.ok(existsSync(join(root, "docs/engineering/HARDENING-1-1.117.md")));
    assert.ok(existsSync(join(root, "docs/engineering/SHARED-1-1.118-PLATFORM-AUDIT.md")));
    assert.ok(existsSync(join(root, "docs/engineering/trust-pack/README.md")));
    assert.ok(existsSync(join(root, "docs/engineering/trust-pack/SECURITY-QUESTIONNAIRE.md")));
    assert.ok(existsSync(join(root, "docs/product/README.md")));
    assert.ok(existsSync(join(root, "docs/product/TRUST-PACK.md")));
    assert.ok(existsSync(join(root, "docs/product/ARMED-FORCES-VERTICAL.md")));
    assert.ok(existsSync(join(root, "docs/product/OPTIMIZATION-VERTICAL.md")));
    assert.ok(existsSync(join(root, "partner-kit/forum-moderator-review.md")));
    assert.ok(existsSync(join(root, "docs/archive/README.md")));
    assert.ok(existsSync(join(root, "archive/static-site/README.md")));
    assert.ok(existsSync(join(root, "handoff/00-SUBMISSION-GUIDE.md")));
  });
});
