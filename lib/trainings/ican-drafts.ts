import { composeSkillPrompt, skillPromptIsComplete } from "@/lib/admin/development";

export const ICAN_HOLD_VIDEO_URL = "https://www.youtube.com/watch?v=yo_nS0vpV4M";
export const ICAN_HOLD_DURATION_SECONDS = 300;
export const ICAN_DRAFT_MIGRATION =
  "supabase/migrations/20260824160000_seed_ican_draft_trainings.sql";
export const ICAN_RETURN_HOME_DRAFT_MIGRATION =
  "supabase/migrations/20260824170000_seed_return_home_draft_trainings.sql";
export const ICAN_RETURN_HOME_DRAFT_DESCRIPTION_MIGRATION =
  "supabase/migrations/20260824180000_update_return_home_draft_descriptions.sql";

export const ICAN_CEO_DRAFT_SLUGS = [
  "after-action-at-the-door",
  "direct-hours",
  "unscored-child",
  "midcourse-correction",
] as const;

export const ICAN_RETURN_HOME_DRAFT_SLUGS = [
  "calm-you-can-lend",
  "the-house-that-kept-going",
  "knowing-again",
] as const;

export const ICAN_DRAFT_SLUGS = [
  ...ICAN_CEO_DRAFT_SLUGS,
  ...ICAN_RETURN_HOME_DRAFT_SLUGS,
] as const;

export type IcanDraftSlug = (typeof ICAN_DRAFT_SLUGS)[number];
export type IcanPillar = "Involvement" | "Consistency" | "Awareness" | "Nurturance";

export type IcanPrompt = {
  stem: string;
  a: string;
  b: string;
  c: string;
};

export type IcanDraftSession = {
  sessionNumber: number;
  title: string;
  keyline: string;
  pillar: IcanPillar;
  checkin: IcanPrompt;
  action: IcanPrompt;
};

export type IcanDraftTraining = {
  slug: IcanDraftSlug;
  title: string;
  description: string;
  leaderSummary: string;
  orderIndex: number;
  sessions: IcanDraftSession[];
};

function session(
  sessionNumber: number,
  title: string,
  keyline: string,
  pillar: IcanPillar,
  checkin: IcanPrompt,
  action: IcanPrompt
): IcanDraftSession {
  return { sessionNumber, title, keyline, pillar, checkin, action };
}

