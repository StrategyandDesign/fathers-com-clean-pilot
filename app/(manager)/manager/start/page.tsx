import { existsSync } from "node:fs";
import path from "node:path";

import { StartPrimaryButton, StartScreen } from "@/components/father/start-screen";
import { getI18n } from "@/lib/i18n/server";
import { finishManagerOnboarding } from "@/lib/manager/start-actions";

const inviteShotSrc = "/onboarding/leader-invite-code.png";
const inviteShotFile = path.join(process.cwd(), "public/onboarding/leader-invite-code.png");

export default async function ManagerStartPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { t } = await getI18n();
  const inviteShot = existsSync(inviteShotFile);

  return (
    <StartScreen title={t("manager.start.title")} body={t("manager.start.body")} error={error}>
      <ol className="list-decimal space-y-5 pl-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
        <li className="space-y-3 pl-1">
          <p>{t("manager.start.stepInvite")}</p>
          {inviteShot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={inviteShotSrc}
              alt={t("manager.start.inviteShotAlt")}
              className="w-full rounded-lg border border-border"
            />
          ) : (
            // TODO: drop the circled Group invite code crop at public/onboarding/leader-invite-code.png
            <div className="relative overflow-hidden rounded-lg border border-border bg-muted/40 px-4 py-5">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground">
                Group invite code
              </p>
              <p className="mt-2 font-mono text-lg tracking-[0.35em] text-foreground">12345</p>
              <span
                aria-hidden
                className="pointer-events-none absolute left-3 top-2 h-[4.5rem] w-40 rounded-full border-2 border-red-500/80"
              />
            </div>
          )}
        </li>
        <li className="pl-1">
          <p>{t("manager.start.stepTrainings")}</p>
        </li>
      </ol>
      <form action={finishManagerOnboarding}>
        <StartPrimaryButton>{t("manager.start.openDesk")}</StartPrimaryButton>
      </form>
    </StartScreen>
  );
}
