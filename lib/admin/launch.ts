import {
  ARCHIVE_RELEASE_ERROR,
  PREVIEW_REQUIRED_ERROR,
  READY_REQUIRED_ERROR,
  asDevelopmentStatus,
  firstReadyBlocker,
  isArchivedTraining,
  type DevelopmentChecklistInput,
} from "@/lib/admin/development";
import { FILM_RUNTIME_MISSING, firstFilmPublishError } from "@/lib/trainings/runtime";

export const LAUNCH_STEPS = ["stage", "ready", "publish", "release"] as const;

export type LaunchStepKey = (typeof LAUNCH_STEPS)[number];

export type LaunchStepState = "done" | "current" | "locked";

export type LaunchKind = "stage" | "ready" | "publish" | "release" | "view";

export const LAUNCH_STEP_LABEL: Record<LaunchStepKey, string> = {
  stage: "Stage walk",
  ready: "Ready",
  publish: "Publish",
  release: "Release",
};

export const TRAINING_LAUNCH_LIST_LEAD =
  "Review a training, then Launch: Stage → Ready → Publish → Release. Publish does not notify Leaders. Release does.";

export type TrainingLaunchInput = DevelopmentChecklistInput & {
  id: string;
  published?: boolean | null;
  released_at?: string | null;
  development_status?: string | null;
};

export type TrainingLaunchStep = {
  key: LaunchStepKey;
  label: string;
  state: LaunchStepState;
};

export type TrainingLaunchPlan = {
  trainingId: string;
  archived: boolean;
  released: boolean;
  current: LaunchStepKey | "done";
  steps: TrainingLaunchStep[];
  kind: LaunchKind;
  label: string;
  detailLabel: string;
  href: string;
  enabled: boolean;
  blocker: string | null;
  shortBlocker: string | null;
};

const STAGE_WALK_SHORT = "Stage walk required";

export function shortLaunchBlocker(blocker: string | null): string | null {
  if (!blocker) return null;
  if (blocker === FILM_RUNTIME_MISSING || /needs a runtime/i.test(blocker)) {
    return FILM_RUNTIME_MISSING;
  }
  if (blocker === PREVIEW_REQUIRED_ERROR || /stage preview|stage walk/i.test(blocker)) {
    return STAGE_WALK_SHORT;
  }
  if (blocker === READY_REQUIRED_ERROR || /Mark Ready/i.test(blocker)) {
    return "Mark Ready first";
  }
  if (/ceiling is 6:00|over 6:00/i.test(blocker)) return "Film over 6:00";
  if (/YouTube film/i.test(blocker)) return "Film missing";
  if (/Check-in/i.test(blocker)) return "Check-in missing";
  if (/Action with three options/i.test(blocker)) return "Action missing";
  if (/title and slug/i.test(blocker)) return "Title missing";
  if (/at least one session/i.test(blocker)) return "Session missing";
  if (/clearance|declined use|rights/i.test(blocker)) return "Rights not cleared";
  if (/archive/i.test(blocker)) return "Archived";
  if (/Publish the training first|Publish this training first/i.test(blocker)) {
    return "Publish first";
  }
  return blocker;
}

function launchCurrent(input: {
  previewed: boolean;
  ready: boolean;
  published: boolean;
  released: boolean;
}): LaunchStepKey | "done" {
  if (input.released) return "done";
  if (!input.previewed) return "stage";
  if (!input.ready) return "ready";
  if (!input.published) return "publish";
  return "release";
}

function stepState(
  key: LaunchStepKey,
  current: LaunchStepKey | "done",
  done: boolean
): LaunchStepState {
  if (done) return "done";
  if (current === key) return "current";
  return "locked";
}

function releaseBlocker(input: {
  archived: boolean;
  published: boolean;
  sessionCount: number;
  rightsBlocker: string | null;
  filmBlocker: string | null;
  ready: boolean;
}) {
  if (input.archived) return ARCHIVE_RELEASE_ERROR;
  if (!input.published) return "Publish this training first.";
  if (input.sessionCount === 0) return "Add at least one session.";
  if (input.rightsBlocker) return input.rightsBlocker;
  if (input.filmBlocker) return input.filmBlocker;
  if (!input.ready) return READY_REQUIRED_ERROR;
  return null;
}