export const ICAN_DRAFT_TRAININGS: IcanDraftTraining[] = [
  {
    slug: "after-action-at-the-door",
    title: "After-Action at the Door",
    description:
      "A day can go wrong in a doorway, a kitchen, a car. The miss is already done. The fathering is the next honest hour: you name what happened, you own the part that is yours, and you close it the same day with the person who was there. Then you put the clipboard down.\n\nThis is not a household review board. Ten minutes is enough. The child who overheard it needs a short, age-fit close. So does the other adult, when they were hit too. See the miss without spin, walk across the room, and close it before you sleep. How the repair lands matters more than how well you score yourself afterward. If the repair becomes a story you could tell for status, it failed the people at your table.\n\nThis draft stays unpublished.",
    leaderSummary:
      "Named, owned, closed, same day, then forgotten as a brand. Watch for forum anecdotes, long speeches, and pride dressed as patience. Super-admin draft. Not published. Not released. Sponsorship funds the organization, not a preferred seat.",
    orderIndex: 10,
    sessions: [
      session(
        1,
        "The clipboard stops at the door",
        "The clipboard stops at the door.",
        "Involvement",
        {
          stem: "What does Involvement ask at the door, according to this session?",
          a: "Bring the week's open items inside so the household can help close them",
          b: "Drop the clipboard before you enter, then be present with the people in the house",
          c: "Hand the clipboard to a child so they can track your follow-through",
        },
        {
          stem: "Which lived practice matches this session?",
          a: "Set the work packet down before you walk in, then greet the first person you see",
          b: "Finish two more notes in the driveway so you enter already caught up",
          c: "Tell the house you are still on a call and will be available later",
        }
      ),
      session(
        2,
        "Named (what happened, plain)",
        "Name what happened, in plain words.",
        "Awareness",
        {
          stem: "What does Awareness require when you name the miss?",
          a: "A polished story that protects your intent",
          b: "A plain sentence about what happened, without spin",
          c: "A private journal entry you never say out loud",
        },
        {
          stem: "Which action names the miss as this session teaches?",
          a: "Say one plain sentence about what happened to the person who was there",
          b: "Write a longer explanation for later, when you have the right words",
          c: "Wait until you can pair the miss with a win so the name lands softer",
        }
      ),
      session(
        3,
        "Owned (mine, no defense)",
        "Own it as yours. No defense.",
        "Involvement",
        {
          stem: "What does Involvement sound like when you own the miss?",
          a: "A shared-fault sentence that keeps your side safe",
          b: "A clear 'mine' with no defense and no explanation stacked on",
          c: "A promise to do better that skips saying the miss was yours",
        },
        {
          stem: "Which lived practice owns the miss?",
          a: "Say it was yours, then stop. Do not add a because.",
          b: "Explain the week on the road so they understand the pressure",
          c: "Ask them what they did first so ownership stays even",
        }
      ),
      session(
        4,
        "Closed (with the person who was there)",
        "Close it with the person who was there.",
        "Nurturance",
        {
          stem: "Where does Nurturance close the repair?",
          a: "In a note to yourself after the house is quiet",
          b: "With the person who was there, in the same day",
          c: "In a later summary once you have thought it through",
        },
        {
          stem: "Which action closes the repair as taught here?",
          a: "Go to the person who was there and finish the repair with them",
          b: "Close it in your head so you do not stir the house again",
          c: "Send a group message so everyone hears the close at once",
        }
      ),
      session(
        5,
        "Same day, not next week",
        "Same day, not next week.",
        "Consistency",
        {
          stem: "What Consistency does this session lock?",
          a: "Repair when the calendar opens next week",
          b: "Repair the same day, before the miss hardens",
          c: "Repair only if the other person asks",
        },
        {
          stem: "Which practice keeps the repair on the same day?",
          a: "Name, own, and close it before you sleep",
          b: "Park it for Sunday when you have a longer block",
          c: "Wait until the next travel week ends so you can do it well",
        }
      ),
      session(
        6,
        "Ten minutes is enough",
        "Ten minutes is enough.",
        "Consistency",
        {
          stem: "What time box does this session teach for repair?",
          a: "A long talk so the other person feels the weight",
          b: "About ten minutes. Named, owned, closed. Then stop.",
          c: "No time box. Stay until every feeling is processed",
        },
        {
          stem: "Which lived practice matches the ten-minute close?",
          a: "Set ten minutes, do the three steps, then drop it",
          b: "Open a longer debrief so nothing is left unsaid",
          c: "Skip the close if you cannot give it a full hour",
        }
      ),
      session(
        7,
        "Repair is not a story for forum",
        "Repair is not a story for forum.",
        "Awareness",
        {
          stem: "What does Awareness refuse in this session?",
          a: "Telling the person who was hurt",
          b: "Turning the repair into a story for the room",
          c: "Keeping the close inside the house",
        },
        {
          stem: "Which action keeps repair off the forum?",
          a: "Close it with the person who was there and do not retell it for status",
          b: "Share the repair as a leadership example this week",
          c: "Write the repair so it can be posted as follow-through",
        }
      ),
      session(
        8,
        "The child heard the miss",
        "The child heard the miss.",
        "Awareness",
        {
          stem: "What does Awareness notice after a miss in the house?",
          a: "Only the adult conversation, because children miss the details",
          b: "The child heard it, even if they said nothing",
          c: "The miss only counts if the child repeats it later",
        },
        {
          stem: "Which practice includes the child who heard the miss?",
          a: "If a child heard it, close a short repair with that child too",
          b: "Protect the child by never naming what they heard",
          c: "Ask the child to rate how the miss felt so you can track it",
        }
      ),
      session(
        9,
        "The other adult heard the miss",
        "The other adult heard the miss.",
        "Nurturance",
        {
          stem: "What Nurturance does this session ask toward the other adult?",
          a: "Let them infer the repair from a better next week",
          b: "Close it with them if they heard the miss",
          c: "Wait for them to raise it so you do not overstep",
        },
        {
          stem: "Which action repairs with the other adult?",
          a: "Name, own, and close it with the adult who heard the miss",
          b: "Repair only with the child and assume the adult is fine",
          c: "Send a polished note later so you do not have to say it live",
        }
      ),
      session(
        10,
        "When pride wants to wait",
        "When pride wants to wait, go first.",
        "Nurturance",
        {
          stem: "What does Nurturance do when pride wants to wait?",
          a: "Wait until you feel ready so the words are clean",
          b: "Go first the same day, even when pride wants a delay",
          c: "Wait until they apologize, then match them",
        },
        {
          stem: "Which lived practice beats the wait?",
          a: "Start the repair the same day, before pride writes a better speech",
          b: "Sit with it overnight so you do not sound proud",
          c: "Ask a peer whether you should wait until next week",
        }
      ),
      session(
        11,
        "Lagging indicators come later",
        "Lagging indicators come later.",
        "Awareness",
        {
          stem: "What does Awareness do with lagging indicators this week?",
          a: "Build a household chart so you can see the trend",
          b: "Leave them for later. This week's work is the same-day close.",
          c: "Use them tonight to decide whether the repair counted",
        },
        {
          stem: "Which action keeps lagging indicators later?",
          a: "Close today's miss and do not score the house this week",
          b: "Start a weekly indicator so you know if repair is working",
          c: "Ask the family to mark whether the week improved",
        }
      ),
      session(
        12,
        "A countable week of repairs",
        "A countable week means named closes, not a score.",
        "Consistency",
        {
          stem: "What makes a week countable in this course?",
          a: "A score of how many repairs you completed",
          b: "Named, owned, closed misses, then the clipboard dropped",
          c: "A report you can bring to the next room",
        },
        {
          stem: "Which practice finishes a countable week?",
          a: "Keep same-day closes all week. Do not turn the week into a scorecard.",
          b: "Tally repairs and share the number as follow-through",
          c: "Skip a close if the week already looks strong",
        }
      ),
    ],
  },
  {
    slug: "direct-hours",
    title: "Direct Hours",
    description:
      "A child does not need another dashboard. They need hours of care the firm cannot have. Direct Hours is a constraint, not a target: one device-down block each weekday you are in town, and one longer block on the weekend.\n\nThe phone leaves the room. Errands with a screen nearby do not count. Travel weeks do not get a pretend win. You restore the first block the day you return. Show up in the window you named. Know what is actually care. Keep the weekday and the weekend. Give attention the child can feel, without scanning their face for payoff. If you are winning Direct Hours in a chat, stop.\n\nThis draft stays unpublished.",
    leaderSummary:
      "Hours of care, not a target. Watch for streaks, hour goals, and virtue speeches about boundaries. A good week is quiet windows the child can count on. Super-admin draft. Not published. Not released. Sponsorship funds the organization, not a preferred seat.",
    orderIndex: 11,
    sessions: [
      session(
        1,
        "Hours, not dashboards",
        "These are hours, not dashboards.",
        "Awareness",
        {
          stem: "What does Awareness refuse when you set Direct Hours?",
          a: "A visible hours board so the week stays honest",
          b: "A dashboard. The block is time with a person, not a tracked target.",
          c: "Any named block, because naming it creates pressure",
        },
        {
          stem: "Which practice keeps hours off a dashboard?",
          a: "Name the care block on your own calendar and do not publish a score",
          b: "Log hours so you can compare weeks",
          c: "Post the block as a status so others can follow",
        }
      ),
      session(
        2,
        "Device down",
        "Device down.",
        "Involvement",
        {
          stem: "What does Involvement require during the care block?",
          a: "Keep the device nearby in case the firm needs you",
          b: "Device down. Body in the room with the child.",
          c: "Device on silent, still in hand, so you stay available",
        },
        {
          stem: "Which lived practice is device down?",
          a: "Put the phone in another room for the whole block",
          b: "Glance only when the lock screen lights up",
          c: "Keep the laptop open so you can return to work faster",
        }
      ),
      session(
        3,
        "The weekday short block",
        "One short weekday block when you are in town.",
        "Consistency",
        {
          stem: "What Consistency does the weekday block ask?",
          a: "A long evening whenever the deal allows",
          b: "One short, device-down care block each weekday you are in town",
          c: "A flexible window you fill if leftover time appears",
        },
        {
          stem: "Which action keeps the weekday short block?",
          a: "Hold one short in-town block today, device down, with the child",
          b: "Stack leftover minutes at the end of the day and call it the block",
          c: "Skip today and double the block on Thursday",
        }
      ),
      session(
        4,
        "The weekend longer block",
        "One longer weekend block.",
        "Consistency",
        {
          stem: "What extra Consistency does the weekend ask?",
          a: "The same short weekday block, just on Saturday",
          b: "One longer weekend care block, still device down",
          c: "A packed family outing that can be posted later",
        },
        {
          stem: "Which practice is the weekend longer block?",
          a: "Give one longer device-down block this weekend, without a target",
          b: "Fill the weekend with errands and count being nearby",
          c: "Save the longer block for a week that looks better on paper",
        }
      ),
      session(
        5,
        "Constraint, not target",
        "A constraint, not a target.",
        "Awareness",
        {
          stem: "How does Awareness treat the care block?",
          a: "As a target to beat so the week looks strong",
          b: "As a constraint you keep, not a number you chase",
          c: "As optional if the firm week is heavy",
        },
        {
          stem: "Which action treats the block as a constraint?",
          a: "Keep the named block. Do not add hours to win the week.",
          b: "Stretch the block to hit a better number",
          c: "Drop the block when you are already ahead",
        }
      ),
      session(
        6,
        "The firm does not get these hours",
        "The firm does not get these hours.",
        "Involvement",
        {
          stem: "Who do these hours belong to, according to Involvement?",
          a: "The firm first, then the child if the deal is quiet",
          b: "The child. The firm does not get these hours.",
          c: "Whoever asked last",
        },
        {
          stem: "Which practice keeps the hours from the firm?",
          a: "Hold the block even when a deal message lands",
          b: "Take the call and shift the child to later",
          c: "Let the firm book over the block this once",
        }
      ),
      session(
        7,
        "What counts as care",
        "Care is presence with the child, not a nearby body.",
        "Awareness",
        {
          stem: "What counts as care in this session?",
          a: "Being in the house while you finish work",
          b: "Device-down presence with the child in their world",
          c: "A purchased experience you can mention later",
        },
        {
          stem: "Which action counts as care here?",
          a: "Stay in the child's activity with the device down",
          b: "Sit nearby on email and call it presence",
          c: "Buy a gift in place of the block",
        }
      ),
      session(
        8,
        "Travel weeks",
        "On a travel week, keep the constraint on the road or the deal week.",
        "Consistency",
        {
          stem: "How does Consistency treat a week on the road?",
          a: "Pause Direct Hours until you are back in town",
          b: "Keep a named constraint for that week, road or deal, then resume the in-town blocks",
          c: "Record a message and count it as the weekday block",
        },
        {
          stem: "Which practice holds a travel week?",
          a: "Name the road or deal constraint for this week and keep one contact the child can count on",
          b: "Let the week go and make it up with a bigger weekend later",
          c: "Tell the forum you are traveling so the missed hours make sense",
        }
      ),
      session(
        9,
        "Protecting without virtue signaling",
        "Protect the block. Do not perform it.",
        "Nurturance",
        {
          stem: "How does Nurturance protect the block?",
          a: "Announce the block so people see you keep it",
          b: "Protect it quietly. Do not use it as a signal.",
          c: "Drop it if protecting it would look rigid",
        },
        {
          stem: "Which action protects without signaling?",
          a: "Keep the block and do not tell a room about it",
          b: "Mention the block so others can copy the practice",
          c: "Post that you went device down this week",
        }
      ),
      session(
        10,
        "The child notices Consistency",
        "The child notices Consistency, not the speech.",
        "Consistency",
        {
          stem: "What does the child notice, according to this session?",
          a: "The speech about why this week was hard",
          b: "The kept block, repeated",
          c: "The number of hours you meant to give",
        },
        {
          stem: "Which practice lets the child notice Consistency?",
          a: "Keep the same named block this week without a speech",
          b: "Explain the method so they appreciate the effort",
          c: "Skip once and tell them you are still consistent in intent",
        }
      ),
      session(
        11,
        "Lagging indicators",
        "Lagging indicators stay later. Keep the block now.",
        "Awareness",
        {
          stem: "What does Awareness do with lagging indicators in Direct Hours?",
          a: "Build a weekly hours chart so you can see care working",
          b: "Leave them later. This week's work is keeping the constraint.",
          c: "Ask the child if they felt the hours so you have a read",
        },
        {
          stem: "Which action leaves lagging indicators later?",
          a: "Keep this week's blocks and do not score the household",
          b: "Start a simple indicator so you know if the blocks matter",
          c: "Collect a family rating after the weekend block",
        }
      ),
      session(
        12,
        "Keep twelve weeks",
        "Keep twelve weeks of the constraint.",
        "Consistency",
        {
          stem: "What Consistency closes this course?",
          a: "A strong final week that makes up for missed blocks",
          b: "Twelve weeks of the same constraint, not a target",
          c: "A report of hours at the end of the season",
        },
        {
          stem: "Which practice keeps twelve weeks?",
          a: "Hold this week's blocks and return next week to the same constraint",
          b: "Declare the season done if this week was clean",
          c: "Add extra hours this week so the twelve look complete",
        }
      ),
    ],
  },
  {
    slug: "unscored-child",
    title: "The Unscored Child",
    description:
      "Almost every hour in a child's week already has a score. This course protects one that does not. You sit with this child and produce nothing you can report. No lesson, no sport framed as development, no college signal.\n\nKen's work on knowing your child lives here as a weekly hour. Who they are now. What they are into. What frightens them. What is coming. You listen longer than you talk. Moods are something you sit with, not something you fix. Be there. Stay with the child in the present tense. Keep the hour. Extract no return. If the hour yields insight you could pitch on Monday, it failed.\n\nThis draft stays unpublished.",
    leaderSummary:
      "One unscored hour a week. Watch for extraction and insight he wants to report. A good week is the hour kept and the emptiness protected. Super-admin draft. Not published. Not released. Sponsorship funds the organization, not a preferred seat.",
    orderIndex: 12,
    sessions: [
      session(
        1,
        "Every Other Hour Is Scored",
        "Every other hour is scored. This one is not.",
        "Awareness",
        {
          stem: "What does Awareness name about the rest of the week?",
          a: "Most hours with a child should produce a visible result",
          b: "Every other hour is already scored. This hour must stay free of that.",
          c: "Scoring helps the child take the hour seriously",
        },
        {
          stem: "Which practice treats this hour as unscored?",
          a: "Give the hour with no result to show when it ends",
          b: "Set a small goal so the hour does not waste time",
          c: "Ask what they learned so you have something to keep",
        }
      ),
      session(
        2,
        "This Hour Refuses the Resume",
        "This hour refuses the résumé.",
        "Awareness",
        {
          stem: "What does this hour refuse?",
          a: "Play that cannot be named later",
          b: "Any résumé, college, or outcome signal",
          c: "Questions about the child's actual interests",
        },
        {
          stem: "Which action refuses the résumé?",
          a: "Spend the hour on what they chose, with nothing to file later",
          b: "Steer toward an activity that could matter later",
          c: "Take a photo so the hour has a record",
        }
      ),
      session(
        3,
        "Who Is This Child Now",
        "Meet the child who is here now.",
        "Involvement",
        {
          stem: "Who does Involvement meet in this session?",
          a: "The child you remember from last year",
          b: "This child, as they are now",
          c: "The child you are training them to become",
        },
        {
          stem: "Which practice meets the child now?",
          a: "Ask one question about their life this week and follow what they say",
          b: "Start from your old picture and check whether they still fit it",
          c: "Tell them who they are becoming so they have a map",
        }
      ),
      session(
        4,
        "What They Are Into (Not What You Hope)",
        "Learn what they are into, not what you hope.",
        "Awareness",
        {
          stem: "What does Awareness gather in this hour?",
          a: "Interests that could become useful later",
          b: "What they are into now, even if it is not what you hope",
          c: "A list of activities you can coach",
        },
        {
          stem: "Which action learns what they are into?",
          a: "Enter their interest for the hour and leave your hope outside",
          b: "Redirect toward something with a longer payoff",
          c: "Suggest three better interests and let them pick",
        }
      ),
      session(
        5,
        "What Frightens Them",
        "Learn what frightens them, without fixing it this hour.",
        "Awareness",
        {
          stem: "How does Awareness hold what frightens them?",
          a: "As a problem to solve before the hour ends",
          b: "As something to hear. This hour does not fix it.",
          c: "As a topic to avoid so the hour stays light",
        },
        {
          stem: "Which practice hears fear without a fix?",
          a: "If they name a fear, listen. Do not turn it into a lesson.",
          b: "Offer three steps they can take this week",
          c: "Change the subject so the hour does not get heavy",
        }
      ),
      session(
        6,
        "What Is Coming in Six Months",
        "Ask what is coming in six months. Do not load it.",
        "Awareness",
        {
          stem: "What does Awareness do with the next six months?",
          a: "Turn their answer into a plan you can track",
          b: "Hear what is coming from their side, without loading college or outcome",
          c: "Supply the milestones they should already see",
        },
        {
          stem: "Which action asks about six months without loading it?",
          a: "Ask what they see coming, then listen. No advice hour.",
          b: "Map their answer onto school or sport goals",
          c: "Tell them what should be coming so they are ready",
        }
      ),
      session(
        7,
        "Questions Only, No Advice",
        "Questions only. No advice.",
        "Involvement",
        {
          stem: "What Involvement move does this session lock?",
          a: "A short lesson after each answer",
          b: "Questions only. No advice in this hour.",
          c: "Advice first, then a question to check they heard it",
        },
        {
          stem: "Which lived practice is questions only?",
          a: "Ask, then wait. If advice rises, swallow it.",
          b: "Ask, then add the one thing they need to hear",
          c: "Skip questions and tell a story from your week",
        }
      ),
      session(
        8,
        "Listen Longer Than You Talk",
        "Listen longer than you talk.",
        "Nurturance",
        {
          stem: "What Nurturance ratio does this session teach?",
          a: "Talk enough to guide, then let them fill gaps",
          b: "Listen longer than you talk",
          c: "Keep a balanced back and forth so the hour feels fair",
        },
        {
          stem: "Which action listens longer than you talk?",
          a: "Give them the floor and keep your words short",
          b: "Match their time with your own stories so they feel close",
          c: "Summarize their words into a lesson they can keep",
        }
      ),
      session(
        9,
        "Nothing to Show at the End",
        "Nothing to show at the end.",
        "Awareness",
        {
          stem: "What should you have at the end of the hour?",
          a: "A note you can share about what the hour produced",
          b: "Nothing to show. The hour was the practice.",
          c: "A photo or a skill they can demonstrate",
        },
        {
          stem: "Which practice leaves nothing to show?",
          a: "End the hour without a product, recap, or proof",
          b: "Write three takeaways so the hour was not empty",
          c: "Ask them to name what they gained",
        }
      ),
      session(
        10,
        "Moods Are Data You Do Not Optimize",
        "Moods are data you do not tune.",
        "Awareness",
        {
          stem: "How does Awareness treat a mood in this hour?",
          a: "As a state to improve before you finish",
          b: "As data you notice and leave alone",
          c: "As a reason to end the hour early",
        },
        {
          stem: "Which action leaves a mood untuned?",
          a: "Notice the mood. Stay. Do not try to upgrade it.",
          b: "Cheer them up so the hour ends on a better note",
          c: "Name a fix they can run after you leave",
        }
      ),
      session(
        11,
        "Presence Without Extracting a Return",
        "Be present. Extract nothing.",
        "Nurturance",
        {
          stem: "What does Nurturance refuse to extract?",
          a: "Warmth, because closeness should be earned",
          b: "A return: gratitude, progress, or a usable story",
          c: "Time, because an hour without return is waste",
        },
        {
          stem: "Which practice is presence without a return?",
          a: "Stay for the hour and leave without taking a story or a result",
          b: "Ask how the hour helped so you know it was worth it",
          c: "Collect one line you can use later when someone asks how they are",
        }
      ),
      session(
        12,
        "Keep One Unscored Hour Every Week",
        "Keep one unscored hour every week.",
        "Consistency",
        {
          stem: "What Consistency closes this course?",
          a: "An excellent hour when the week is light",
          b: "One unscored hour every week, kept",
          c: "A monthly long session that replaces the weekly hour",
        },
        {
          stem: "Which practice keeps the unscored hour?",
          a: "Put next week's hour on the calendar and keep it free of outcome",
          b: "Skip a tight week and make the next hour longer",
          c: "Turn the hour into a lesson week when something important is coming",
        }
      ),
    ],
  },
  {
    slug: "midcourse-correction",
    title: "Midcourse Correction",
    description:
      "You do not stop the ship to become a better father. You make a small turn while it is still moving. Midcourse correction is one countable act a week that means nothing to the firm and cannot be reported as leadership development.\n\nPick it before Sunday ends. Do it once, plainly. Do not announce it. Hot weeks move the act earlier, not later. Stay midcourse: a small turn toward home, counted quietly, never dressed as leadership. If it could go in a forum update, pick a different act.\n\nThis draft stays unpublished.",
    leaderSummary:
      "One unreportable act a week, done once, not announced. Watch for reinvention speeches and fathering told as leadership. Super-admin draft. Not published. Not released. Sponsorship funds the organization, not a preferred seat.",
    orderIndex: 13,
    sessions: [
      session(
        1,
        "Ken's Phrase Inside I CAN",
        "Ken's phrase sits inside I CAN: Involvement, Consistency, Awareness, Nurturance.",
        "Involvement",
        {
          stem: "Where does Ken's phrase sit in this course?",
          a: "Outside the home, as a firm operating system",
          b: "Inside I CAN: Involvement, Consistency, Awareness, and Nurturance",
          c: "In place of I CAN, as a faster weekly method",
        },
        {
          stem: "Which practice starts the course inside I CAN?",
          a: "Name the four: Involvement, Consistency, Awareness, Nurturance. Then pick one small home act.",
          b: "Translate I CAN into a firm scorecard you can run at home",
          c: "Skip the four and jump to a visible win",
        }
      ),
      session(
        2,
        "Awareness of What to Turn",
        "Awareness names the one thing to turn.",
        "Awareness",
        {
          stem: "What does Awareness turn this week?",
          a: "The whole pattern, so the correction is complete",
          b: "One small thing you can actually turn",
          c: "Whatever the firm week left unfinished",
        },
        {
          stem: "Which action shows Awareness of what to turn?",
          a: "Name one small home turn for this week. Leave the rest.",
          b: "List five changes so the midcourse is thorough",
          c: "Wait for a clearer season before you name anything",
        }
      ),
      session(
        3,
        "Meaningless to the Firm (The Filter)",
        "If the firm can use it, it fails the filter.",
        "Awareness",
        {
          stem: "What filter does this session lock?",
          a: "Choose an act the firm would respect",
          b: "Choose an act that means nothing to the firm",
          c: "Choose an act you can mention in both rooms",
        },
        {
          stem: "Which practice applies the filter?",
          a: "Pick a home act the firm cannot use",
          b: "Pick an act that also trains leadership",
          c: "Pick an act you could brief as culture",
        }
      ),
      session(
        4,
        "Unreportable as Leadership Development",
        "If you can report it as leadership development, it is the wrong act.",
        "Awareness",
        {
          stem: "When is the act the wrong one?",
          a: "When nobody at work will understand it",
          b: "When you can report it as leadership development",
          c: "When it takes less than ten minutes",
        },
        {
          stem: "Which action stays unreportable?",
          a: "Do a home act you would not put in a development note",
          b: "Choose an act that could sit in a development plan",
          c: "Write the act so it reads as growth if asked",
        }
      ),
      session(
        5,
        "Involvement: Pick the Act Before the Week Starts",
        "Involvement picks the act before the week starts.",
        "Involvement",
        {
          stem: "When does Involvement pick the act?",
          a: "When leftover time appears midweek",
          b: "Before the week starts",
          c: "After you see how the deal week lands",
        },
        {
          stem: "Which practice is Involvement this week?",
          a: "Name the act before Monday begins, then keep that name",
          b: "Wait until Friday to see what you can still do",
          c: "Keep three options and pick the one that fits the firm week",
        }
      ),
      session(
        6,
        "Involvement: Do It Once, Plainly",
        "Involvement does the act once, plainly.",
        "Involvement",
        {
          stem: "How does Involvement complete the act?",
          a: "Repeat it until it feels like a habit",
          b: "Do it once, plainly, this week",
          c: "Describe it clearly even if you do not get to it",
        },
        {
          stem: "Which lived practice does the act once, plainly?",
          a: "Do the named act one time this week, without a speech",
          b: "Talk through the act with the child so they see the intent",
          c: "Do a larger version so once is enough to notice",
        }
      ),
      session(
        7,
        "Do Not Announce It",
        "Do not announce it.",
        "Awareness",
        {
          stem: "What does Awareness keep off the air?",
          a: "The child's name, but the act can be shared",
          b: "The act itself. Do not announce it.",
          c: "Only public posts. A small room can hear it.",
        },
        {
          stem: "Which action does not announce the act?",
          a: "Do it and leave it unadvertised",
          b: "Tell one peer so you have accountability",
          c: "Mention it as a quiet example of follow-through",
        }
      ),
      session(
        8,
        "Consistency When the Week Gets Hot",
        "Consistency keeps the act when the week gets hot.",
        "Consistency",
        {
          stem: "What does Consistency do on a hot week?",
          a: "Park the act until the deal cools",
          b: "Keep the same named act, even when the week gets hot",
          c: "Replace it with a note so the week still counts",
        },
        {
          stem: "Which practice holds a hot week?",
          a: "Do the named act once this week, road or deal included",
          b: "Skip and mark the week as too hot",
          c: "Announce that you will resume when the week calms",
        }
      ),
      session(
        9,
        "Awareness: Correction Is Not Reinvention",
        "Awareness corrects. It does not reinvent the man.",
        "Awareness",
        {
          stem: "What kind of turn is a midcourse correction?",
          a: "A full reinvention so the next season looks new",
          b: "A small correction. Not a new identity.",
          c: "A public reset so people can see the change",
        },
        {
          stem: "Which action is correction, not reinvention?",
          a: "Turn one small thing and leave the rest of the man alone",
          b: "Launch a new personal program this week",
          c: "Tell the house you are becoming someone different",
        }
      ),
      session(
        10,
        "Nurturance: What You Will Not Put on a Slide",
        "Nurturance keeps the act off a slide.",
        "Nurturance",
        {
          stem: "What will Nurturance not put on a slide?",
          a: "Firm work. Home acts can be shown as culture.",
          b: "This week's act. If it fits a slide, it failed the filter.",
          c: "Names. The act itself is fine to display.",
        },
        {
          stem: "Which practice keeps the act off a slide?",
          a: "Do the act and refuse to make it material",
          b: "Save a clean sentence in case someone asks for an example",
          c: "Turn the act into a short lesson others can use",
        }
      ),
      session(
        11,
        "Consistency Across Twelve Quiet Weeks",
        "Consistency is twelve quiet weeks, not one visible week.",
        "Consistency",
        {
          stem: "What does Consistency look like across this course?",
          a: "One strong week you can remember",
          b: "Twelve quiet weeks of the same kind of act",
          c: "A midseason spike when you have more room",
        },
        {
          stem: "Which practice keeps twelve quiet weeks?",
          a: "Do this week's act and return next week without a display",
          b: "Make this week larger so the season has a peak",
          c: "Skip a quiet week because nobody would notice",
        }
      ),
      session(
        12,
        "Stay Midcourse: I CAN Holds",
        "Stay midcourse. I CAN holds.",
        "Nurturance",
        {
          stem: "What holds when you stay midcourse?",
          a: "A finished identity you can present",
          b: "I CAN: Involvement, Consistency, Awareness, Nurturance",
          c: "A new method you invent for the next season",
        },
        {
          stem: "Which action stays midcourse?",
          a: "Keep one firm-meaningless act next week, inside I CAN, unannounced",
          b: "Close the course with a summary you could share",
          c: "Replace I CAN with whatever worked this month",
        }
      ),
    ],
  },
  {
    slug: "calm-you-can-lend",
    title: "Calm You Can Lend",
    description:
      "This training is for fathers who cycle back into family life after hard stretches away. You may walk through the door still wired. Your body is still high. The people inside did not live that stretch with you. Children borrow the adult nervous system they meet. Other caregivers may borrow it too when they are there. They are optional, not assumed.\n\nPurpose: notice the surge as a body signal, come down with the same short ritual every return, and lend calm the people inside can use. What changes over twelve weeks is the door itself. You stop dumping leftover load onto the first person you see. You arrive as someone the house can borrow steadiness from.\n\nConcrete objectives: name body tells at the door; keep one short come-down every return; stay present once you are down; lend soft voice and proximity to a child before correction; lend calm to whoever is inside when present; repair same day after a snap; protect boring hours without posting calm as a win.\n\nHow a week works: watch one short teaching film, answer one checkpoint, then live one practice that week. No scoreboard. No peer forum for wins. Tone is ordinary house language and Ken Canfield's I CAN spine (Involvement, Consistency, Awareness, Nurturance). Education for steadiness at home. Not treatment. Not a diagnosis path.",
    leaderSummary:
      "Father returns from hard stretches still wired. Course owns come-down at the door and lending calm outward. Ken Canfield I CAN: Awareness of the surge, Consistency of a return ritual, Involvement once down, Nurturance in calm others can borrow. Success looks like the same short door ritual, soft presence with child (and with whoever is inside when present), same-day repair after a snap, and no peer scorekeeping. Kill the week if come-down becomes a tip he coaches others with and never uses at his own door, or if body language becomes diagnosis talk. Super-admin draft. Not published. Not released. Sponsorship funds the organization, not a preferred seat.",
    orderIndex: 14,
    sessions: [
      session(
        1,
        "Body at the door",
        "Your body arrives before your words do.",
        "Awareness",
        {
          stem: "What does Awareness name first at the door, according to this session?",
          a: "A speech about the stretch, so the house understands why you are still high",
          b: "The body signal that arrived before your words",
          c: "Whether anyone inside looks ready for you to speak",
        },
        {
          stem: "Which lived practice matches this session?",
          a: "Walk in talking so the house knows you made it",
          b: "Name one body signal silently before you speak, then enter",
          c: "Ask the first person you see to rate how tense you look",
        }
      ),
      session(
        2,
        "Come down",
        "Same short come-down every return. Not a performance.",
        "Consistency",
        {
          stem: "What Consistency does this session lock at the door?",
          a: "A new come-down each return, so it stays honest",
          b: "The same short come-down every return, not a performance",
          c: "A come-down only when someone inside is watching",
        },
        {
          stem: "Which practice keeps the come-down as taught here?",
          a: "Greet first, then settle later if the house is loud",
          b: "Run the same short four-beat come-down before you engage the house",
          c: "Skip the ritual when the stretch was short",
        }
      ),
      session(
        3,
        "Home noise with new meaning",
        "Kid noise is not a threat signal. It is home.",
        "Awareness",
        {
          stem: "What does Awareness do with kid noise after a stretch away?",
          a: "Treat it as the same threat signal you scanned for while away",
          b: "Hear it as home, not as a threat signal",
          c: "Ask the house to stay quiet until you finish coming down",
        },
        {
          stem: "Which action gives home noise new meaning?",
          a: "Correct the first loud sound so the room drops to work-quiet",
          b: "Stay with one noisy or messy cue and silently rename it as home",
          c: "Leave until the house is silent",
        }
      ),
      session(
        4,
        "Lend calm to child",
        "Children borrow the adult's nervous system. Lend one they can use.",
        "Nurturance",
        {
          stem: "What Nurturance does the child borrow in this session?",
          a: "A speech about why you were gone",
          b: "Your come-down calm, offered so they have a nervous system they can use",
          c: "A plan for how they should feel about the return",
        },
        {
          stem: "Which lived practice lends calm a child can borrow?",
          a: "Tell the child to calm down so you can settle",
          b: "After you come down, give five unhurried minutes they can borrow",
          c: "Hand them a task so the energy has somewhere to go",
        }
      ),
      session(
        5,
        "Lend calm to whoever is inside",
        "Whoever is inside on a loaded day may need to borrow you too.",
        "Nurturance",
        {
          stem: "Who does Nurturance lend calm to in this session?",
          a: "Only the child, because other adults should already be steady",
          b: "Whoever is inside on a loaded day, without assuming who",
          c: "Only one assumed adult role, if that person is present",
        },
        {
          stem: "Which action lends calm without assuming who is inside?",
          a: "Wait to offer calm until you know which adult is home",
          b: "After you come down, lend steady presence to whoever is there, or rehearse if the house is empty",
          c: "Ask who is in charge so you know where to put the calm",
        }
      ),
      session(
        6,
        "Snap and same-day repair",
        "When you snap after a stretch, same-day repair beats a better speech later.",
        "Awareness",
        {
          stem: "What does Awareness choose after a snap that came from leftover load?",
          a: "A better speech later, once you have the right words",
          b: "Same-day repair with the person who felt it",
          c: "An explanation of the stretch so the snap makes sense",
        },
        {
          stem: "Which practice closes a snap as taught here?",
          a: "Park the snap for a longer talk when the week is lighter",
          b: "Close it the same day with the person who felt it, in two plain sentences",
          c: "Ask them to forget it because you were still coming down",
        }
      ),
      session(
        7,
        "Borrowed calm under kid heat",
        "Kid heat is when they need to borrow you most.",
        "Nurturance",
        {
          stem: "What Nurturance holds when the child runs hot?",
          a: "Match their heat so they know you are with them",
          b: "Lend calm then. That is when they need to borrow you most.",
          c: "Leave until they are easy again",
        },
        {
          stem: "Which action stays lendable under kid heat?",
          a: "Raise your voice so the heat ends faster",
          b: "Lower your voice, stay near, and do not match the spike",
          c: "Send them to another room until you feel ready",
        }
      ),
      session(
        8,
        "Protect boring hours",
        "Boring hours after you come down rebuild more than a big reunion night.",
        "Consistency",
        {
          stem: "What Consistency rebuilds more than a big reunion night?",
          a: "A special night that makes up for the time gone",
          b: "A boring hour after you come down, kept ordinary",
          c: "A speech about how you will be different now",
        },
        {
          stem: "Which practice protects a boring hour?",
          a: "Fill the first evening with an outing so the return feels special",
          b: "Keep one ordinary hour after the come-down and do not upgrade it",
          c: "Skip the quiet hour if the house already looks fine",
        }
      ),
      session(
        9,
        "When pride wants to stay high",
        "Pride wants to stay high. The door still asks you to come down.",
        "Awareness",
        {
          stem: "What does Awareness refuse when pride wants to stay high?",
          a: "The door ritual, because staying high proves you can handle the house",
          b: "Pride that says skip the come-down. The door still asks you to come down.",
          c: "Any ritual, because pride means you already arrived well",
        },
        {
          stem: "Which action beats pride that wants to stay high?",
          a: "Enter still high and call it being sharp for the house",
          b: "Run the come-down anyway, even when pride says you are fine",
          c: "Ask a peer if staying high looks stronger",
        }
      ),
      session(
        10,
        "Lagging warmth",
        "Warmth may lag. Do not score the hug.",
        "Awareness",
        {
          stem: "What does Awareness do with lagging warmth after you lend calm?",
          a: "Wait for a smile or hug before you count the ritual",
          b: "Leave the warmth later. Do not score the hug.",
          c: "Ask if it worked so you know whether to keep the ritual",
        },
        {
          stem: "Which practice drops the score for 48 hours?",
          a: "Check faces to see if the calm paid off",
          b: "Take no temperature. Live the next ordinary steps.",
          c: "Ask the house to show more warmth so the week counts",
        }
      ),
      session(
        11,
        "A countable week of come-downs",
        "Countable means you can name the come-downs. It does not mean you publish them.",
        "Consistency",
        {
          stem: "What makes a week countable in this course?",
          a: "A published streak or a peer story about the ritual",
          b: "Come-downs you can name. Not a count you publish.",
          c: "Credit for effort, even when the door ritual was skipped",
        },
        {
          stem: "Which practice finishes a countable week of come-downs?",
          a: "Share the tally so the week has a witness",
          b: "Keep a private count of kept come-downs, then destroy the list",
          c: "Skip a return if you already talked about the method",
        }
      ),
      session(
        12,
        "Keep the ritual without scoring it",
        "Keep the come-down. Drop the scoreboard.",
        "Consistency",
        {
          stem: "What Consistency keeps, and what does it drop?",
          a: "The scoreboard, so you can prove the week worked",
          b: "The come-down. Drop the scoreboard.",
          c: "A peer tip you can pass along, even if you skip your own door",
        },
        {
          stem: "Which lived practice keeps the ritual without scoring it?",
          a: "Tally come-downs so you have a number for later",
          b: "Keep the standing door rule this week and do not score or share it",
          c: "Teach the method this week and use it later when you have time",
        }
      ),
    ],
  },
  {
    slug: "the-house-that-kept-going",
    title: "The House That Kept Going",
    description:
      "This training is for fathers who return to a house that kept running while they were gone. Someone kept the routines: a co-parent, kin, a program, or the child. The wound repeats when you walk in and rewrite the rules as if the house waited for your management.\n\nPurpose: see the load in plain words, thank it without a speech, and join the system that already works instead of building a second cockpit. What changes over twelve weeks is how you reenter. You ask before you change a rule. You take one real load the house names. Trust rebuilds through small kept promises and same-day repair when you snap.\n\nConcrete objectives: inventory what kept going without you; name the carrier without assuming who it was; thank once, quietly; ask before changing a house rule; join one existing rhythm; complete one asked load; refuse a parallel ops plan; repair same day with whoever was there; treat trust as lagging, not a same-night score.\n\nHow a week works: one short film, one checkpoint, one lived practice. No household scoreboard. No turning keepers of the house into a status story. Tone is calm, practical, and spouse-safe: no default to a mother or partner. Ken Canfield's I CAN spine holds the arc. Education for joining a running house. Not therapy. Not a second cockpit.",
    leaderSummary:
      "Father rejoins a house that ran without him. Carrier may be co-parent, kin, program, or child. Ken Canfield I CAN: Awareness of the load, Involvement in one named load done fully, Consistency of small promises, Nurturance in tone and same-day repair. Success looks like ask-before-rule-change, one joined rhythm, no parallel cockpit, and trust treated as lagging. Kill the week if the carrier becomes a COO or if gratitude covers taking the wheel again. Super-admin draft. Not published. Not released. Sponsorship funds the organization, not a preferred seat.",
    orderIndex: 15,
    sessions: [
      session(
        1,
        "The house kept going",
        "While you were gone, the house kept going.",
        "Awareness",
        {
          stem: "What does Awareness name first in this session?",
          a: "How much the house suffered without your system",
          b: "While you were gone, the house kept going",
          c: "Which person failed to keep the house at your standard",
        },
        {
          stem: "Which lived practice matches this session?",
          a: "Walk in ready to restore the way you ran things",
          b: "Say one plain sentence: while you were gone, the house kept going",
          c: "Ask who dropped the ball so you know where to start",
        }
      ),
      session(
        2,
        "See the load",
        "See the load in plain words. Whoever carried it.",
        "Awareness",
        {
          stem: "What does Awareness do with the load that kept the house going?",
          a: "Turn it into a title for whoever stayed, like an operator role",
          b: "See it in plain words, whoever carried it, without a default person",
          c: "Assume one default adult carried it, then thank that person",
        },
        {
          stem: "Which action sees the load as taught here?",
          a: "Guess the load from your old picture of the house",
          b: "Name one real load in plain words, as the house actually ran",
          c: "Skip naming the load so you can start fresh",
        }
      ),
      session(
        3,
        "Thank without theater",
        "Thank without making it a speech.",
        "Nurturance",
        {
          stem: "What Nurturance does this session ask?",
          a: "A public speech so the load is finally seen",
          b: "A plain thank-you, without theater",
          c: "A thank-you that also explains how you will take over now",
        },
        {
          stem: "Which practice thanks without theater?",
          a: "Give a long tribute so the week has a moment",
          b: "Say a short thank-you to whoever kept a named routine, then stop",
          c: "Post the gratitude so others can see you noticed",
        }
      ),
      session(
        4,
        "Ask before you change a rule",
        "Ask before you change a rule.",
        "Involvement",
        {
          stem: "What does Involvement do before a rule changes?",
          a: "Change it on day one so the house feels you are back",
          b: "Ask the people who kept the house before you change a rule",
          c: "Change it quietly and explain later if anyone objects",
        },
        {
          stem: "Which action asks before you change a rule?",
          a: "Swap one rule tonight so the return has a mark",
          b: "Ask first. Leave the running rule in place until they answer.",
          c: "Announce the new rule and invite comments after it starts",
        }
      ),
      session(
        5,
        "Join the system that already works",
        "Join what already works.",
        "Involvement",
        {
          stem: "What Involvement move does this session lock?",
          a: "Build a better system beside the one that ran while you were gone",
          b: "Join the system that already works",
          c: "Watch for a week, then install your own plan",
        },
        {
          stem: "Which lived practice joins what already works?",
          a: "Start a parallel routine so you have your own cockpit",
          b: "Step into one existing routine and keep it the way it already runs",
          c: "Rewrite the week so it matches how you work on the road",
        }
      ),
      session(
        6,
        "One load the house names",
        "Take one load the house names. Do it fully.",
        "Involvement",
        {
          stem: "Which load does Involvement take this week?",
          a: "The load you think they needed most",
          b: "One load the house names, done fully",
          c: "Every load, so you catch up faster",
        },
        {
          stem: "Which practice takes one named load fully?",
          a: "Pick three loads and do a piece of each",
          b: "Take the one load they name and finish it without handing it back",
          c: "Offer to oversee the loads and assign them out",
        }
      ),
      session(
        7,
        "No second cockpit",
        "Do not install a second cockpit.",
        "Consistency",
        {
          stem: "What Consistency refuses in this session?",
          a: "Joining a routine you did not design",
          b: "A second cockpit beside the house that already runs",
          c: "Asking before you add a new track",
        },
        {
          stem: "Which action keeps a second cockpit out?",
          a: "Add your own tracking so both systems can compare",
          b: "Keep one running system. Do not stand up a second one.",
          c: "Run your version on weekends and theirs on weekdays",
        }
      ),
      session(
        8,
        "When you snap at the system",
        "Snapping at the system is information.",
        "Awareness",
        {
          stem: "What does Awareness do with a snap at the running house?",
          a: "Treat it as proof the house needs your system back",
          b: "Treat it as information. The snap is yours to read.",
          c: "Ignore it so you do not have to name it",
        },
        {
          stem: "Which practice uses the snap as information?",
          a: "Use the snap to justify changing a rule tonight",
          b: "Name the snap as yours, then return to the running system",
          c: "Ask the house to defend how they ran things",
        }
      ),
      session(
        9,
        "Same-day repair with whoever was there",
        "Repair same day with whoever was there.",
        "Nurturance",
        {
          stem: "Where does Nurturance close a miss in this session?",
          a: "With whoever you assume kept the house, even if they were not there",
          b: "Same day, with whoever was actually there",
          c: "In a later speech once you have the right words",
        },
        {
          stem: "Which action repairs with whoever was there?",
          a: "Wait to see who usually carries the house, then repair with that person",
          b: "Close it the same day with the person who was present",
          c: "Repair only with the child and skip the adult who heard it",
        }
      ),
      session(
        10,
        "The child saw the override",
        "The child saw the override.",
        "Nurturance",
        {
          stem: "What does Nurturance notice if you override the running house?",
          a: "Only the adult reaction, because children miss the power move",
          b: "The child saw the override, even if they said nothing",
          c: "The override only counts if someone complains",
        },
        {
          stem: "Which practice includes the child who saw the override?",
          a: "Protect the child by never naming what they saw",
          b: "If a child saw you take the wheel, close a short repair with that child too",
          c: "Ask the child to rate the override so you can track trust",
        }
      ),
      session(
        11,
        "Lagging trust",
        "Trust lags. Keep small promises.",
        "Awareness",
        {
          stem: "What does Awareness do with lagging trust this week?",
          a: "Push for a reunion talk so trust catches up",
          b: "Leave trust later. Keep small promises now.",
          c: "Score how trusted you feel so you know if joining is working",
        },
        {
          stem: "Which action keeps small promises while trust lags?",
          a: "Ask the house to trust you faster because you thanked them",
          b: "Keep one small named promise today. Do not demand the feeling.",
          c: "Take the wheel again so the house sees you are useful",
        }
      ),
      session(
        12,
        "A countable week of joining",
        "Join for a week. Do not take over.",
        "Consistency",
        {
          stem: "What Consistency closes this course?",
          a: "A week of taking over so the house can rest",
          b: "A week of joining the running house, without taking the wheel",
          c: "A new ops plan you leave behind when you go again",
        },
        {
          stem: "Which practice finishes a countable week of joining?",
          a: "End the week by installing your preferred system",
          b: "Join for the week. Do not take over. Drop any scorecard.",
          c: "Summarize the house as a team you now lead",
        }
      ),
    ],
  },
  {
    slug: "knowing-again",
    title: "Knowing Again",
    description:
      "This training is for fathers whose children changed across stretches away. Interests, fears, friends, and how they want you all move. Coming home with yesterday's picture creates miss after miss. Knowing is never finished when absence cycles.\n\nPurpose: update the picture after every return, ask before you assume, and offer countable presence that fits the child in front of you. What changes over twelve weeks is how you meet them. You stop forcing a reunion script. You make small deposits that match who they are now. Frequency after each stretch beats one big make-up weekend.\n\nConcrete objectives: notice what grew while you were gone; rewrite a private child-now note; ask once and listen longer; treat hesitation as information; make one matching deposit; show up again after the next stretch; put presence before providing; soft-repair a miss with the child same day; optionally use another caregiver as an ally, never as a required messenger; destroy the list at week's end.\n\nHow a week works: one short film, one checkpoint, one lived practice. If child contact is unavailable, update the private note or rehearse the ask. No talent review. No growth dashboard. Tone is warm, unhurried, and spouse-safe. Ken Canfield's I CAN spine (Involvement, Consistency, Awareness, Nurturance) holds the work. Education for knowing your child again. Not diagnostic. Not résumé extraction.",
    leaderSummary:
      "Father re-knows a child who grew across cyclic absence. Ken Canfield I CAN: Awareness of who they are now, Involvement in matching deposits, Consistency of frequency over make-up weekends, Nurturance with hesitation. Success looks like an updated picture, ask-before-assume, soft presence, and no résumé extraction from the child. Kill the week if knowing becomes a talent review, growth dashboard, or forced reunion. Super-admin draft. Not published. Not released. Sponsorship funds the organization, not a preferred seat.",
    orderIndex: 16,
    sessions: [
      session(
        1,
        "The child who grew",
        "Meet the child who grew.",
        "Awareness",
        {
          stem: "Who does Awareness meet after a stretch away?",
          a: "The child you remember from before you left",
          b: "The child who grew while you were gone",
          c: "The child you hope they became",
        },
        {
          stem: "Which lived practice meets the child who grew?",
          a: "Start from your old picture and see what still fits",
          b: "Meet this child as they are now, without the old script",
          c: "Tell them who they were so they can help you catch up",
        }
      ),
      session(
        2,
        "Update the picture",
        "Update the picture. Drop the old one.",
        "Awareness",
        {
          stem: "What does Awareness do with the old picture?",
          a: "Keep it as the base and add notes",
          b: "Update it. Drop the old one.",
          c: "File both pictures so you can compare later",
        },
        {
          stem: "Which action updates the picture as taught here?",
          a: "Hold the old picture until you have enough new data",
          b: "Drop one old assumption today and look again",
          c: "Build a profile so the next return is faster",
        }
      ),
      session(
        3,
        "Ask before you assume",
        "Ask before you assume.",
        "Involvement",
        {
          stem: "What Involvement move does this session lock?",
          a: "Assume from the last stretch, then confirm if you have time",
          b: "Ask before you assume",
          c: "Ask a required messenger so you do not have to ask the child",
        },
        {
          stem: "Which practice asks before you assume?",
          a: "Fill in the blank from memory, then play",
          b: "Ask one question about their life now and follow the answer",
          c: "Wait for another adult to brief you before you speak to the child",
        }
      ),
      session(
        4,
        "Hesitation is information",
        "Hesitation is information, not rejection.",
        "Nurturance",
        {
          stem: "How does Nurturance read hesitation in this session?",
          a: "As rejection you should push through with a reunion script",
          b: "As information, not rejection",
          c: "As a mood to fix before the hour ends",
        },
        {
          stem: "Which action treats hesitation as information?",
          a: "Press for a hug so the return looks complete",
          b: "Stay. Notice the hesitation. Do not force a reunion.",
          c: "Leave and come back only when they look ready",
        }
      ),
      session(
        5,
        "Small deposits that fit",
        "One small deposit that fits today's child.",
        "Involvement",
        {
          stem: "What Involvement deposit does this session ask?",
          a: "A large make-up gesture that covers the stretch away",
          b: "One small deposit that fits today's child",
          c: "A deposit that could also look good on a talent list",
        },
        {
          stem: "Which lived practice is a small deposit that fits?",
          a: "Buy something bigger than last time so they feel the return",
          b: "Give one small, fitting presence they can use today",
          c: "Plan a showcase so the deposit has a result",
        }
      ),
      session(
        6,
        "Frequency after cycles",
        "Frequency beats a make-up weekend.",
        "Consistency",
        {
          stem: "What Consistency beats a make-up weekend?",
          a: "One large weekend that pays the stretch back",
          b: "Frequency. Show up again after the next stretch.",
          c: "A message that explains why the next stretch will be shorter",
        },
        {
          stem: "Which practice chooses frequency over a make-up weekend?",
          a: "Stack one big weekend and call the cycle closed",
          b: "Name the next kept time and keep it, even if it is small",
          c: "Wait for a free weekend that can make up the missed days",
        }
      ),
      session(
        7,
        "Presence before providing",
        "Presence before providing.",
        "Involvement",
        {
          stem: "What does Involvement put first in this session?",
          a: "A provision that proves you thought of them while away",
          b: "Presence, before providing",
          c: "A plan for what they should want next",
        },
        {
          stem: "Which action puts presence before providing?",
          a: "Hand over the gift first so the return has a mark",
          b: "Be in their world first. Let provision wait.",
          c: "Ask what they want so you can provide before you sit down",
        }
      ),
      session(
        8,
        "When you missed a milestone",
        "Name the missed milestone without extracting a resume.",
        "Awareness",
        {
          stem: "How does Awareness name a missed milestone?",
          a: "Ask them to walk you through every win so you can catch up",
          b: "Name it plainly. Do not extract a resume.",
          c: "Skip it so you do not make the miss heavier",
        },
        {
          stem: "Which practice names the miss without a resume?",
          a: "Have them list what you missed so you can file it",
          b: "Say you missed that milestone, then stop extracting",
          c: "Turn the miss into a growth note you can keep",
        }
      ),
      session(
        9,
        "Soft repair with the child",
        "Soft repair. No forced reunion.",
        "Nurturance",
        {
          stem: "What Nurturance does a soft repair refuse?",
          a: "Naming the miss at all",
          b: "A forced reunion script",
          c: "Staying if the child hesitates",
        },
        {
          stem: "Which action is a soft repair?",
          a: "Push the reunion until they play along",
          b: "Offer a short, unforced repair and let them set the pace",
          c: "Ask another adult to make the child come to you",
        }
      ),
      session(
        10,
        "Optional ally in knowing",
        "An ally may help you see. They are not required.",
        "Awareness",
        {
          stem: "How does Awareness treat another caregiver in this session?",
          a: "As a required messenger you must wait on",
          b: "As an optional ally who may help you see, not a required one",
          c: "As a required default adult who should brief you",
        },
        {
          stem: "Which practice keeps the ally optional?",
          a: "Refuse to ask the child until another adult reports",
          b: "If an ally is part of the week, you may ask. You still meet the child yourself.",
          c: "Assume one default adult will translate the child for you",
        }
      ),
      session(
        11,
        "Lagging closeness",
        "Closeness lags. Keep showing up.",
        "Awareness",
        {
          stem: "What does Awareness do with lagging closeness?",
          a: "Wait to show up until closeness returns",
          b: "Leave closeness later. Keep showing up now.",
          c: "Score closeness so you know if knowing-again is working",
        },
        {
          stem: "Which action keeps showing up while closeness lags?",
          a: "Ask the child to act closer so the week counts",
          b: "Show up again today without demanding the feeling",
          c: "Pause until the child initiates",
        }
      ),
      session(
        12,
        "A countable week of knowing again",
        "Know again for a week. Then destroy the list.",
        "Consistency",
        {
          stem: "What Consistency closes this course?",
          a: "A kept profile you can reuse on the next return",
          b: "A week of knowing again, then destroy the list",
          c: "A talent review so the next stretch has a baseline",
        },
        {
          stem: "Which practice finishes a countable week of knowing again?",
          a: "Save the notes as a growth dashboard",
          b: "Know them this week, then destroy the list",
          c: "Share the profile with a room so the work is visible",
        }
      ),
    ],
  },
];

