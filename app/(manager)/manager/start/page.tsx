import { StartPrimaryButton, StartScreen } from "@/components/father/start-screen";
import { getI18n } from "@/lib/i18n/server";
import { finishManagerOnboarding } from "@/lib/manager/start-actions";

export default async function ManagerStartPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { t } = await getI18n();

  return (
    <StartScreen title={t("manager.start.title")} body={t("manager.start.body")} error={error}>
      <ol className="list-decimal space-y-5 pl-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
        <li className="space-y-3 pl-1">
          <p>{t("manager.start.stepInvite")}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/onboarding/leader-invite-code.png"
            alt={t("manager.start.inviteShotAlt")}
            className="w-full rounded-lg border border-border"
          />
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
