import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { composeSkillPrompt, PREVIEW_REQUIRED_ERROR } from "../lib/admin/development";
import {
  LAUNCH_STEP_LABEL,
  LAUNCH_STEPS,
  TRAINING_LAUNCH_HANDOFF,
  TRAINING_LAUNCH_LIST_LEAD,
  canReleaseTraining,
  catalogFlagLabel,
  launchNowLabel,
  shortLaunchBlocker,
  stageContinueLabel,
  trainingLaunchPlan,
  trainingLaunchState,
} from "../lib/admin/launch";
import { FILM_RUNTIME_MISSING } from "../lib/trainings/runtime";
import type { Session, Training } from "../lib/father/types";

const FILM = "https://youtu.be/dQw4w9WgXcQ";

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

function training(overrides: Partial<Training> = {}): Training {
  return {
    id: "training-1",
    slug: "new-course",
    title: "New Course",
    description: "A skill training.",
    session_count: 1,
    order_index: 0,
    published: false,
    previewed_at: null,
    development_status: "in_development",
    ...overrides,
  };
}

function session(overrides: Partial<Session> = {}): Session {
  return {
    id: "session-1",
    training_id: "training-1",
    session_number: 1,
    title: "Session one",
    keyline: "Show up.",
    video_url: FILM,
    order_index: 1,
    duration_seconds: 180,
    checkin_prompt: composeSkillPrompt({
      stem: "What did the film teach?",
      a: "A private feeling",
      b: "A concrete skill",
      c: "A substitute habit",
    }),
    action_prompt: composeSkillPrompt({
      stem: "Which action matches the skill?",
      a: "The named behavior",
      b: "A journal entry",
      c: "Skipping the practice",
    }),
    ...overrides,
  };
}

function row(overrides: Partial<Training> = {}, sessions: Session[] = [session()]) {
  return { ...training(overrides), sessions };
}

