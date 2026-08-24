import {
  ICAN_RETURN_HOME_DRAFT_SLUGS,
  icanDraftsForSlugs,
} from "@/lib/trainings/ican-drafts";

export const CATALOG_DESCRIPTION_MIGRATION =
  "supabase/migrations/20260824240000_ken_voice_v5_catalog.sql";

export const CATALOG_DESCRIPTION_SLUGS = ["fundamentals", "anger", "reentry"] as const;

export type CatalogDescriptionSlug = (typeof CATALOG_DESCRIPTION_SLUGS)[number];

export type CatalogDescriptionTraining = {
  slug: CatalogDescriptionSlug;
  description: string;
  leaderSummary: string;
};

export const CATALOG_DESCRIPTION_TRAININGS: CatalogDescriptionTraining[] = [
  {
    slug: "fundamentals",
    description:
      "A father does not become effective by collecting ideas. He becomes effective in the ordinary hours, when a child learns whether this man can be counted on. Ken Canfield sat with thousands of fathers and watched that question get answered in kitchens and doorways, not in lectures. The Seven Secrets of Effective Fathers came from those lives: commitment, knowing your child, consistency, protecting and providing, affirming love, loving discipline, and a living example of integrity and faith.\n\nThis course takes those secrets one at a time. You begin with an honest look at where you stand. Then you keep a promise you can actually keep, learn this child's world instead of the one you remember, show up in a way the house can trust, speak a specific word of encouragement, and correct without breaking the bond. The child meets a man who is there, who notices this child today, who comes back the same way, and who leaves the relationship intact.\n\nNine sessions. A short teaching, a brief checkpoint, and one practice you can use the same night. The work stays between you and the house.",
    leaderSummary:
      "Walk him through one secret at a time, used at home the same night. Watch for a kept promise, a truer picture of this child, and a correction that leaves the relationship intact. If the secrets turn into a lecture or a comparison among children, bring him back to one practiced move.",
  },
  {
    slug: "anger",
    description:
      "The people nearest you feel your heat first. A child especially. Anger is not the enemy. An untrained surge is, because the body often fires before thought, and what happens in those few seconds becomes the atmosphere of the house.\n\nThis course gives you those seconds back. You learn the earliest signal, take a quiet pause, stand the body down, and come back as someone the house can remain near. When you snap, you own it the same day in a short, specific apology. Sleep, food, and ordinary movement belong here. They hold the man who has to hold the room. Catch the surge in the jaw. Keep the pause. Walk back in on time. Repair without reloading the fight.\n\nYou can finish every week even when you cannot sit with your child. The paper is enough.",
    leaderSummary:
      "Help him notice the surge before it becomes a shout, take the pause, and repair the same day. Success looks like catching it in the body, stepping away and coming back on time, and a short apology that names the snap. If steadiness turns into advice he gives others and never uses, or into talk about diagnosis, bring him back to his own next hour. Completion never requires child contact.",
  },
  {
    slug: "reentry",
    description:
      "A man can do his work away from home and still walk through the door carrying the body that kept him there. The people inside did not live that stretch with him. The child he meets may not be the child he left.\n\nComing home present is a season, not a night to be graded. You give old alarms a home meaning. You keep a few promises the house can trust. You choose frequent small deposits over one intense reunion. When something breaks, you repair the same day and keep it short. If a child pulls away, that is a beginning, not a verdict. Stay aware of the body you bring home and the child in front of you. Stay consistent in a few promises. Go first.\n\nContact helps when it is recent, frequent, and good. When visits are not allowed, the week still completes on paper.",
    leaderSummary:
      "Stay with the body at the door, the child who grew, and a season of return rather than a first-night score. Watch for a few kept promises, frequent small deposits, and same-day repair. If the week becomes a reunion script or a story about where he was, bring him back to the child in front of him. Paper completes when contact is not allowed.",
  },
];

export type KenVoiceSession1Update = {
  slug: string;
  title: string | null;
  checkinPrompt: string;
};

