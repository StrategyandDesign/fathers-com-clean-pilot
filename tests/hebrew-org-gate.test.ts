import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_LOCALE,
  LOCALES,
  PUBLIC_LOCALES,
  SHOW_HEBREW,
  exposeLocale,
  isLocale,
  isPublicLocale,
  localeFromCookie,
} from "../lib/i18n/config";
import {
  allowedLocalesFromGroupLocales,
  localeFromGroup,
  localeFromGroups,
  localesForOrg,
  orgAllowsLocale,
  parseLocalePreference,
  pickResolvedLocale,
} from "../lib/i18n/org-locale";
import { he } from "../lib/i18n/messages/he";
import { createTranslator } from "../lib/i18n/translate";
import { resolveFatherLocale } from "../lib/manager/nudge-panel";

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

describe("Hebrew stays in the catalog and off the public surface", () => {
  it("keeps the Hebrew message file wired for translators", () => {
    assert.deepEqual([...LOCALES], ["en", "he"]);
    assert.equal(isLocale("he"), true);
    assert.equal(he.localeName, "עברית");
    assert.equal(createTranslator("he")("account.languageTitle"), "שפה");
    assert.match(readRepo("lib/i18n/translate.ts"), /from \"@\/lib\/i18n\/messages\/he\"/);
  });

  it("does not publish Hebrew globally", () => {
    assert.equal(SHOW_HEBREW, false);
    assert.deepEqual([...PUBLIC_LOCALES], [DEFAULT_LOCALE]);
    assert.equal(isPublicLocale("he"), false);
    assert.equal(exposeLocale("he"), "en");
    assert.equal(localeFromCookie("he"), "en");
  });
});

describe("Hebrew is org-gated by groups.locale", () => {
  it("allows Hebrew only for he orgs", () => {
    assert.deepEqual(localesForOrg("en"), ["en"]);
    assert.deepEqual(localesForOrg("he"), ["en", "he"]);
    assert.deepEqual(localesForOrg(null), ["en"]);
    assert.equal(orgAllowsLocale("en", "en"), true);
    assert.equal(orgAllowsLocale("en", "he"), false);
    assert.equal(orgAllowsLocale("he", "en"), true);
    assert.equal(orgAllowsLocale("he", "he"), true);
    assert.deepEqual(allowedLocalesFromGroupLocales(["en"]), ["en"]);
    assert.deepEqual(allowedLocalesFromGroupLocales(["he"]), ["en", "he"]);
    assert.deepEqual(allowedLocalesFromGroupLocales(["en", "he"]), ["en", "he"]);
  });

  it("resolves profile override only when the org allows it", () => {
    assert.deepEqual(pickResolvedLocale({ profileLocale: "he", groupLocales: ["en"] }), {
      locale: "en",
      allowedLocales: ["en"],
    });
    assert.deepEqual(pickResolvedLocale({ profileLocale: "he", groupLocales: ["he"] }), {
      locale: "he",
      allowedLocales: ["en", "he"],
    });
    assert.deepEqual(pickResolvedLocale({ profileLocale: "en", groupLocales: ["he"] }), {
      locale: "en",
      allowedLocales: ["en", "he"],
    });
    assert.deepEqual(pickResolvedLocale({ profileLocale: null, groupLocales: ["he"] }), {
      locale: "he",
      allowedLocales: ["en", "he"],
    });
    assert.deepEqual(pickResolvedLocale({ profileLocale: null, groupLocales: ["en"] }), {
      locale: "en",
      allowedLocales: ["en"],
    });
  });

  it("follows groups.locale for official export language", () => {
    assert.equal(localeFromGroup({ locale: "he" }), "he");
    assert.equal(localeFromGroup({ locale: "en" }), "en");
    assert.equal(localeFromGroup({ code: "IL" }), null);
    assert.equal(localeFromGroups([{ locale: "he" }]), "he");
    assert.equal(localeFromGroups([{ locale: "he" }, { locale: "he" }]), "he");
    assert.equal(localeFromGroups([{ locale: "he" }, { locale: "en" }]), "en");
  });

  it("resolves father nudge locale from the org gate", () => {
    assert.equal(resolveFatherLocale({ profileLocale: "he", groupLocale: "en" }), "en");
    assert.equal(resolveFatherLocale({ profileLocale: "he", groupLocale: "he" }), "he");
    assert.equal(resolveFatherLocale({ groupLocale: "he" }), "he");
    assert.equal(resolveFatherLocale({ profileLocale: "en", groupLocale: "he" }), "en");
  });

  it("rejects saving Hebrew unless the org allows it", () => {
    assert.deepEqual(parseLocalePreference("", ["en"]), { locale: null });
    assert.deepEqual(parseLocalePreference("en", ["en"]), { locale: "en" });
    assert.deepEqual(parseLocalePreference("he", ["en"]), { error: true });
    assert.deepEqual(parseLocalePreference("he", ["en", "he"]), { locale: "he" });
    assert.deepEqual(parseLocalePreference("fr", ["en", "he"]), { error: true });

    const actions = readRepo("lib/i18n/actions.ts");
    assert.match(actions, /parseLocalePreference/);
    assert.match(actions, /allowedLocalesForUser/);
    assert.doesNotMatch(actions, /isPublicLocale/);
  });

  it("keeps an entitled Hebrew cookie and wipes it for English orgs", () => {
    const middleware = readRepo("lib/supabase/middleware.ts");
    assert.match(middleware, /pickResolvedLocale/);
    assert.match(middleware, /allowedLocales\.includes\(cookieLocale\)/);
    assert.doesNotMatch(middleware, /isPublicLocale/);
    assert.doesNotMatch(
      middleware,
      /cookies\.set\(\s*LOCALE_COOKIE,\s*DEFAULT_LOCALE/
    );
  });

  it("shows the Account language picker only when Hebrew is allowed", () => {
    const account = readRepo("components/layout/account-view.tsx");
    const form = readRepo("components/i18n/language-form.tsx");
    const en = readRepo("lib/i18n/messages/en.ts");

    assert.match(account, /allowedLocales=\{localeSource\.allowedLocales\}/);
    assert.doesNotMatch(account, /SHOW_HEBREW/);
    assert.match(form, /if \(!allowedLocales\.includes\("he"\)\) return null/);
    assert.match(form, /allowedLocales\.map/);
    assert.doesNotMatch(form, /SHOW_HEBREW/);
    assert.match(en, /fatherLead: "Your certificates, palette, notifications/);
    assert.doesNotMatch(en, /fatherLead: "Your certificates, palette, language/);
  });

  it("resolves entitled users without forcing he through exposeLocale", () => {
    const resolve = readRepo("lib/i18n/resolve.ts");
    const server = readRepo("lib/i18n/server.ts");
    assert.match(resolve, /pickResolvedLocale/);
    assert.match(resolve, /userAllowsLocale/);
    assert.match(resolve, /homeGroupId/);
    assert.match(resolve, /Staff lookup can fail/);
    assert.doesNotMatch(resolve, /exposeLocale/);
    assert.doesNotMatch(resolve, /isPublicLocale/);
    assert.match(server, /resolved\.allowedLocales\.includes\(cookieLocale\)/);
    assert.match(server, /cookieLocale !== DEFAULT_LOCALE/);
    assert.doesNotMatch(server, /exposeLocale/);
  });
});
