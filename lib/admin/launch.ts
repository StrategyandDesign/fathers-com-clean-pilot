import {
  PREVIEW_REQUIRED_ERROR,
  READY_REQUIRED_ERROR,
  asDevelopmentStatus,
  firstReadyBlocker,
  isArchivedTraining,
  type DevelopmentChecklistInput,
} from "@/lib/admin/development";
import { FILM_RUNTIME_MISSING, firstFilmPublishError } from "@/lib/trainings/runtime";

export function canReleaseTraining(
  training: TrainingLaunchInput,
  options?: {
    rightsBlocker?: string | null;
    sessionHasHardcoded?: (session: TrainingLaunchInput["sessions"][number]) => boolean;
  }
) {
  if (isArchivedTraining(training)) return false;
  if (training.published !== true) return false;
  if (training.sessions.length < 1) return false;
  if (training.released_at) return true;
  if (options?.rightsBlocker) return false;
  if (asDevelopmentStatus(training.development_status) !== "ready_for_review") return false;
  return firstReadyBlocker(training, options) === null;
}

export const LAUNCH_STEPS = ["review", "stage", "ready", "publish", "release"] as const;

export type LaunchStepKey = (typeof LAUNCH_STEPS)[number];

export type LaunchStepState = "done" | "current" | "locked";

export type LaunchKind = "fix" | "ready" | "publish" | "release" | "view";

export const LAUNCH_STEP_LABEL: Record<LaunchStepKey, string> = {
  review: "Review",
  stage: "Stage walk",
  ready: "Ready",
  publish: "Publish",
  release: "Release to Leaders",
};

export const TRAINING_LAUNCH_LIST_LEAD =
  "Review a training, then Stage walk → Ready → Publish → Release to Leaders. Publish does not notify Leaders. Release does.";

export const TRAINING_LAUNCH_HANDOFF =
  "Release to organizations goes to Leaders. They accept, then Include or assign fathers. Publish does not notify Leaders.";

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

export type TrainingLaunchState = {
  trainingId: string;
  archived: boolean;
  released: boolean;
  published: boolean;
  reviewDone: boolean;
  stageDone: boolean;
  readyStatus: boolean;
  checklistReady: boolean;
  readyDone: boolean;
  publishDone: boolean;
  releaseDone: boolean;
  canRelease: boolean;
  current: LaunchStepKey | "done";
  steps: TrainingLaunchStep[];
  checklistBlocker: string | null;
  filmBlocker: string | null;
  rightsBlocker: string | null;
  blocker: string | null;
};

