import { composeSkillPrompt, skillPromptIsComplete } from "@/lib/admin/development";

export const ICAN_HOLD_VIDEO_URL = "https://www.youtube.com/watch?v=yo_nS0vpV4M";
export const ICAN_HOLD_DURATION_SECONDS = 300;
export const ICAN_DRAFT_MIGRATION =
  "supabase/migrations/20260824160000_seed_ican_draft_trainings.sql";

export const ICAN_DRAFT_SLUGS = [
  "after-action-at-the-door",
  "direct-hours",
  "unscored-child",
  "midcourse-correction",
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
    description: "Name it. Own it. Close it. Same day. Then drop the clipboard.",
    leaderSummary:
      "Ken Canfield I CAN (Involvement, Consistency, Awareness, Nurturance) applied to same-day repair. Ten minutes. Named, owned, and closed with the person who was there. The clipboard stops at the door. Super-admin draft. Not published. Not released to organizations. Kill the week if repair becomes a forum story or a family scorecard. Sponsorship funds the organization, not a preferred seat.",
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
      "One device-down care block each weekday in town. One longer weekend block. A constraint, not a target.",
    leaderSummary:
      "Ken Canfield I CAN applied to device-down care blocks. One short weekday block when you are in town. One longer weekend block. A constraint, not a target. The firm does not get these hours. Super-admin draft. Not published. Not released. Kill the week if hours become a dashboard or a forum status. Travel weeks stay on the week, the road, or the deal. Sponsorship funds the organization, not a preferred seat.",
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
    description: "One hour a week with no outcome, no lesson, and no college signal.",
    leaderSummary:
      "Ken Canfield I CAN applied to knowing this child. One hour a week with no outcome, no lesson, and no college signal. The work is Awareness of the child in front of you. Super-admin draft. Not published. Not released. Kill the hour if it becomes a résumé line, a college story, or a family scorecard. Sponsorship funds the organization, not a preferred seat.",
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
    description: "One countable act a week that means nothing to the firm.",
    leaderSummary:
      "Ken Canfield I CAN applied to one countable weekly act that means nothing to the firm. Involvement picks it before the week starts. Consistency keeps it when the week gets hot. Awareness turns a small thing, not a reinvention. Nurturance keeps it off a slide. Super-admin draft. Not published. Not released. Kill the act if it becomes leadership development, a forum status, or a family scorecard. Sponsorship funds the organization, not a preferred seat.",
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
];

export function icanDraftBySlug(slug: string) {
  return ICAN_DRAFT_TRAININGS.find((training) => training.slug === slug) ?? null;
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

export function renderIcanDraftMigrationSql() {
  const trainingValues = ICAN_DRAFT_TRAININGS.map((training) => {
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

  const sessionValues = ICAN_DRAFT_TRAININGS.flatMap((training) =>
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

  return `-- Seed four Super-admin I CAN draft trainings.
-- Unpublished and unreleased. Films are Micah's hold placeholder.
-- Idempotent: re-run updates catalog rows in place by slug / session_number.
-- Do not set published = true. Do not call release RPCs.

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
