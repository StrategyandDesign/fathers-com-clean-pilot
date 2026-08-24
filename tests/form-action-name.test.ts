import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

function openingTags(source: string, tag: string): string[] {
  const tags: string[] = [];
  const re = new RegExp(`<${tag}\\b`, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    const start = match.index;
    let i = start + match[0].length;
    let quote: string | null = null;
    let depth = 0;
    while (i < source.length) {
      const ch = source[i];
      if (quote) {
        if (ch === "\\" && quote !== "`") {
          i += 2;
          continue;
        }
        if (ch === quote) quote = null;
        i += 1;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") {
        quote = ch;
        i += 1;
        continue;
      }
      if (ch === "{") {
        depth += 1;
        i += 1;
        continue;
      }
      if (ch === "}") {
        depth -= 1;
        i += 1;
        continue;
      }
      if (depth === 0 && ch === ">") {
        tags.push(source.slice(start, i));
        break;
      }
      i += 1;
    }
  }
  return tags;
}

function functionFormActionWithName(source: string): string[] {
  return [...openingTags(source, "Button"), ...openingTags(source, "button")].filter((tag) => {
    const hasFunctionFormAction = /formAction=\{[A-Za-z_$]/.test(tag);
    const hasName = /\bname=/.test(tag);
    return hasFunctionFormAction && hasName;
  });
}

describe("function formAction cannot carry a name prop", () => {
  it("does not put name on admin training Move up / Move down buttons", () => {
    const source = readRepo("app/(admin)/admin/trainings/[id]/page.tsx");
    assert.match(source, /formAction=\{moveSessionUp\}/);
    assert.match(source, /formAction=\{moveSessionDown\}/);
    assert.doesNotMatch(source, /formAction=\{moveSession\}/);
    assert.deepEqual(functionFormActionWithName(source), []);
  });

  it("does not put name on profile take or save-exit function formActions", () => {
    const files = [
      "app/(father)/father/profile/take/page.tsx",
      "app/(manager)/manager/practice/profile/take/page.tsx",
      "components/profile/save-exit-button.tsx",
    ];
    for (const file of files) {
      assert.deepEqual(functionFormActionWithName(readRepo(file)), [], file);
    }
  });

  it("omits name in Button when formAction is a function", () => {
    const source = readRepo("components/ui/button.tsx");
    assert.match(source, /typeof formAction === "function"/);
    assert.match(source, /resolvedName/);
  });
});
