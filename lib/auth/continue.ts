import {
  isAuthPath,
  ROLE_HOME,
  safeInternalPath,
  type AppRole,
} from "@/lib/auth/roles";
import {
  managerOnboardingHref,
  shouldShowManagerOnboarding,
} from "@/lib/manager/onboarding";

export const AUTH_CONTINUE_PATH = "/auth/go";

export function isAuthContinuePath(pathname: string) {
  return pathname === AUTH_CONTINUE_PATH || pathname.startsWith(`${AUTH_CONTINUE_PATH}/`);
}

export function authContinueHref(next: string): string {
  const path = safeInternalPath(next);
  if (!path || isAuthContinuePath(path.split("?")[0] ?? path)) {
    return "/login";
  }
  if (isAuthPath(path.split("?")[0] ?? path)) {
    return path;
  }
  return `${AUTH_CONTINUE_PATH}?next=${encodeURIComponent(path)}`;
}

export function postAuthHome(
  role: AppRole,
  managerOnboardedAt?: string | null
): string {
  if (role === "manager" && shouldShowManagerOnboarding(managerOnboardedAt)) {
    return managerOnboardingHref();
  }
  return ROLE_HOME[role];
}

export function resolvePostAuthPath({
  next,
  role,
  managerOnboardedAt,
}: {
  next?: string | null;
  role: AppRole;
  managerOnboardedAt?: string | null;
}): string {
  const home = postAuthHome(role, managerOnboardedAt);
  if (!next) return home;
  if (
    role === "manager" &&
    shouldShowManagerOnboarding(managerOnboardedAt) &&
    (next === ROLE_HOME.manager || next === `${ROLE_HOME.manager}/`)
  ) {
    return managerOnboardingHref();
  }
  return next;
}
