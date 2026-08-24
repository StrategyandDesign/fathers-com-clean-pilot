import { cache } from "react";

import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/config";
import { pickResolvedLocale } from "@/lib/i18n/org-locale";
import { createClient } from "@/lib/supabase/server";

export type ResolvedLocaleSource = {
  locale: Locale;
  allowedLocales: Locale[];
  homeGroupId: string | null;
  organizationCode: string | null;
};

const empty: ResolvedLocaleSource = {
  locale: DEFAULT_LOCALE,
  allowedLocales: [DEFAULT_LOCALE],
  homeGroupId: null,
  organizationCode: null,
};

type LocaleClient = Awaited<ReturnType<typeof createClient>>;

async function loadRelevantGroupLocales(
  supabase: LocaleClient,
  userId: string,
  homeGroupId: string | null
): Promise<{
  groupLocales: Array<string | null | undefined>;
  homeGroupId: string | null;
  organizationCode: string | null;
}> {
  const groupLocales: Array<string | null | undefined> = [];
  let resolvedHomeGroupId = homeGroupId;
  let organizationCode: string | null = null;

  const { loadGroupsForManager } = await import("@/lib/org-staff/membership");
  const managedGroups = await loadGroupsForManager(userId, supabase);
  for (const managed of managedGroups) {
    groupLocales.push(managed.locale);
    if (!resolvedHomeGroupId && managed.id) resolvedHomeGroupId = managed.id;
    if (!organizationCode && managed.code) organizationCode = managed.code ?? null;
  }

  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("father_id", userId)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const groupId = membership?.group_id ?? homeGroupId ?? null;
  if (groupId && !managedGroups.some((group) => group.id === groupId)) {
    const { data: group } = await supabase
      .from("groups")
      .select("id, locale, code")
      .eq("id", groupId)
      .maybeSingle();
    if (group) {
      groupLocales.push(group.locale);
      resolvedHomeGroupId = group.id ?? resolvedHomeGroupId;
      organizationCode = group.code ?? organizationCode;
    }
  }

  return { groupLocales, homeGroupId: resolvedHomeGroupId, organizationCode };
}

export const resolveUserLocale = cache(async (userId: string): Promise<ResolvedLocaleSource> => {
  try {
    const supabase = await createClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("locale, home_group_id, role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) return empty;

    const groups = await loadRelevantGroupLocales(
      supabase,
      userId,
      profile?.home_group_id ?? null
    );
    const picked = pickResolvedLocale({
      profileLocale: profile?.locale,
      groupLocales: groups.groupLocales,
    });

    return {
      locale: picked.locale,
      allowedLocales: picked.allowedLocales,
      homeGroupId: groups.homeGroupId,
      organizationCode: groups.organizationCode,
    };
  } catch {
    return empty;
  }
});

export async function allowedLocalesForUser(userId: string): Promise<Locale[]> {
  const resolved = await resolveUserLocale(userId);
  return resolved.allowedLocales;
}

export async function userAllowsLocale(userId: string, locale: unknown): Promise<boolean> {
  return isLocale(locale) && (await allowedLocalesForUser(userId)).includes(locale);
}
