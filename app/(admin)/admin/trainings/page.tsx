import Link from "next/link";

import { AdminCatalogDesk } from "@/components/admin/catalog-desk";
import { AdminDeskList, AdminDeskRow } from "@/components/admin/desk-list";
import { DevelopmentStatusBadge } from "@/components/admin/development-status";
import { AdminFilmFlags } from "@/components/admin/film-flags";
import { ReleaseStatusBadge } from "@/components/admin/release-status";
import { TrainingLaunchRowAction } from "@/components/admin/training-launch-action";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { loadAdminTrainings } from "@/lib/admin/data";
import { asDevelopmentStatus, formatEditedAt, isArchivedTraining } from "@/lib/admin/development";
import { TRAINING_LAUNCH_LIST_LEAD, trainingLaunchPlan } from "@/lib/admin/launch";
import { trainingReleaseState } from "@/lib/admin/release";
import { requireRole } from "@/lib/auth/session";
import { hasHardcodedSkillPack } from "@/lib/father/session-questions";
import { cn } from "@/lib/utils";

export default async function AdminTrainingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; view?: string }>;
}) {
  const flash = await searchParams;
  await requireRole("admin");
  const trainings = await loadAdminTrainings();
  const archivedView = flash.view === "archived";
  const visible = trainings.filter((training) =>
    archivedView ? isArchivedTraining(training) : !isArchivedTraining(training)
  );

  return (
    <AdminCatalogDesk
      title="Trainings"
      lead={TRAINING_LAUNCH_LIST_LEAD}
      error={flash.error}
      notice={flash.notice}
      archivedView={archivedView}
      activeHref="/admin/trainings"
      archivedHref="/admin/trainings?view=archived"
      actions={
        <>
          <Link
            href="/admin/trainings/sources"
            className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
          >
            Bring in a training
          </Link>
          <Link href="/admin/trainings/new" className={cn(buttonVariants(), "w-full sm:w-auto")}>
            New training
          </Link>
        </>
      }
    >
      <AdminDeskList
        countHeader="Sessions"
        actionHeader="Launch"
        empty={
          visible.length === 0 ? (
            <EmptyState
              framed={false}
              title={archivedView ? "No archived trainings" : "No trainings yet"}
              actionHref={archivedView ? "/admin/trainings" : "/admin/trainings/new"}
              actionLabel={archivedView ? "Back to active" : "New training"}
            >
              {archivedView
                ? "Archive an unfinished idea from its development desk. Recover it anytime."
                : "Create a draft, add sessions, then Stage walk, Mark Ready for Review, Publish, and Release to organizations."}
            </EmptyState>
          ) : undefined
        }
      >
        {visible.map((training) => (
          <AdminDeskRow
            key={training.id}
            href={`/admin/trainings/${training.id}`}
            title={training.title}
            count={training.sessions.length}
            countLabel="Sessions"
            development={
              <DevelopmentStatusBadge status={asDevelopmentStatus(training.development_status)} />
            }
            release={<ReleaseStatusBadge state={trainingReleaseState(training)} />}
            action={
              <TrainingLaunchRowAction
                plan={trainingLaunchPlan(training, {
                  sessionHasHardcoded: (session) => hasHardcodedSkillPack(session, training),
                })}
              />
            }
          >
            {training.working_title ? (
              <span className="block truncate text-sm text-muted-foreground">
                Working title: {training.working_title}
              </span>
            ) : null}
            {training.attribution ? (
              <span className="block truncate text-sm text-muted-foreground">
                From {training.attribution}
              </span>
            ) : null}
            <span className="block truncate text-sm text-muted-foreground">
              {`${training.sessions.length} session${training.sessions.length === 1 ? "" : "s"}`}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              Edited {formatEditedAt(training.last_edited_at)}
            </span>
            <AdminFilmFlags sessions={training.sessions} />
          </AdminDeskRow>
        ))}
      </AdminDeskList>
    </AdminCatalogDesk>
  );
}
