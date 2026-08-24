import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { composeSkillPrompt, PREVIEW_REQUIRED_ERROR } from "../lib/admin/development";
import {
  TRAINING_LAUNCH_LIST_LEAD,
  canReleaseTraining,
  shortLaunchBlocker,
  trainingLaunchPlan,
  trainingLaunchState,
} from "../lib/admin/launch";
import { releaseFlashNotice } from "../lib/admin/release-flash";
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
  it("starts at Review when sessions are missing", () => {
    const state = trainingLaunchState(row({}, []));
    assert.equal(state.current, "review");
    assert.equal(state.steps[0].state, "current");
    const plan = trainingLaunchPlan(row({}, []));
    assert.equal(plan.kind, "fix");
    assert.equal(plan.label, "Fix: Session missing");
  });

  it("starts at Stage walk after Review when the preview is missing", () => {
    const state = trainingLaunchState(row());
    assert.equal(state.current, "stage");
    assert.equal(state.steps[0].state, "done");
    assert.equal(state.steps[1].state, "current");
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

  it("offers Release to Leaders only after Publish", () => {
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
    assert.equal(plan.detailLabel, "Release to Leaders");
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
    assert.match(page, /id="release"/);
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
      "Review a training, then Stage walk → Ready → Publish → Release to Leaders. Publish does not notify Leaders. Release does."
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
    assert.doesNotMatch(desk, /publishAndReleaseTraining/);
    assert.doesNotMatch(desk, /—/);
  });

  it("puts the same Launch ladder on the Stage hub", () => {
    const page = readRepo("app/(admin)/admin/trainings/[id]/stage/page.tsx");
    const banner = readRepo("components/admin/training-stage-banner.tsx");
    const desk = readRepo("components/admin/training-stage-desk.tsx");
    assert.match(page, /TrainingLaunchDesk/);
    assert.match(page, /surface="stage"/);
    assert.match(banner, /Sandbox only/);
    assert.match(banner, /Sandbox home/);
    assert.doesNotMatch(banner, />Snapshot</);
    assert.match(desk, /Leaders not notified/);
  });
});

describe("training release flash", () => {
  it("does not claim managers were notified when some emails fail", () => {
    assert.equal(
      releaseFlashNotice({
        scope: "all",
        targetCount: 3,
        newCount: 3,
        notified: true,
        notifyFailed: true,
        alreadyHave: "Those organizations already have this training.",
        audience: "managers",
      }),
      "Released to all organizations."
    );
    assert.equal(
      releaseFlashNotice({
        scope: "selected",
        targetCount: 1,
        newCount: 1,
        notified: true,
        notifyFailed: true,
        alreadyHave: "Those organizations already have this training.",
        audience: "managers",
      }),
      "Released to 1 organization."
    );
    assert.equal(
      releaseFlashNotice({
        scope: "selected",
        targetCount: 2,
        newCount: 2,
        notified: true,
        notifyFailed: true,
        alreadyHave: "Those organizations already have this training.",
        audience: "managers",
      }),
      "Released to 2 organizations."
    );
  });

  it("keeps the notified claim when every manager email sends", () => {
    assert.equal(
      releaseFlashNotice({
        scope: "all",
        targetCount: 3,
        newCount: 3,
        notified: true,
        notifyFailed: false,
        alreadyHave: "Those organizations already have this training.",
        audience: "managers",
      }),
      "Released to all organizations. Eligible managers were notified."
    );
    assert.equal(
      releaseFlashNotice({
        scope: "selected",
        targetCount: 1,
        newCount: 1,
        notified: true,
        notifyFailed: false,
        alreadyHave: "Those organizations already have this training.",
        audience: "managers",
      }),
      "Released to 1 organization. That manager was notified."
    );
  });

  it("keeps the email warning on the training release finish path", () => {
    const actions = readRepo("lib/admin/actions.ts");
    assert.match(actions, /releaseFlashNotice/);
    assert.match(
      actions,
      /Some manager emails didn’t send\. The training is still released for review\./
    );
    assert.match(actions, /error: result\.notifyFailed \? RELEASE_NOTIFY_WARNING/);
    assert.doesNotMatch(actions, /Eligible managers were notified\./);
  });
});