export const KEN_VOICE_SESSION_1: KenVoiceSession1Update[] = [
  {
    slug: "fundamentals",
    title: null,
    checkinPrompt:
      "After this first film, write one short thing you learned, in your own words. What is one secret you want to try the same night?\n\nA) Commitment: keep a promise I can actually keep tonight\nB) Knowing this child: learn one thing about their world today\nC) Consistency: show up the same way at a time the house can trust",
  },
  {
    slug: "anger",
    title: null,
    checkinPrompt:
      "What is the first body signal you notice when heat rises? Name it in a few words.\n\nA) Jaw, fists, or a tight chest\nB) Heat in the face, or a short breath\nC) The urge to fix the room before I speak",
  },
  {
    slug: "reentry",
    title: null,
    checkinPrompt:
      "What is one thing your body still does when you walk through the door? Name it.\n\nA) I scan the rooms before I greet anyone\nB) My jaw or shoulders stay set from the stretch\nC) I want to take over the first five minutes",
  },
  {
    slug: "calm-you-can-lend",
    title: "Before You Speak",
    checkinPrompt:
      "What is the first body signal you notice before you speak? Name it.\n\nA) Tight jaw, shallow breath, or a scan of every room\nB) The urge to fix something or quiet the house fast\nC) I usually do not notice anything until someone reacts to me",
  },
  {
    slug: "the-house-that-kept-going",
    title: null,
    checkinPrompt:
      "Who kept one routine going while you were away, and what was that routine?\n\nA) A co-parent or kin kept a meal, bedtime, or school rhythm\nB) A program or the child kept a rule or a check-in in place\nC) I am still learning who carried which load",
  },
  {
    slug: "knowing-again",
    title: null,
    checkinPrompt:
      "What is one thing about this child that may have changed while you were gone? Name it.\n\nA) An interest, a friend, or a fear that is new to me\nB) How they want me when I walk in\nC) I am not sure yet; I will ask before I assume",
  },
];

export function catalogDescriptionBySlug(slug: string) {
  return CATALOG_DESCRIPTION_TRAININGS.find((training) => training.slug === slug) ?? null;
}

export function catalogDescriptionsForSlugs(slugs: readonly string[]) {
  return slugs.map((slug) => {
    const training = catalogDescriptionBySlug(slug);
    if (!training) {
      throw new Error(`Catalog descriptions are missing ${slug}`);
    }
    return training;
  });
}

function sqlLiteral(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function sqlTextBlock(value: string) {
  return `E${sqlLiteral(value.replaceAll("\n", "\\n"))}`;
}

function kenVoiceTrainingRows() {
  return [
    ...catalogDescriptionsForSlugs(CATALOG_DESCRIPTION_SLUGS),
    ...icanDraftsForSlugs(ICAN_RETURN_HOME_DRAFT_SLUGS).map((training) => ({
      slug: training.slug,
      description: training.description,
      leaderSummary: training.leaderSummary,
    })),
  ];
}

export function renderCatalogDescriptionUpdateSql() {
  const trainings = kenVoiceTrainingRows();
  const trainingValues = trainings
    .map((training) => {
      return `  (
    ${sqlLiteral(training.slug)},
    ${sqlTextBlock(training.description)},
    ${sqlTextBlock(training.leaderSummary)}
  )`;
    })
    .join(",\n");
  const sessionValues = KEN_VOICE_SESSION_1.map((session) => {
    const titleSql = session.title === null ? "null::text" : sqlLiteral(session.title);
    return `  (
    ${sqlLiteral(session.slug)},
    1,
    ${titleSql},
    ${sqlTextBlock(session.checkinPrompt)}
  )`;
  }).join(",\n");
  const slugList = trainings.map((training) => sqlLiteral(training.slug)).join(", ");

  return `-- Lock Ken-voice v5 father-facing copy to match live Pilot.
-- Updates description, leader_summary, Calm session 1 title, and session 1 checkin_prompt by slug.
-- Does not change published, released_at, or development_status.
-- Idempotent: re-run updates the same columns in place by slug / session_number.

update public.trainings as trainings
set
  description = catalog.description,
  leader_summary = catalog.leader_summary
from (
  values
${trainingValues}
) as catalog(slug, description, leader_summary)
where trainings.slug = catalog.slug
  and trainings.slug in (${slugList});

update public.sessions as sessions
set
  title = coalesce(catalog.title, sessions.title),
  checkin_prompt = catalog.checkin_prompt
from (
  values
${sessionValues}
) as catalog(slug, session_number, title, checkin_prompt)
join public.trainings as trainings
  on trainings.slug = catalog.slug
where sessions.training_id = trainings.id
  and sessions.session_number = catalog.session_number;
`;
}
