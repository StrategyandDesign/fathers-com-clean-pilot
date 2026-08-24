import { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from "@/lib/i18n/config";

type GroupLocaleFields = { locale?: string | null; code?: string | null };

/** English is always allowed. Hebrew is allowed only when the org default is `he`. */
export function localesForOrg(groupLocale: unknown): Locale[] {
  return groupLocale === "he" ? ["en", "he"] : [DEFAULT_LOCALE];
}

export function orgAllowsLocale(groupLocale: unknown, locale: unknown): locale is Locale {
  return isLocale(locale) && localesForOrg(groupLocale).includes(locale);
}

export function allowedLocalesFromGroupLocales(
  groupLocales: Array<string | null | undefined>
): Locale[] {
  const allowed = new Set<Locale>([DEFAULT_LOCALE]);
  for (const groupLocale of groupLocales) {
    if (groupLocale === "he") allowed.add("he");
  }
  return LOCALES.filter((locale) => allowed.has(locale));
}

export function pickResolvedLocale(input: {
  profileLocale?: string | null;
  groupLocales: Array<string | null | undefined>;
}): { locale: Locale; allowedLocales: Locale[] } {
  const allowedLocales = allowedLocalesFromGroupLocales(input.groupLocales);
  if (isLocale(input.profileLocale) && allowedLocales.includes(input.profileLocale)) {
    return { locale: input.profileLocale, allowedLocales };
  }
  const orgDefault = input.groupLocales.find((value) => isLocale(value));
  if (orgDefault) return { locale: orgDefault, allowedLocales };
  return { locale: DEFAULT_LOCALE, allowedLocales };
}

/** Empty string inherits the organization default. Other values must be allowed. */
export function parseLocalePreference(
  raw: string,
  allowedLocales: readonly Locale[]
): { locale: Locale | null } | { error: true } {
  const trimmed = raw.trim();
  if (trimmed === "") return { locale: null };
  if (isLocale(trimmed) && allowedLocales.includes(trimmed)) return { locale: trimmed };
  return { error: true };
}

export function localeFromGroup(group: GroupLocaleFields | null | undefined): Locale | null {
  if (isLocale(group?.locale)) return group.locale;
  return null;
}

/** Official export language follows the organization. Mixed or unknown groups stay English. */
export function localeFromGroups(groups: GroupLocaleFields[]): Locale {
  if (groups.length === 0) return DEFAULT_LOCALE;
  const resolved = groups.map((group) => localeFromGroup(group));
  if (resolved.every((locale) => locale === "he")) return "he";
  return DEFAULT_LOCALE;
}

export async function resolveManagerExportLocale(managerId: string): Promise<Locale> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { loadGroupsForManager } = await import("@/lib/org-staff/membership");
    const groups = await loadGroupsForManager(managerId, supabase);
    return localeFromGroups(groups);
  } catch {
    return DEFAULT_LOCALE;
  }
}

export async function resolveGroupsExportLocale(groupIds: string[]): Promise<Locale> {
  const ids = [...new Set(groupIds.filter(Boolean))];
  if (ids.length === 0) return DEFAULT_LOCALE;
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase.from("groups").select("locale, code").in("id", ids);
    return localeFromGroups(data ?? []);
  } catch {
    return DEFAULT_LOCALE;
  }
}
