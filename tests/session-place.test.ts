import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { sessionPlaceLabel } from "../lib/father/session-place";
import { createTranslator } from "../lib/i18n/translate";

describe("session place label", () => {
  it("names the session inside the training, not completion", () => {
    const t = createTranslator("en");
    assert.equal(sessionPlaceLabel(3, 12, t), "Session 3 of 12");
    assert.equal(sessionPlaceLabel(null, 12, t), "12 sessions");
    assert.equal(sessionPlaceLabel(1, 0, t), null);
  });

  it("keeps the Hebrew place line in the same order", () => {
    const t = createTranslator("he");
    const he = readFileSync(
      fileURLToPath(new URL("../lib/i18n/messages/he.ts", import.meta.url)),
      "utf8"
    );
    assert.match(he, /sessionOfTotal:\s*"מפגש \{n\} מתוך \{total\}"/);
    assert.equal(sessionPlaceLabel(3, 12, t), "מפגש 3 מתוך 12");
    assert.doesNotMatch(sessionPlaceLabel(3, 12, t) ?? "", /^3 /);
  });
});
