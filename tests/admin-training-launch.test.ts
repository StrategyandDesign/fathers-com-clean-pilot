import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { composeSkillPrompt, PREVIEW_REQUIRED_ERROR } from "../lib/admin/development";
import {
  TRAINING_LAUNCH_LIST_LEAD,
  shortLaunchBlocker,
  trainingLaunchPlan,
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
  it("starts at Stage walk when the preview is missing", () => {
    const plan = trainingLaunchPlan(row());
    assert.equal(plan.current, "stage");
    assert.equal(plan.kind, "stage");
    assert.equal(plan.label, "Stage");
    assert.equal(plan.detailLabel, "Open staging");
    assert.equal(plan.enabled, true);
    assert.equal(plan.steps[0].state, "current");
    assert.equal(plan.steps[1].state, "locked");
  });

  it("moves to Ready after the stage walk", () => {
    const plan = trainingLaunchPlan(
      row({ previewed_at: "2026-08-18T12:00:00.000Z" })
    );
    assert.equal(plan.current, "ready");
    assert.equal(plan.kind, "ready");
    assert.equal(plan.label, "Ready");
    assert.equal(plan.detailLabel, "Mark Ready for Review");
    assert.equal(plan.enabled, true);
    assert.equal(plan.blocker, null);
  });

  it("keeps Ready current but disabled when runtime is missing", () => {
    const plan = trainingLaunchPlan(
      row({ previewed_at: "2026-08-18T12:00:00.000Z" }, [
        session({ duration_seconds: null }),
      ])
    );
    assert.equal(plan.current, "ready");
    assert.equal(plan.enabled, false);
    assert.equal(plan.blocker, FILM_RUNTIME_MISSING);
    assert.equal(plan.shortBlocker, "Runtime missing");
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

  it("offers Release only after Publish", () => {
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
    assert.match(plan.href, /#launch$/);
  });

  it("does not skip Stage when a training was published early", () => {
    const plan = trainingLaunchPlan(row({ published: true }));
    assert.equal(plan.current, "stage");
    assert.equal(plan.kind, "stage");
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

  it("keeps Release behind rights clearance", () => {
    const plan = trainingLaunchPlan(
      row({
        previewed_at: "2026-08-18T12:00:00.000Z",
        development_status: "ready_for_review",
        published: true,
      }),
      { rightsBlocker: "Record written clearance for this source before releasing the training to Leaders." }
    );
    assert.equal(plan.current, "release");
    assert.equal(plan.enabled, false);
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
    const launch = page.indexOf("TrainingLaunchStrip");
    const form = page.indexOf("action={updateTraining}");
    const publish = page.indexOf("action={setTrainingPublished}");
    const release = page.indexOf('id="release"');
    assert.ok(launch > 0);
    assert.ok(launch < form);
    assert.ok(form < publish);
    assert.ok(publish < release);
    assert.match(page, /id="release"/);
    assert.doesNotMatch(page, /—/);
  });

  it("shows the next Launch action on the list", () => {
    const page = readRepo("app/(admin)/admin/trainings/page.tsx");
    assert.match(page, /TRAINING_LAUNCH_LIST_LEAD/);
    assert.match(page, /actionHeader="Launch"/);
    assert.match(page, /TrainingLaunchRowAction/);
    assert.match(page, /trainingLaunchPlan/);
    assert.equal(
      TRAINING_LAUNCH_LIST_LEAD,
      "Review a training, then Launch: Stage → Ready → Publish → Release. Publish does not notify Leaders. Release does."
    );
    assert.doesNotMatch(page, /—/);
  });

  it("keeps Publish and Release as separate actions", () => {
    const strip = readRepo("components/admin/training-launch-strip.tsx");
    assert.match(strip, /setTrainingPublished/);
    assert.match(strip, /releaseTraining/);
    assert.match(strip, /setDevelopmentStatus/);
    assert.match(strip, /ready_for_review/);
    assert.match(strip, /ReleaseTargets/);
    assert.doesNotMatch(strip, /—/);
  });
});