export function icanDraftBySlug(slug: string) {
  return ICAN_DRAFT_TRAININGS.find((training) => training.slug === slug) ?? null;
}

export function icanDraftsForSlugs(slugs: readonly string[]) {
  return slugs.map((slug) => {
    const training = icanDraftBySlug(slug);
    if (!training) {
      throw new Error(`I CAN draft catalog is missing ${slug}`);
    }
    return training;
  });
}

export function icanDraftPromptText(prompt: IcanPrompt) {
  const text = composeSkillPrompt(prompt);
  if (!text) {
    throw new Error("I CAN draft prompt is empty");
  }
  return text;
}

export function assertIcanDraftCatalog() {
  if (ICAN_DRAFT_TRAININGS.length !== ICAN_DRAFT_SLUGS.length) {
    throw new Error("I CAN draft catalog is missing a locked slug");
  }

  ICAN_DRAFT_TRAININGS.forEach((training, index) => {
    if (training.slug !== ICAN_DRAFT_SLUGS[index]) {
      throw new Error(`I CAN draft order drifted at ${training.slug}`);
    }
    if (training.sessions.length !== 12) {
      throw new Error(`${training.slug} must have 12 sessions`);
    }
    training.sessions.forEach((row, sessionIndex) => {
      if (row.sessionNumber !== sessionIndex + 1) {
        throw new Error(`${training.slug} session order drifted`);
      }
      if (/^session\s+\d+$/i.test(row.title)) {
        throw new Error(`${training.slug} still has a Session N placeholder`);
      }
      if (!skillPromptIsComplete(icanDraftPromptText(row.checkin))) {
        throw new Error(`${training.slug} #${row.sessionNumber} check-in is incomplete`);
      }
      if (!skillPromptIsComplete(icanDraftPromptText(row.action))) {
        throw new Error(`${training.slug} #${row.sessionNumber} action is incomplete`);
      }
    });
  });
}

