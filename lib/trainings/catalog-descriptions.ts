export const CATALOG_DESCRIPTION_MIGRATION =
  "supabase/migrations/20260824200000_update_catalog_training_descriptions.sql";

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
      "A child does not need a speech about the father you meant to be. They need a man they can count on in ordinary hours. You may already be home every night. You may be catching up after time away. Either way, this course is a map you can use the same night you hear it, not a theory class.\n\nKen Canfield spent years sitting with fathers and watching what distinguished the men children could trust. Out of that work came the Seven Secrets: commitment, knowing this child, showing up the same way, protecting and providing, affirming, disciplining with love, and modeling integrity and faith. You begin with the overview and an honest baseline. Then you take the secrets one at a time. Involvement looks like a promise you actually keep. Awareness looks like learning this child's world instead of the one you remember. Consistency is a rhythm the house can trust. Nurturance is the encouragement and the correction that leave the relationship intact.\n\nEach session is a short teaching film, a checkpoint to make sure the idea landed, and one practice you can try that night. There is no scoreboard, and no room where fathers compare children.",
    leaderSummary:
      "Ken's Seven Secrets are the map, used at home the same night. Involvement is a kept promise. Awareness is this child as they are now. Consistency is showing up the same way. Nurturance is affirmation and loving correction. A good week is one practiced move after the film and a child who can count on the same man. If the secrets turn into a lecture, a comparison between children, or a scorecard, bring him back to one secret and one move.",
  },
  {
    slug: "anger",
    description:
      "Anger is not the enemy. The untrained surge is. Your body fires before your thinking, at home, at work, or in a program, and the people closest to you pay for it if you never learn the gap. Children borrow the nervous system they meet. Anyone else in the house may feel that heat too, when they are there.\n\nThis course teaches you to notice the surge as a signal, not an order. You catch it in the jaw rather than the shout. You take a few silent seconds, stand the body down with a long exhale, and come back as someone the house can stay near. When you snap, you own it the same day in a short, specific apology. Sleep, food, and movement stay in the picture because they hold you. Involvement is coming back into the room on time. Awareness is naming the earliest body cue. Consistency is the pause and the exhale you keep using. Nurturance is the repair that does not reload the fight.\n\nEach week you watch a short film, answer one checkpoint, and live one practice. You can finish the paper even when you cannot sit with your child that week.",
    leaderSummary:
      "The work is noticing the surge, buying seconds, and repairing the same day. Awareness of body cues, consistency of the pause, involvement once he comes back, nurturance in a short owned apology. A good week looks like catching the jaw, stepping away and returning on time, and closing a snap before sleep. Completion never requires child contact. If he coaches the pause and never uses it, or turns the surge into diagnosis talk, bring him back to his own body and one return.",
  },
  {
    slug: "reentry",
    description:
      "You walk back into a house that kept going without you. Your body is still carrying the stretch. The people inside did not live it with you. Children borrow the nervous system they meet. Anyone else at home may feel that heat too, when they are there.\n\nComing home present is a season, not a night. This course helps you teach the body that home has a different meaning, meet the child who grew while you were gone, and keep a few promises the house can trust. You plan around the low-energy wave instead of grading the first night. You make small deposits. You repair without pride. Frequency beats a make-up weekend. A pull-away is a start, not a verdict. Involvement is the small deposit. Awareness is the body you bring home and the child in front of you. Consistency is a few kept promises. Nurturance is going first and keeping the repair short.\n\nEach week is a short film, a checkpoint, and one lived practice. Contact helps when it is recent, frequent, and good. When visits are not allowed, the paper still completes.",
    leaderSummary:
      "The return is a season. The course owns the body at the door, the child who grew, and a few kept promises. Awareness of the body and the present child, consistency of those promises, involvement in small deposits, nurturance in same-day repair. A good week looks like home meaning for old alarms, frequency over intensity, and a pull-away treated as a start. Paper completes when contact is not allowed. If the week becomes a reunion script, a first-night score, or a story about where he was, bring him back to one promise and the child in front of him.",
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
