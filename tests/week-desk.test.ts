import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { homePracticeCue, showHomePractice } from "../lib/father/home";
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
    assert.equal(showHomePractice("Show up the same way.", "Show up the same way.", "Feelings"), false);
    assert.equal(showHomePractice("Feelings", "Name it.", "Feelings"), false);
    assert.equal(showHomePractice("Call once this week.", "Show up.", "Feelings"), true);
    assert.equal(showHomePractice("", "Show up.", "Feelings"), true);
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
    assert.equal(en.father.home.cardMeta, "1 film · {n} min · then practice");
    const cover = readRepo("components/father/home-week.tsx");
    assert.match(cover, /HOUSE_STILL_SRC/);
    assert.match(cover, /filmRuntimeMinutes/);
    assert.match(cover, /showHomePractice/);
    assert.match(cover, /bottom-0 h-1\/3 bg-gradient-to-t from-black\/80 to-transparent/);
    assert.doesNotMatch(cover, /youtubeStillUrl|HomePathRow|via-black|backdrop-blur|\bblur-/);
    const film = readRepo("app/(father)/father/sessions/[sessionId]/page.tsx");
    const player = readRepo("components/father/session-film-player.tsx");
    const nav = readRepo("components/layout/app-nav.tsx");
    const header = readRepo("components/father/session-header.tsx");
    assert.match(film, /HOUSE_STILL_SRC/);
    assert.match(player, /hideChrome: true/);
    assert.match(player, /setPlaying\(true\)/);
    assert.match(player, /overlay=\{false\}/);
    assert.match(player, /bottom-0 h-1\/3 bg-gradient-to-t from-black\/80 to-transparent/);
    assert.doesNotMatch(player, /Watch on YouTube|onStateChange|YT\.Player|via-black|backdrop-blur|\bblur-/);
    assert.match(nav, /labelKey: "nav.thisWeek"/);
    assert.match(nav, /path\.startsWith\("\/father\/sessions"\)/);
    assert.doesNotMatch(
      nav.slice(nav.indexOf("labelKey: \"nav.trainings\""), nav.indexOf("labelKey: \"nav.assessments\"")),
      /father\/sessions/
    );
    assert.match(header, /father\.session\.thisWeek/);
    assert.match(header, /const onFilm = current === "film"/);
    assert.equal(en.nav.thisWeek, "This week");
    assert.equal(en.father.session.thisWeek, "This week");
    const still = readFileSync(
      fileURLToPath(new URL("../public/brand/covers/ken-teacher-cover-solo-16x9.jpg", import.meta.url))
    );
    let width = 0;
    let height = 0;
    for (let i = 0; i < still.length - 8; i += 1) {
      if (still[i] !== 0xff) continue;
      const marker = still[i + 1];
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        height = still.readUInt16BE(i + 5);
        width = still.readUInt16BE(i + 7);
        break;
      }
    }
    assert.ok(width >= 448, `cover width ${width} is an upscale of a tight crop`);
    assert.ok(Math.abs(width / height - 16 / 9) < 0.02);
  });

  it("ends the Leader first paint at Export", () => {
    const desk = readRepo("components/manager/friday-desk.tsx");
    const page = readRepo("app/(manager)/manager/page.tsx");
    assert.match(desk, /manager\.desk\.export/);
    assert.match(desk, /grid-cols-3/);
    assert.match(desk, /manager\.desk\.colCheckpoint/);
    assert.match(desk, /manager\.desk\.colPractice/);
    assert.doesNotMatch(desk, /assignTraining|assignAssessment|coachDoor|overflow-x-auto|min-w-\[40rem\]/);
    const deskAt = page.indexOf("<FridayDesk");
    const moreAt = page.indexOf("<details");
    assert.ok(deskAt > 0 && moreAt > deskAt);
    assert.doesNotMatch(page.slice(moreAt, moreAt + 120), /\sopen[\s>]/);
    assert.match(page.slice(moreAt), /manager\.desk\.coachDoor/);
    assert.doesNotMatch(page.slice(0, moreAt), /manager\.desk\.coachDoor/);
  });
});
