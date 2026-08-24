import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { finishSessionProgressAfterSave } from "../lib/father/session-progress-follow-up";
import { CHECKIN_NOTE_KEY, checkinQuestionsFor } from "../lib/father/session-questions";
import { en } from "../lib/i18n/messages/en";
import { he } from "../lib/i18n/messages/he";

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

describe("session film unlock", () => {
  it("lets a father continue to check-in without a YouTube complete event", () => {
    const film = readRepo("app/(father)/father/sessions/[sessionId]/page.tsx");
    const player = readRepo("components/father/session-film-player.tsx");
    const header = readRepo("components/father/session-header.tsx");
    const actions = readRepo("lib/father/actions.ts");
    const checkin = readRepo("app/(father)/father/sessions/[sessionId]/checkin/page.tsx");

    assert.match(film, /markFilmWatched/);
    assert.match(film, /father\.session\.continueCheckin/);
    assert.match(actions, /export async function markFilmWatched/);
    assert.match(actions, /film_completed: true/);
    assert.doesNotMatch(player, /film_completed/);
    assert.doesNotMatch(player, /markFilmWatched/);
    assert.doesNotMatch(player, /onStateChange|YT\.Player/);
    assert.match(header, /unlocked: unlockAll \|\| filmCompleted/);
    assert.match(checkin, /if \(!context\.progress\?\.film_completed\)/);
  });

  it("keeps session 1 on film, check-in, and action of that session", () => {
    const film = readRepo("app/(father)/father/sessions/[sessionId]/page.tsx");
    const checkin = readRepo("app/(father)/father/sessions/[sessionId]/checkin/page.tsx");
    const action = readRepo("app/(father)/father/sessions/[sessionId]/action/page.tsx");
    assert.match(film, /current="film"/);
    assert.match(checkin, /current="checkin"/);
    assert.match(action, /current="action"/);
    assert.match(film, /SessionFilmPlayer/);
    assert.match(checkin, /submitCheckin/);
  });
});

describe("check-in save follow-up", () => {
  it("leaves Saving after a successful check-in even if revalidate never finishes", async () => {
    let followUpRan = false;
    let formPending = true;
    let redirected = false;

    finishSessionProgressAfterSave({
      followUp: () => {
        followUpRan = true;
      },
      schedule: (task) => {
        setTimeout(task, 50);
      },
      redirect: () => {
        redirected = true;
        formPending = false;
      },
    });

    assert.equal(redirected, true);
    assert.equal(formPending, false);
    assert.equal(followUpRan, false);
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(formPending, false);
    assert.equal(followUpRan, false);
  });

  it("does not await reminder flush or walk revalidate before the check-in redirect", () => {
    const actions = readRepo("lib/father/actions.ts");
    const submit = actions.slice(
      actions.indexOf("export async function submitCheckin"),
      actions.indexOf("function actionPath")
    );
    const watched = actions.slice(
      actions.indexOf("export async function markFilmWatched"),
      actions.indexOf("export async function submitCheckin")
    );
    assert.match(submit, /finishSessionProgressAfterSave/);
    assert.match(submit, /schedule: after/);
    assert.match(submit, /persistProgress/);
    assert.doesNotMatch(submit, /await saveProgress/);
    assert.doesNotMatch(submit, /await flushDueReminders/);
    assert.doesNotMatch(submit, /await queueActionReminder/);
    assert.match(watched, /finishSessionProgressAfterSave/);
    assert.match(watched, /persistProgress/);
    assert.doesNotMatch(watched, /await saveProgress/);
  });
});

describe("check-in labels and write-in", () => {
  it("uses the rehab HCD session labels", () => {
    assert.equal(en.father.session.skipForNow, "Back to dashboard");
    assert.equal(en.father.session.lockItIn, "Save and move on");
    assert.equal(en.father.session.changeMoment, "Change when");
    assert.equal(en.father.session.whenWillYou, "When will you try this?");
    assert.equal(en.father.session.actionTryAt, "When will you try this?");
    assert.equal(en.father.session.questionOf, "Question {n} of {total}");
    assert.equal(en.father.session.checkinLabel, "One question about the film");
    assert.match(en.father.start.welcomeBody, /one question/);
    assert.doesNotMatch(en.father.start.welcomeBody, /three questions/);
    assert.equal(he.father.session.skipForNow, "חזרה ללוח הבקרה");
    assert.equal(he.father.session.lockItIn, "שמירה והמשך");
    assert.equal(he.father.session.changeMoment, "שינוי הזמן");
    assert.equal(he.father.session.whenWillYou, "מתי תנסה את זה?");
    assert.match(he.father.start.welcomeBody, /שאלה אחת/);
    assert.doesNotMatch(he.father.start.welcomeBody, /שלוש שאלות/);
  });

  it("shows Question 1 of N and an optional write-in after the choice", () => {
    const fields = readRepo("components/father/session-checkin-fields.tsx");
    const father = readRepo("app/(father)/father/sessions/[sessionId]/checkin/page.tsx");
    const practice = readRepo(
      "app/(manager)/manager/practice/sessions/[sessionId]/checkin/page.tsx"
    );
    const questions = checkinQuestionsFor({
      session_number: 1,
      title: "Body at the door",
    });
    assert.equal(questions.length, 1);
    assert.match(fields, /CHECKIN_NOTE_KEY/);
    assert.equal(CHECKIN_NOTE_KEY, "notes");
    assert.match(fields, /questionOf/);
    assert.match(father, /father\.session\.questionOf/);
    assert.match(father, /father\.session\.noteLabel/);
    assert.match(father, /autoAdvance=\{false\}/);
    assert.match(practice, /father\.session\.noteLabel/);
    assert.match(en.father.session.notePlaceholder, /body signal or the learning/i);
    assert.doesNotMatch(en.father.session.notePlaceholder, /peer forum/i);
  });
});
