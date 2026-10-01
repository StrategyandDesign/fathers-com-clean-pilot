import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { homePracticeCue } from "../lib/father/home";
import { filmWatchUnlocksCheckpoint, FILM_UNLOCK_RATIO } from "../lib/father/film-seat";
import {
  fridayCopyLine,
  isFridayStall,
  markLabel,
  pickFridayMan,
  weekIsComplete,
  weekMarksFromCards,
} from "../lib/manager/friday-desk";
import { en } from "../lib/i18n/messages/en";
import { findOverclaimHits } from "../lib/copy/overclaim-lexicon";

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

describe("film seat", () => {
  it("opens the checkpoint at 95 percent of a measured film", () => {
    assert.equal(FILM_UNLOCK_RATIO, 0.95);
    assert.equal(filmWatchUnlocksCheckpoint(341, 360), false);
    assert.equal(filmWatchUnlocksCheckpoint(342, 360), true);
    assert.equal(filmWatchUnlocksCheckpoint(360, 360), true);
    assert.equal(filmWatchUnlocksCheckpoint(0, 360), false);
    assert.equal(filmWatchUnlocksCheckpoint(400, null), false);
    assert.equal(filmWatchUnlocksCheckpoint(400, 0), false);
  });
});

describe("friday desk", () => {
  it("names one stalled claimed man and ignores a finished week", () => {
    assert.equal(weekIsComplete({ film: true, checkpoint: true, practice: true }), true);
    assert.equal(isFridayStall({ film: true, checkpoint: false, practice: false }, 0), true);
    assert.equal(isFridayStall({ film: false, checkpoint: false, practice: false }, 2), false);
    assert.equal(isFridayStall({ film: false, checkpoint: false, practice: false }, 7), true);
    assert.equal(isFridayStall({ film: true, checkpoint: true, practice: true }, 40), false);

    const picked = pickFridayMan([
      {
        fatherId: "new",
        name: "New",
        claimed: true,
        stalled: true,
        daysQuiet: 1,
      },
      {
        fatherId: "quiet",
        name: "Quiet",
        claimed: true,
        stalled: true,
        daysQuiet: 12,
      },
      {
        fatherId: "open",
        name: "Open",
        claimed: false,
        stalled: true,
        daysQuiet: 30,
      },
    ]);
    assert.equal(picked?.fatherId, "quiet");
    assert.equal(markLabel(true), "Y");
    assert.equal(
      fridayCopyLine("Quiet"),
      "Checking in on Quiet — film, checkpoint, practice. Need anything to finish this week?"
    );
    assert.doesNotMatch(fridayCopyLine("Quiet"), /answer|Did the film|Friday question/i);
  });

  it("reads this week's three marks from the open session", () => {
    const marks = weekMarksFromCards([
      {
        training: { id: "t", title: "Week", slug: "week" } as never,
        sessions: [],
        completed: 1,
        total: 8,
        assigned: true,
        gated: false,
        certificate: null,
        current: {
          session: { id: "s" } as never,
          progress: {
            id: "p",
            father_id: "f",
            session_id: "s",
            film_completed: true,
            checkin_completed: true,
            action_completed: false,
            checkin_answers: {},
            action_note: null,
            session_note: null,
            film_seconds: 300,
            status: "in_progress",
            completed_at: null,
          },
        },
      },
    ]);
    assert.deepEqual(marks, { film: true, checkpoint: true, practice: false });
  });
});

describe("father home strip", () => {
  it("keeps the practice cue on the keyline when the prompt is a skill question", () => {
    assert.equal(
      homePracticeCue({
        keyline: "Show up the same way.",
        action_prompt: "Which is the skill? A) Show up  B) Skip",
      }),
      "Show up the same way."
    );
    assert.equal(
      homePracticeCue({ keyline: "Show up.", action_prompt: "Call once this week." }),
      "Call once this week."
    );
  });

  it("does not paint shelves, streak, or a role chip on Father Home", () => {
    const page = readRepo("app/(father)/father/page.tsx");
    assert.match(page, /HomeWeek/);
    assert.doesNotMatch(page, /HomePathRow|HomeStreakRow|LeaderMeta|HomeUpNextCard|AssessmentHomeCard/);
    assert.equal(en.father.home.finishThisWeek, "Finish this week");
    assert.equal(findOverclaimHits(en.manager.desk.directorDoor).length, 0);
    assert.doesNotMatch(en.manager.desk.directorDoor, /PTSD|evidence-based|anger management|batterer/i);
    assert.match(en.manager.desk.directorDoor, /never pays/);
    assert.equal(
      en.manager.desk.coachDoor,
      "You hold the caseload. We hold the week. A human still owns the line."
    );
    assert.match(en.manager.desk.export, /complete and claimed/i);
    const cover = readRepo("components/father/home-week.tsx");
    assert.match(cover, /youtubeStillUrl/);
    assert.doesNotMatch(cover, /HomePathRow/);
  });
});