export type TrainingLaunchPlan = TrainingLaunchState & {
  kind: LaunchKind;
  label: string;
  detailLabel: string;
  href: string;
  stageHref: string;
  enabled: boolean;
  shortBlocker: string | null;
  showStageSecondary: boolean;
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
  reviewDone: boolean;
  stageDone: boolean;
  readyDone: boolean;
  publishDone: boolean;
  releaseDone: boolean;
}): LaunchStepKey | "done" {
  if (input.releaseDone) return "done";
  if (!input.reviewDone) return "review";
  if (!input.stageDone) return "stage";
  if (!input.readyDone) return "ready";
  if (!input.publishDone) return "publish";
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

function currentBlocker(input: {
  current: LaunchStepKey | "done";
  archived: boolean;
  reviewDone: boolean;
  sessionCount: number;
  checklistBlocker: string | null;
  filmBlocker: string | null;
  rightsBlocker: string | null;
  published: boolean;
  readyStatus: boolean;
}) {
  if (input.archived) return "Recover this training from the archive first.";
  if (input.current === "review") {
    return input.sessionCount === 0 ? "Add at least one session." : "Add a title and slug.";
  }
  if (input.current === "stage") {
    return input.sessionCount === 0 ? "Add at least one session." : PREVIEW_REQUIRED_ERROR;
  }
  if (input.current === "ready") return input.checklistBlocker;
  if (input.current === "publish") return input.filmBlocker;
  if (input.current === "release") {
    if (!input.published) return "Publish this training first.";
    if (input.sessionCount === 0) return "Add at least one session.";
    if (input.rightsBlocker) return input.rightsBlocker;
    if (input.filmBlocker) return input.filmBlocker;
    if (!input.readyStatus) return READY_REQUIRED_ERROR;
    return input.checklistBlocker;
  }
  return null;
}

export function trainingLaunchState(
  training: TrainingLaunchInput,
  options?: {
    sessionHasHardcoded?: (session: TrainingLaunchInput["sessions"][number]) => boolean;
    rightsBlocker?: string | null;
  }
): TrainingLaunchState {
  const archived = isArchivedTraining(training);
  const status = asDevelopmentStatus(training.development_status);
  const reviewDone = Boolean(training.title?.trim() && training.slug?.trim() && training.sessions.length > 0);
  const stageDone = Boolean(training.previewed_at);
  const readyStatus = status === "ready_for_review" || status === "released";
  const checklistBlocker = firstReadyBlocker(training, options);
  const checklistReady = !checklistBlocker;
  const readyDone = readyStatus && checklistReady;
  const published = training.published === true;
  const released = Boolean(training.released_at);
  const filmBlocker = firstFilmPublishError(training.sessions);
  const rightsBlocker = options?.rightsBlocker ?? null;
  const current = launchCurrent({
    reviewDone,
    stageDone,
    readyDone,
    publishDone: published,
    releaseDone: released,
  });
  const canRelease = canReleaseTraining(training, options);
  const steps = LAUNCH_STEPS.map((key) => ({
    key,
    label: LAUNCH_STEP_LABEL[key],
    state: stepState(
      key,
      current,
      key === "review"
        ? reviewDone
        : key === "stage"
          ? stageDone
          : key === "ready"
            ? readyDone
            : key === "publish"
              ? published
              : released
    ),
  }));

  return {
    trainingId: training.id,
    archived,
    released,
    published,
    reviewDone,
    stageDone,
    readyStatus,
    checklistReady,
    readyDone,
    publishDone: published,
    releaseDone: released,
    canRelease,
    current: released ? "done" : current,
    steps: released
      ? LAUNCH_STEPS.map((key) => ({
          key,
          label: LAUNCH_STEP_LABEL[key],
          state: "done" as const,
        }))
      : steps,
    checklistBlocker,
    filmBlocker,
    rightsBlocker,
    blocker: currentBlocker({
      current: released ? "done" : current,
      archived,
      reviewDone,
      sessionCount: training.sessions.length,
      checklistBlocker,
      filmBlocker,
      rightsBlocker,
      published,
      readyStatus,
    }),
  };
}

export function trainingLaunchPlan(
  training: TrainingLaunchInput,
  options?: {
    sessionHasHardcoded?: (session: TrainingLaunchInput["sessions"][number]) => boolean;
    rightsBlocker?: string | null;
  }
): TrainingLaunchPlan {
  const state = trainingLaunchState(training, options);
  const detailHref = `/admin/trainings/${training.id}`;
  const launchHref = `${detailHref}#launch`;
  const releaseHref = `${detailHref}#release`;
  const stageHref = `${detailHref}/stage`;
  const shortBlocker = shortLaunchBlocker(state.blocker);

  if (state.archived) {
    return {
      ...state,
      kind: "view",
      label: "View",
      detailLabel: "Recover on the development desk",
      href: `${detailHref}#development`,
      stageHref,
      enabled: true,
      shortBlocker,
      showStageSecondary: false,
    };
  }

  if (state.current === "done") {
    return {
      ...state,
      kind: "view",
      label: "Released",
      detailLabel: "Released",
      href: releaseHref,
      stageHref,
      enabled: true,
      shortBlocker: null,
      showStageSecondary: true,
    };
  }

  if (state.current === "review") {
    return {
      ...state,
      kind: "fix",
      label: `Fix: ${shortBlocker ?? "Review"}`,
      detailLabel: "Finish Review first",
      href: `${detailHref}#sessions`,
      stageHref,
      enabled: true,
      shortBlocker,
      showStageSecondary: true,
    };
  }

  if (state.current === "stage") {
    return {
      ...state,
      kind: "fix",
      label: `Fix: ${shortBlocker ?? STAGE_WALK_SHORT}`,
      detailLabel: "Open staging",
      href: stageHref,
      stageHref,
      enabled: true,
      shortBlocker,
      showStageSecondary: true,
    };
  }

  if (state.current === "ready") {
    const enabled = !state.blocker;
    return {
      ...state,
      kind: enabled ? "ready" : "fix",
      label: enabled ? "Mark Ready" : `Fix: ${shortBlocker ?? "Ready"}`,
      detailLabel: "Mark Ready for Review",
      href: launchHref,
      stageHref,
      enabled,
      shortBlocker,
      showStageSecondary: true,
    };
  }

  if (state.current === "publish") {
    const enabled = !state.blocker;
    return {
      ...state,
      kind: enabled ? "publish" : "fix",
      label: enabled ? "Publish" : `Fix: ${shortBlocker ?? "Publish"}`,
      detailLabel: "Publish",
      href: launchHref,
      stageHref,
      enabled,
      shortBlocker,
      showStageSecondary: true,
    };
  }

  return {
    ...state,
    kind: state.canRelease ? "release" : "fix",
    label: state.canRelease ? "Release" : `Fix: ${shortBlocker ?? "Release"}`,
    detailLabel: "Release to Leaders",
    href: launchHref,
    stageHref,
    enabled: state.canRelease,
    shortBlocker,
    showStageSecondary: true,
  };
}
