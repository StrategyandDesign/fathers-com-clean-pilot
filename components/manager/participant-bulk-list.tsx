"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { useI18n, useT } from "@/components/i18n/locale-provider";
import { UserAvatar } from "@/components/layout/user-avatar";
import { ProgressLights } from "@/components/manager/progress-lights";
import { Button } from "@/components/ui/button";
import type { PracticeLight } from "@/lib/father/skill-use";
import { dateLocale } from "@/lib/i18n/config";
import { translatePracticeLight } from "@/lib/i18n/flash";
import { MAX_BULK } from "@/lib/manager/bulk";
import { runBulkAction } from "@/lib/manager/bulk-actions";
import type { CompanionCopy } from "@/lib/manager/companion";
import { participationCopyKey, type ParticipationMode } from "@/lib/participation";
import { fieldClassName, interactiveSurfaceClassName } from "@/lib/ui";
import { cn } from "@/lib/utils";

export type BulkListParticipant = {
  fatherId: string;
  name: string;
  avatarUrl: string | null;
  groupName: string;
  profileStatus: "completed" | "in_progress" | "not_started";
  progressLabel: string;
  lastActivity: string | null;
  quiet: boolean;
  filmDone?: boolean;
  checkpointDone?: boolean;
  practiceLight?: PracticeLight | null;
  nextAction?: CompanionCopy | null;
};

export type BulkListTraining = {
  id: string;
  title: string;
  published: boolean;
};

export type BulkListSession = {
  id: string;
  trainingId: string;
  title: string;
  sessionNumber: number;
};

