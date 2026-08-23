import { roleForPath } from "@/lib/auth/roles";

/** When session refresh throws, gated desks go to login. Public pages stay up. */
export function sessionFailureAction(pathname: string): "login" | "continue" {
  return roleForPath(pathname) ? "login" : "continue";
}