export function trainingLaunchPlan(
  training: TrainingLaunchInput,
  options?: {
    sessionHasHardcoded?: (session: TrainingLaunchInput["sessions"][number]) => boolean;
    rightsBlocker?: string | null;
  }
): TrainingLaunchPlan {
  const archived = isArchivedTraining(training);
  const status = asDevelopmentStatus(training.development_status);
  const previewed = Boolean(training.previewed_at);
  const ready = status === "ready_for_review" || status === "released";
  const published = training.published === true;
  const released = Boolean(training.released_at);
  const current = launchCurrent({ previewed, ready, published, released });
  const checklistBlocker = firstReadyBlocker(training, options);
  const filmBlocker = firstFilmPublishError(training.sessions);
  const rightsBlocker = options?.rightsBlocker ?? null;

  const steps = LAUNCH_STEPS.map((key) => ({
    key,
    label: LAUNCH_STEP_LABEL[key],
    state: stepState(
      key,
      current,
      key === "stage"
        ? previewed
        : key === "ready"
          ? ready
          : key === "publish"
            ? published
            : released
    ),
  }));

  const detailHref = `/admin/trainings/${training.id}`;
  const launchHref = `${detailHref}#launch`;
  const releaseHref = `${detailHref}#release`;
  const stageHref = `${detailHref}/stage`;

  if (archived) {
    const blocker = "Recover this training from the archive first.";
    return {
      trainingId: training.id,
      archived,
      released,
      current,
      steps,
      kind: "view",
      label: "View",
      detailLabel: "View",
      href: detailHref,
      enabled: true,
      blocker,
      shortBlocker: shortLaunchBlocker(blocker),
    };
  }

  if (current === "done") {
    return {
      trainingId: training.id,
      archived,
      released,
      current,
      steps,
      kind: "view",
      label: "Released",
      detailLabel: "Released",
      href: releaseHref,
      enabled: true,
      blocker: null,
      shortBlocker: null,
    };
  }

  let blocker: string | null = null;
  if (current === "ready") blocker = checklistBlocker;
  else if (current === "publish") blocker = filmBlocker;
  else if (current === "release") {
    blocker = releaseBlocker({
      archived,
      published,
      sessionCount: training.sessions.length,
      rightsBlocker,
      filmBlocker,
      ready,
    });
  }

  if (current === "stage") {
    return {
      trainingId: training.id,
      archived,
      released,
      current,
      steps,
      kind: "stage",
      label: "Stage",
      detailLabel: "Open staging",
      href: stageHref,
      enabled: true,
      blocker: training.sessions.length === 0 ? "Add at least one session." : null,
      shortBlocker:
        training.sessions.length === 0 ? shortLaunchBlocker("Add at least one session.") : null,
    };
  }

  if (current === "ready") {
    return {
      trainingId: training.id,
      archived,
      released,
      current,
      steps,
      kind: "ready",
      label: "Ready",
      detailLabel: "Mark Ready for Review",
      href: launchHref,
      enabled: !blocker,
      blocker,
      shortBlocker: shortLaunchBlocker(blocker),
    };
  }

  if (current === "publish") {
    return {
      trainingId: training.id,
      archived,
      released,
      current,
      steps,
      kind: "publish",
      label: "Publish",
      detailLabel: "Publish",
      href: launchHref,
      enabled: !blocker,
      blocker,
      shortBlocker: shortLaunchBlocker(blocker),
    };
  }

  return {
    trainingId: training.id,
    archived,
    released,
    current,
    steps,
    kind: "release",
    label: "Release",
    detailLabel: "Release to organizations",
    href: launchHref,
    enabled: !blocker,
    blocker,
    shortBlocker: shortLaunchBlocker(blocker),
  };
}
