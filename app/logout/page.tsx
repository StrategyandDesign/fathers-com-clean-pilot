import { signOut } from "@/lib/auth/actions";

export const dynamic = "force-dynamic";

/** Top-level sign-out. One GET clears the session and returns to login. */
export default async function LogoutPage() {
  await signOut();
}
