import { redirect } from "next/navigation";

import { ROLE_HOME } from "@/lib/auth/roles";
import { requireStartPage } from "@/lib/father/start-page";

export default async function FatherStartSessionPage() {
  const { state } = await requireStartPage("session");
  if (!state.hasAssignedSession) {
    redirect("/father/start/hold");
  }
  redirect(ROLE_HOME.father);
}