function sqlLiteral(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function sqlTextBlock(value: string) {
  return `E${sqlLiteral(value.replaceAll("\n", "\\n"))}`;
}

export function renderIcanDraftMigrationSql(options?: {
  trainings?: IcanDraftTraining[];
  heading?: string;
}) {
  const trainings = options?.trainings ?? icanDraftsForSlugs(ICAN_CEO_DRAFT_SLUGS);
  const heading = options?.heading ?? "-- Seed four Super-admin I CAN draft trainings.";
  const trainingValues = trainings.map((training) => {
    return `  (
    ${sqlLiteral(training.slug)},
    ${sqlLiteral(training.title)},
    ${sqlLiteral(training.description)},
    ${sqlLiteral(training.leaderSummary)},
    12,
    ${training.orderIndex},
    false,
    null,
    'in_development'
  )`;
  }).join(",\n");

  const sessionValues = trainings.flatMap((training) =>
    training.sessions.map((row) => {
      return `    (
      ${sqlLiteral(training.slug)},
      ${row.sessionNumber},
      ${sqlLiteral(row.title)},
      ${sqlLiteral(row.keyline)},
      ${sqlLiteral(ICAN_HOLD_VIDEO_URL)},
      ${ICAN_HOLD_DURATION_SECONDS},
      ${sqlTextBlock(icanDraftPromptText(row.checkin))},
      ${sqlTextBlock(icanDraftPromptText(row.action))}
    )`;
    })
  ).join(",\n");

  return `${heading}
-- Unpublished and unreleased. Films are Micah's hold placeholder.
-- Idempotent: re-run updates catalog rows in place by slug / session_number.
-- Keep these rows unpublished. Do not call release RPCs.

insert into public.trainings (
  slug,
  title,
  description,
  leader_summary,
  session_count,
  order_index,
  published,
  released_at,
  development_status
)
values
${trainingValues}
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  leader_summary = excluded.leader_summary,
  session_count = excluded.session_count,
  order_index = excluded.order_index,
  published = false,
  released_at = null,
  first_published_at = null,
  first_released_at = null,
  released_by = null,
  development_status = 'in_development';

with catalog (
  training_slug,
  session_number,
  title,
  keyline,
  video_url,
  duration_seconds,
  checkin_prompt,
  action_prompt
) as (
  values
${sessionValues}
)
insert into public.sessions (
  training_id,
  session_number,
  title,
  keyline,
  video_url,
  order_index,
  duration_seconds,
  checkin_prompt,
  action_prompt
)
select
  trainings.id,
  catalog.session_number,
  catalog.title,
  catalog.keyline,
  catalog.video_url,
  catalog.session_number,
  catalog.duration_seconds,
  catalog.checkin_prompt,
  catalog.action_prompt
from catalog
join public.trainings on trainings.slug = catalog.training_slug
on conflict (training_id, session_number) do update
set
  title = excluded.title,
  keyline = excluded.keyline,
  video_url = excluded.video_url,
  order_index = excluded.order_index,
  duration_seconds = excluded.duration_seconds,
  checkin_prompt = excluded.checkin_prompt,
  action_prompt = excluded.action_prompt;
`;
}

export function renderReturnHomeDraftMigrationSql() {
  return renderIcanDraftMigrationSql({
    trainings: icanDraftsForSlugs(ICAN_RETURN_HOME_DRAFT_SLUGS),
    heading: "-- Seed three Super-admin return-home I CAN draft trainings.",
  });
}

export function renderReturnHomeDraftDescriptionUpdateSql() {
  const trainings = icanDraftsForSlugs(ICAN_RETURN_HOME_DRAFT_SLUGS);
  const values = trainings
    .map((training) => {
      return `  (
    ${sqlLiteral(training.slug)},
    ${sqlTextBlock(training.description)},
    ${sqlTextBlock(training.leaderSummary)}
  )`;
    })
    .join(",\n");

  return `-- Update father-facing descriptions for the three return-home Super-admin drafts.
-- Unpublished and unreleased. Does not change sessions, titles, or publish state.
-- Idempotent: re-run updates description and leader_summary in place by slug.
-- Keep these rows unpublished. Do not call release RPCs.

update public.trainings as trainings
set
  description = catalog.description,
  leader_summary = catalog.leader_summary,
  published = false
from (
  values
${values}
) as catalog(slug, description, leader_summary)
where trainings.slug = catalog.slug;
`;
}
