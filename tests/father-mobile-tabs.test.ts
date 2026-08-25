import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

describe("father mobile tab bar", () => {
  it("is opaque and reserves the AppNav tab height plus clearance", () => {
    const shell = readRepo("components/layout/role-shell.tsx");
    const nav = readRepo("components/layout/app-nav.tsx");
    const fatherBar = shell.slice(
      shell.indexOf("{fatherMobile ? ("),
      shell.indexOf("<main")
    );

    assert.match(nav, /layout === "tabs" && "flex h-\[3\.75rem\]/);
    assert.match(fatherBar, /bg-background /);
    assert.match(fatherBar, /pb-\[env\(safe-area-inset-bottom\)\]/);
    assert.doesNotMatch(fatherBar, /bg-background\/95|backdrop-blur/);
    assert.match(
      shell,
      /max-lg:pb-\[calc\(3\.75rem\+1rem\+env\(safe-area-inset-bottom\)\)\]/
    );
  });
});
