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
      "A father does not become effective by collecting ideas. He becomes effective in the ordinary hours, when a child learns whether this man can be counted on. Ken Canfield sat with thousands of fathers and watched that question get answered in kitchens and doorways, not in lectures. The Seven Secrets of Effective Fathers came from those lives: commitment, knowing your child, consistency, protecting and providing, affirming love, loving discipline, and a living example of integrity and faith.\n\nThis course takes those secrets one at a time. You begin with an honest look at where you stand. Then you keep a promise you can actually keep, learn this child's world instead of the one you remember, show up in a way the house can trust, speak a specific word of encouragement, and correct without breaking the bond. That is involvement you can count, awareness of this child today, consistency the house can feel, and nurturance that leaves the relationship intact.\n\nNine sessions. A short teaching, a brief checkpoint, and one practice you can use the same night. No scoreboard, and no need to perform the work in public.",
    leaderSummary:
      "Walk him through one secret at a time, used at home the same night. Watch for a kept promise, a truer picture of this child, and a correction that leaves the relationship intact. If the secrets turn into a lecture or a comparison among children, bring him back to one practiced move.",
  },
  {
    slug: "anger",
    description:
      "The people nearest you feel your heat first. A child especially. Anger is not the enemy. An untrained surge is, because the body often fires before thought, and what happens in those few seconds becomes the atmosphere of the house.\n\nThis course gives you those seconds back. You learn the earliest signal, take a quiet pause, stand the body down, and come back as someone the house can remain near. When you snap, you own it the same day in a short, specific apology. Sleep, food, and ordinary movement belong here. They hold the man who has to hold the room. Catching the jaw is awareness. Keeping the pause is consistency. Walking back in on time, and repairing without reloading the fight, is how involvement and nurturance look in a hot hour.\n\nYou can finish every week even when you cannot sit with your child. The paper is enough.",
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