describe("training launch sequence", () => {
  it("locks the four-step ladder copy", () => {
    assert.deepEqual([...LAUNCH_STEPS], ["stage", "ready", "publish", "release"]);
    assert.equal(LAUNCH_STEP_LABEL.stage, "Stage walk");
    assert.equal(LAUNCH_STEP_LABEL.ready, "Mark Ready for Review");
    assert.equal(LAUNCH_STEP_LABEL.publish, "Publish");
    assert.equal(LAUNCH_STEP_LABEL.release, "Release to organizations");
    assert.equal(
      TRAINING_LAUNCH_LIST_LEAD,
      "Stage walk → Mark Ready for Review → Publish → Release to organizations. Publish does not notify Leaders. Release does."
    );
    assert.equal(
      TRAINING_LAUNCH_HANDOFF,
      "Stage walk, then Mark Ready for Review, then Publish, then Release to organizations. Publish does not ping Leaders. Release notifies Leaders. They accept, then Include or assign fathers."
    );
    assert.equal(launchNowLabel("stage"), "Now: Walk as Father");
    assert.equal(launchNowLabel("ready"), "Now: Mark Ready for Review");
    assert.equal(launchNowLabel("publish"), "Now: Publish");
    assert.equal(launchNowLabel("release"), "Now: Release to organizations");
    assert.equal(stageContinueLabel("ready"), "Continue to Ready");
    assert.equal(catalogFlagLabel({ published: true }), "Published. Not released to Leaders.");
    assert.equal(
      catalogFlagLabel({ published: true, released_at: "2026-08-20T12:00:00.000Z" }),
      "Published and released"
    );
  });

  it("starts at Stage walk when sessions are missing", () => {
    const state = trainingLaunchState(row({}, []));
    assert.equal(state.current, "stage");
    assert.equal(state.steps[0].state, "current");
    const plan = trainingLaunchPlan(row({}, []));
    assert.equal(plan.kind, "fix");
    assert.equal(plan.label, "Fix: Session missing");
  });

  it("starts at Stage walk when the preview is missing", () => {
    const state = trainingLaunchState(row());
    assert.equal(state.current, "stage");
    assert.equal(state.steps[0].state, "current");
    assert.equal(state.steps[1].state, "locked");
    const plan = trainingLaunchPlan(row());
    assert.equal(plan.kind, "fix");
    assert.equal(plan.label, "Fix: Stage walk required");
    assert.equal(plan.detailLabel, "Open staging");
    assert.equal(plan.showStageSecondary, true);
  });

  it("moves to Ready after the stage walk", () => {
    const plan = trainingLaunchPlan(
      row({ previewed_at: "2026-08-18T12:00:00.000Z" })
    );
    assert.equal(plan.current, "ready");
    assert.equal(plan.kind, "ready");
    assert.equal(plan.label, "Mark Ready");
    assert.equal(plan.detailLabel, "Mark Ready for Review");
    assert.equal(plan.enabled, true);
    assert.equal(plan.blocker, null);
  });

  it("keeps Ready current but offers Fix when runtime is missing", () => {
    const plan = trainingLaunchPlan(
      row({ previewed_at: "2026-08-18T12:00:00.000Z" }, [
        session({ duration_seconds: null }),
      ])
    );
    assert.equal(plan.current, "ready");
    assert.equal(plan.kind, "fix");
    assert.equal(plan.enabled, false);
    assert.equal(plan.blocker, FILM_RUNTIME_MISSING);
    assert.equal(plan.shortBlocker, "Runtime missing");
    assert.equal(plan.label, "Fix: Runtime missing");
  });

  it("offers Publish only after Ready for Review", () => {
    const plan = trainingLaunchPlan(
      row({
        previewed_at: "2026-08-18T12:00:00.000Z",
        development_status: "ready_for_review",
      })
    );
    assert.equal(plan.current, "publish");
    assert.equal(plan.kind, "publish");
    assert.equal(plan.label, "Publish");
    assert.equal(plan.enabled, true);
  });

  it("offers Release to organizations only after Publish", () => {
    const plan = trainingLaunchPlan(
      row({
        previewed_at: "2026-08-18T12:00:00.000Z",
        development_status: "ready_for_review",
        published: true,
      })
    );
    assert.equal(plan.current, "release");
    assert.equal(plan.kind, "release");
    assert.equal(plan.label, "Release");
    assert.equal(plan.detailLabel, "Release to organizations");
    assert.equal(plan.enabled, true);
    assert.equal(plan.canRelease, true);
    assert.match(plan.href, /#launch$/);
  });

  it("does not skip Stage walk when a training was published early", () => {
    const plan = trainingLaunchPlan(row({ published: true }));
    assert.equal(plan.current, "stage");
    assert.equal(plan.kind, "fix");
    assert.equal(plan.label, "Fix: Stage walk required");
    assert.equal(canReleaseTraining(row({ published: true })), false);
  });

  it("does not treat Publish as finished while still In Development", () => {
    const state = trainingLaunchState(
      row({
        published: true,
        development_status: "in_development",
        previewed_at: "2026-08-18T12:00:00.000Z",
      })
    );
    assert.equal(state.publishDone, true);
    assert.equal(state.readyDone, false);
    assert.equal(state.current, "ready");
    assert.equal(state.canRelease, false);
  });

  it("marks the sequence done after release", () => {
    const plan = trainingLaunchPlan(
      row({
        previewed_at: "2026-08-18T12:00:00.000Z",
        development_status: "released",
        published: true,
        released_at: "2026-08-20T12:00:00.000Z",
      })
    );
    assert.equal(plan.current, "done");
    assert.equal(plan.kind, "view");
    assert.equal(plan.label, "Released");
    assert.ok(plan.steps.every((step) => step.state === "done"));
  });

  it("blocks launch from the archive without collapsing steps", () => {
    const plan = trainingLaunchPlan(
      row({
        development_status: "archived",
        previewed_at: "2026-08-18T12:00:00.000Z",
      })
    );
    assert.equal(plan.kind, "view");
    assert.equal(plan.label, "View");
    assert.match(plan.blocker ?? "", /archive/i);
    assert.equal(plan.shortBlocker, "Archived");
  });

  it("keeps Release behind Ready, checklist, and rights clearance", () => {
    const publishedReady = row({
      previewed_at: "2026-08-18T12:00:00.000Z",
      development_status: "ready_for_review",
      published: true,
    });
    assert.equal(canReleaseTraining(publishedReady), true);
    assert.equal(
      canReleaseTraining(publishedReady, {
        rightsBlocker:
          "Record written clearance for this source before releasing the training to Leaders.",
      }),
      false
    );
    assert.equal(
      canReleaseTraining(
        row({
          previewed_at: "2026-08-18T12:00:00.000Z",
          published: true,
        })
      ),
      false
    );
    const plan = trainingLaunchPlan(publishedReady, {
      rightsBlocker:
        "Record written clearance for this source before releasing the training to Leaders.",
    });
    assert.equal(plan.current, "release");
    assert.equal(plan.enabled, false);
    assert.equal(plan.kind, "fix");
    assert.equal(plan.shortBlocker, "Rights not cleared");
  });

  it("shortens the stage-walk gate for the list", () => {
    assert.equal(shortLaunchBlocker(PREVIEW_REQUIRED_ERROR), "Stage walk required");
    assert.equal(shortLaunchBlocker(FILM_RUNTIME_MISSING), "Runtime missing");
  });
});

describe("training launch surfaces", () => {
  it("puts Launch at the top of the detail page", () => {
    const page = readRepo("app/(admin)/admin/trainings/[id]/page.tsx");
    const launch = page.indexOf("TrainingLaunchDesk");
    const form = page.indexOf("action={updateTraining}");
    const publish = page.indexOf("action={setTrainingPublished}");
    const release = page.indexOf('id="release"');
    assert.ok(launch > 0);
    assert.ok(launch < form);
    assert.ok(form < publish);
    assert.ok(publish < release);
    assert.match(page, /canReleaseTraining/);
    assert.match(page, /catalogFlagLabel/);
    assert.match(page, /id="release"/);
    assert.doesNotMatch(page, /training\.published \? "Published"/);
    assert.doesNotMatch(page, /—/);
  });

  it("shows the next Launch action on the list with Stage secondary", () => {
    const page = readRepo("app/(admin)/admin/trainings/page.tsx");
    const action = readRepo("components/admin/training-launch-action.tsx");
    assert.match(page, /TRAINING_LAUNCH_LIST_LEAD/);
    assert.match(page, /actionHeader="Launch"/);
    assert.match(page, /TrainingLaunchRowAction/);
    assert.match(page, /trainingLaunchPlan/);
    assert.match(action, /showStageSecondary/);
    assert.match(action, />\s*Stage\s*</);
    assert.equal(
      TRAINING_LAUNCH_LIST_LEAD,
      "Stage walk → Mark Ready for Review → Publish → Release to organizations. Publish does not notify Leaders. Release does."
    );
    assert.doesNotMatch(page, /—/);
  });

  it("keeps Publish and Release as separate actions on the Launch desk", () => {
    const desk = readRepo("components/admin/training-launch-desk.tsx");
    assert.match(desk, /setTrainingPublished/);
    assert.match(desk, /releaseTraining/);
    assert.match(desk, /setDevelopmentStatus/);
    assert.match(desk, /ready_for_review/);
    assert.match(desk, /ReleaseTargets/);
    assert.match(desk, /Walk as Father/);
    assert.match(desk, /launchNowLabel/);
    assert.match(desk, /stageContinueLabel/);
    assert.match(desk, /TrainingLaunchWalkCue/);
    assert.doesNotMatch(desk, /publishAndReleaseTraining/);
    assert.doesNotMatch(desk, /—/);
  });

  it("puts the same Launch ladder on the Stage hub", () => {
    const page = readRepo("app/(admin)/admin/trainings/[id]/stage/page.tsx");
    const banner = readRepo("components/admin/training-stage-banner.tsx");
    const desk = readRepo("components/admin/training-stage-desk.tsx");
    const launch = readRepo("components/admin/training-launch-desk.tsx");
    const shell = readRepo("components/admin/training-stage-session-shell.tsx");
    const overview = readRepo("app/(admin)/admin/trainings/[id]/stage/overview/page.tsx");
    assert.match(page, /TrainingLaunchDesk/);
    assert.match(page, /surface="stage"/);
    assert.match(launch, /Next step/);
    assert.match(launch, /Walk as Father/);
    assert.match(launch, /stageContinueLabel/);
    assert.match(launch, /Edit training/);
    assert.match(banner, /Sandbox only/);
    assert.match(banner, /This is not release/);
    assert.match(banner, /Sandbox home/);
    assert.match(banner, /border-border bg-card/);
    assert.doesNotMatch(banner, />Snapshot</);
    assert.doesNotMatch(banner, /bg-primary\/10/);
    assert.doesNotMatch(desk, />Walk as Father</);
    assert.doesNotMatch(desk, /Catalog publish/);
    assert.doesNotMatch(desk, /Mark Stage walk complete/);
    assert.doesNotMatch(desk, /buttonVariants/);
    assert.match(desk, /Use Launch above/);
    assert.match(shell, /TrainingLaunchWalkCue/);
    assert.match(overview, /TrainingLaunchWalkCue/);
  });
});