export function ParticipantBulkList({
  participants,
  trainings,
  sessions,
  initialTrainingId,
  mode = "unset",
}: {
  participants: BulkListParticipant[];
  trainings: BulkListTraining[];
  sessions: BulkListSession[];
  initialTrainingId?: string;
  mode?: ParticipationMode;
}) {
  const t = useT();
  const { locale } = useI18n();
  const [selected, setSelected] = useState<string[]>([]);
  const [action, setAction] = useState<"assign" | "complete" | "certificates">("assign");
  const [trainingId, setTrainingId] = useState(() => {
    if (initialTrainingId && trainings.some((training) => training.id === initialTrainingId)) {
      return initialTrainingId;
    }
    return trainings[0]?.id ?? "";
  });
  const profileLabel = {
    completed: t("manager.bulk.profileComplete"),
    in_progress: t("manager.bulk.profileInProgress"),
    not_started: t("manager.bulk.profileNeeds"),
  } as const;
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const allIds = participants.map((row) => row.fatherId);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedSet.has(id));
  const publishedTrainings = trainings.filter((training) => training.published);
  const trainingOptions = action === "assign" ? publishedTrainings : trainings;
  const effectiveTrainingId = trainingOptions.some((training) => training.id === trainingId)
    ? trainingId
    : (trainingOptions[0]?.id ?? "");
  const scopedSessions = sessions.filter((session) => session.trainingId === effectiveTrainingId);
  const assignDirect = action === "assign";

  function toggle(id: string) {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((row) => row !== id);
      if (current.length >= MAX_BULK) return current;
      return [...current, id];
    });
  }

  function toggleAll() {
    setSelected(allSelected ? [] : allIds.slice(0, MAX_BULK));
  }

  return (
    <div className="space-y-4">
      <form
        {...(assignDirect
          ? { action: runBulkAction }
          : { method: "get", action: "/manager/participants/bulk" })}
        className="rounded-xl border border-border bg-card p-4 sm:p-6"
      >
        <h2 className="font-heading text-lg font-semibold">{t("manager.bulk.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("manager.bulk.lead")}
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <label className="block space-y-2">
            <span className="text-sm text-muted-foreground">{t("manager.bulk.action")}</span>
            <select
              className={fieldClassName}
              name="action"
              value={action}
              onChange={(event) =>
                setAction(event.target.value as "assign" | "complete" | "certificates")
              }
            >
              <option value="assign">{t("manager.bulk.assign")}</option>
              <option value="complete">{t("manager.bulk.complete")}</option>
              <option value="certificates">{t("manager.bulk.certificates")}</option>
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-muted-foreground">{t("manager.bulk.training")}</span>
            <select
              className={fieldClassName}
              name="training_id"
              value={effectiveTrainingId}
              onChange={(event) => setTrainingId(event.target.value)}
              required
            >
              {trainingOptions.map((training) => (
                <option key={training.id} value={training.id}>
                  {training.title}
                </option>
              ))}
            </select>
          </label>
          {action === "complete" ? (
            <label className="block space-y-2">
              <span className="text-sm text-muted-foreground">{t("manager.bulk.session")}</span>
              <select className={fieldClassName} name="session_id" defaultValue="">
                <option value="">{t("manager.bulk.entireTraining")}</option>
                {scopedSessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {t("manager.bulk.sessionOption", {
                      n: session.sessionNumber,
                      title: session.title,
                    })}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
        {selected.map((id) => (
          <input key={id} type="hidden" name="father_id" value={id} />
        ))}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {selected.length >= MAX_BULK
              ? t("manager.bulk.selectedMax", { n: selected.length, max: MAX_BULK })
              : t("manager.bulk.selected", { n: selected.length })}
          </p>
          <Button type="submit" disabled={selected.length === 0 || !effectiveTrainingId} className="w-full sm:w-auto">
            {assignDirect ? t("manager.bulk.assignNow") : t("manager.bulk.review")}
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <ul>
          <li className="hidden items-center gap-3 border-b border-border px-6 py-3 text-xs tracking-wide text-muted-foreground uppercase md:flex">
            <label className="flex w-4 shrink-0 items-center justify-center">
              <span className="sr-only">{t("manager.bulk.selectAll")}</span>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="size-4 accent-primary"
              />
            </label>
            <span className="grid min-w-0 flex-1 grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.2fr)_8rem] gap-2">
              <span>{t("manager.bulk.name")}</span>
              <span>{t("manager.bulk.profileStatus")}</span>
              <span>{t("manager.bulk.currentTraining")}</span>
              <span>{t("manager.bulk.lastActivity")}</span>
            </span>
          </li>
          {participants.map((participant) => {
            const checked = selectedSet.has(participant.fatherId);
            const nextActionKey =
              participant.nextAction?.key === "manager.companion.reasonStalledTitle"
                ? participationCopyKey(mode, participant.nextAction.key)
                : participant.nextAction?.key;
            const lights = (
              <ProgressLights
                compact
                filmDone={Boolean(participant.filmDone)}
                checkpointDone={Boolean(participant.checkpointDone)}
                practice={participant.practiceLight ?? null}
                filmLabel={t(
                  participant.filmDone
                    ? "manager.participants.stepDone"
                    : "manager.participants.stepPending",
                  { label: t("father.session.film") }
                )}
                checkpointLabel={t(
                  participant.checkpointDone
                    ? "manager.participants.stepDone"
                    : "manager.participants.stepPending",
                  { label: t("father.session.checkin") }
                )}
                practiceLabel={translatePracticeLight(participant.practiceLight, t)}
                showPractice={Boolean(participant.practiceLight)}
              />
            );
            return (
              <li key={participant.fatherId} className="border-b border-border last:border-0">
                <div className="flex items-start gap-3 px-4 py-4 sm:px-6 md:items-center">
                  <label className="flex min-h-11 shrink-0 items-center md:min-h-0">
                    <span className="sr-only">{t("manager.bulk.selectName", { name: participant.name })}</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(participant.fatherId)}
                      className="size-4 accent-primary"
                    />
                  </label>
                  <Link
                    href={`/manager/participants/${participant.fatherId}`}
                    className={cn("min-w-0 flex-1", interactiveSurfaceClassName)}
                  >
                    <span className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.2fr)_8rem] md:items-center">
                      <span className="flex items-center gap-3">
                        <UserAvatar
                          name={participant.name}
                          src={participant.avatarUrl}
                          className="size-10 shrink-0 text-xs font-medium md:size-9"
                        />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="truncate font-medium">{participant.name}</span>
                            {participant.quiet ? (
                              <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] tracking-wide text-muted-foreground uppercase">
                                {t("manager.bulk.quiet")}
                              </span>
                            ) : null}
                          </span>
                          <span className="block truncate text-sm text-muted-foreground">
                            {participant.groupName}
                          </span>
                        </span>
                      </span>
                      <span className="hidden text-sm text-muted-foreground md:block">
                        {profileLabel[participant.profileStatus]}
                      </span>
                      <span className="hidden text-sm md:block">
                        <span className="block">{participant.progressLabel}</span>
                        {lights}
                        {participant.nextAction ? (
                          <span className="mt-1 block text-sm text-muted-foreground">
                            {t("manager.bulk.nextAction")}:{" "}
                            {t(nextActionKey ?? participant.nextAction.key, participant.nextAction.vars)}
                          </span>
                        ) : null}
                      </span>
                      <span className="hidden text-sm text-muted-foreground md:block">
                        {participant.lastActivity
                          ? new Date(participant.lastActivity).toLocaleDateString(dateLocale(locale), {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : t("common.emDash")}
                      </span>
                    </span>
                    <span className="mt-3 flex flex-col gap-2 md:hidden">
                      {lights}
                      {participant.nextAction ? (
                        <span className="text-sm">
                          <span className="text-muted-foreground">{t("manager.bulk.nextAction")}: </span>
                          {t(nextActionKey ?? participant.nextAction.key, participant.nextAction.vars)}
                        </span>
                      ) : null}
                      <span className="flex justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">{t("manager.bulk.profile")}</span>
                        <span className="text-right text-muted-foreground">
                          {profileLabel[participant.profileStatus]}
                        </span>
                      </span>
                      <span className="flex justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">{t("manager.bulk.training")}</span>
                        <span className="text-right">{participant.progressLabel}</span>
                      </span>
                      <span className="flex justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">{t("manager.bulk.lastActive")}</span>
                        <span className="text-right text-muted-foreground">
                          {participant.lastActivity
                            ? new Date(participant.lastActivity).toLocaleDateString(dateLocale(locale), {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : t("common.emDash")}
                        </span>
                      </span>
                    </span>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
