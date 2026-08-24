export const CATALOG_DESCRIPTION_MIGRATION =
  "supabase/migrations/20260824220000_rehab_hcd_catalog_descriptions.sql";

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
      "This training is for fathers who want a clear starting map, not a theory class. You may already be in the house every night. You may be catching up after time away. Either way, your child needs a man they can count on in ordinary hours, not a speech about who you meant to be.\n\nPurpose: learn the Seven Secrets as lived habits you can use the same night. Commitment. Knowing this child. Showing up the same way. Protecting and providing. Affirming. Disciplining with love. Modeling integrity and faith. What changes over nine sessions is how you show up. You stop guessing. You pick one secret, try one move, and let the child meet a more reliable man.\n\nConcrete objectives: take the overview and set your baseline; keep a promise you can actually keep; learn this child's world instead of the one you remember; show up on a schedule the house can trust; protect safety without becoming the only rule; speak one specific encouragement; correct without cutting the relationship; live a conviction the child can see; carry one extra practice home.\n\nHow a session works: watch one short teaching film, answer one checkpoint, then live one practice you can use that night. Nine sessions, not a twelve-week lecture. The work stays between you and the house. Tone is ordinary house language and Ken Canfield's I CAN spine (Involvement, Consistency, Awareness, Nurturance). Education for everyday fathering.",
    leaderSummary:
      "Father starts with Ken Canfield's Seven Secrets as a same-night map. Course owns one secret at a time, used at home. Ken Canfield I CAN: Involvement in a kept promise, Awareness of this child, Consistency of showing up, Nurturance in affirmation and loving correction. Success looks like one practiced move after each film, a child who can count on the same man, and no theory pile-up. Kill the week if the secrets become a lecture, a comparison between children, or a scorecard.",
  },
  {
    slug: "anger",
    description:
      "This training is for fathers who feel the heat rise at home, at work, or in a program, and do not want the people closest to them to pay for it. Anger is not the enemy. The untrained surge is. Your body fires before your thinking. Children borrow the adult nervous system they meet. Other caregivers may borrow it too when they are there. They are optional, not assumed.\n\nPurpose: notice the surge as a body signal, buy six seconds, and return as someone the house can stay near. What changes over twelve weeks is the gap between the surge and what you do next. You catch it in the jaw, not the shout. You stand the body down. You own a snap the same day.\n\nConcrete objectives: treat the surge as a signal, not an order; name your earliest body cues; hold six silent seconds before you speak; use a long exhale to come down; step away and come back on time; leave a line, then leave the room; name the feeling without loading it; own it out loud same day; keep the apology short and specific; protect sleep, food, and movement as the boring hours that hold you.\n\nHow a week works: watch one short teaching film, answer one checkpoint, then live one practice that week. Completion never requires contact with your child. The work stays between you and the house. Tone is ordinary house language and Ken Canfield's I CAN spine (Involvement, Consistency, Awareness, Nurturance). Education for steadiness under pressure.",
    leaderSummary:
      "Father under pressure whose surge arrives before thinking. Course owns noticing the surge, six seconds, and same-day repair. Ken Canfield I CAN: Awareness of body cues, Consistency of the pause and the exhale, Involvement once you come back, Nurturance in a short apology. Success looks like catching the jaw, stepping away and returning on time, and owning a snap the same day. Kill the week if steadiness becomes a tip he coaches others with and never uses, or if the surge becomes diagnosis talk. Completion never requires child contact.",
  },
  {
    slug: "reentry",
    description:
      "This training is for fathers who cycle back into family life after hard stretches away. You may walk through the door still wired. Your body did its job where you were. The people inside did not live that stretch with you. Children borrow the adult nervous system they meet. Other caregivers may borrow it too when they are there. They are optional, not assumed.\n\nPurpose: teach the body that home is not there, meet the child in front of you, and keep a few promises the house can trust. What changes over twelve weeks is the return itself. You stop grading yourself by the first night. You plan around the wave. You make small deposits. You repair without pride. The return is a season, not a day.\n\nConcrete objectives: notice the body you bring home; retrain old alarms with a home meaning; plan around low-energy waves instead of grading them; keep a few promises without fail; meet the child who grew, not the one you left; ask once and listen longer; make small deposits often; choose frequency over intensity; repair the same day when it breaks; go first and keep it short; treat a pull-away as a start, not a verdict.\n\nHow a week works: watch one short teaching film, answer one checkpoint, then live one practice that week. If contact is unavailable, rehearse the body practice or the ask on paper. The work stays between you and the house. Tone is ordinary house language and Ken Canfield's I CAN spine (Involvement, Consistency, Awareness, Nurturance). Education for coming home present.",
    leaderSummary:
      "Father returns from hard stretches still wired. Course owns the body at the door, the child who grew, and a season of return. Ken Canfield I CAN: Awareness of the body and the present child, Consistency of few kept promises, Involvement in small deposits, Nurturance in same-day repair. Success looks like home meaning for old alarms, frequency over a make-up weekend, and a pull-away treated as a start. Kill the week if return becomes a reunion script, a first-night score, or a story about where he was.",
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

export function renderCatalogDescriptionUpdateSql() {
  const trainings = catalogDescriptionsForSlugs(CATALOG_DESCRIPTION_SLUGS);
  const values = trainings
    .map((training) => {
      return `  (
    ${sqlLiteral(training.slug)},
    ${sqlTextBlock(training.description)},
    ${sqlTextBlock(training.leaderSummary)}
  )`;
    })
    .join(",\n");
  const slugList = CATALOG_DESCRIPTION_SLUGS.map((slug) => sqlLiteral(slug)).join(", ");

  return `-- Update father-facing descriptions for the three published catalog trainings.
-- Does not change sessions, titles, published, released_at, or development_status.
-- Idempotent: re-run updates description and leader_summary in place by slug.
-- Does not touch calm-you-can-lend, the-house-that-kept-going, or knowing-again.

update public.trainings as trainings
set
  description = catalog.description,
  leader_summary = catalog.leader_summary
from (
  values
${values}
) as catalog(slug, description, leader_summary)
where trainings.slug = catalog.slug
  and trainings.slug in (${slugList});
`;
}
