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
      <ol className="space-y-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
        <li className="space-y-3">
          <p>{t("manager.start.stepInvite")}</p>
          {inviteShot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={inviteShotSrc}
              alt={t("manager.start.inviteShotAlt")}
              className="w-full rounded-lg border border-border"
            />
          ) : null}
        </li>
        <li>
          <p>{t("manager.start.stepTrainings")}</p>
        </li>
      </ol>
      <form action={finishManagerOnboarding}>
        <StartPrimaryButton>{t("manager.start.openDesk")}</StartPrimaryButton>
      </form>
    </StartScreen>
  );
}
