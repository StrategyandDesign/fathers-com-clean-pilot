import {
  CATALOG_DESCRIPTION_SLUGS,
  catalogDescriptionsForSlugs,
} from "@/lib/trainings/catalog-descriptions";
import {
  ICAN_CEO_DRAFT_SLUGS,
  icanDraftsForSlugs,
} from "@/lib/trainings/ican-drafts";

export const OVERVIEW_PARAGRAPH_MIGRATION =
  "supabase/migrations/20260824210000_update_training_overview_paragraphs.sql";

export const RETURN_HOME_OVERVIEW_SLUGS = [
  "calm-you-can-lend",
  "the-house-that-kept-going",
  "knowing-again",
] as const;

export const OVERVIEW_PARAGRAPH_SLUGS = [
  ...CATALOG_DESCRIPTION_SLUGS,
  ...RETURN_HOME_OVERVIEW_SLUGS,
  ...ICAN_CEO_DRAFT_SLUGS,
] as const;

export const UNTOUCHED_OVERVIEW_SLUGS = ["test", "flourishingfaith"] as const;

export type OverviewParagraphSlug = (typeof OVERVIEW_PARAGRAPH_SLUGS)[number];

export type OverviewParagraphTraining = {
  slug: OverviewParagraphSlug;
  description: string;
  leaderSummary: string;
};

export const RETURN_HOME_OVERVIEW_PARAGRAPHS: OverviewParagraphTraining[] = [
  {
    slug: "calm-you-can-lend",
    description:
      "The stretch is over and your body has not heard the news. You walk through the door still high. The people inside did not live what you just carried. A child will borrow whatever you bring. Anyone else in the house may borrow it too, when they are there.\n\nCalm You Can Lend is twelve weeks of coming down at the door before you speak. You learn your own body tells, keep the same short ritual every return, and stay present once you are down. Soft voice and proximity go first. Correction waits. When you snap, you close it the same day. The ordinary hours that hold you are part of the work. None of this is a post or a streak. Involvement is staying in the room after you come down. Awareness is the surge named as a body signal. Consistency is the ritual you do not skip. Nurturance is the calm another person can actually use.\n\nEach week you watch a short film, answer one question, and try one practice.",
    leaderSummary:
      "Super-admin draft. Not published. Not released. The course owns the door and the calm he lends outward. Awareness of the surge, consistency of the return ritual, involvement once he is down, nurturance in calm others can borrow. A good week is the same short ritual, soft presence with the child and with whoever is inside when they are present, and same-day repair. If he teaches the come-down and never uses it at his own door, or turns body language into diagnosis talk, bring him back to one return. Sponsorship funds the organization, not a preferred seat.",
  },
  {
    slug: "the-house-that-kept-going",
    description:
      "While you were gone, the house kept going. Someone kept the meals, the bedtime, the school bag. It may have been a co-parent, kin, a program, or the child. The wound opens when you walk in and rewrite the rules as if nothing happened without you.\n\nThis course asks you to see that load in plain words and join what already works. You thank once, quietly. You ask before you change a rule. You take one real load the house names and finish it. Trust comes later than you want. When you snap at the system, you repair the same day with whoever was there. You do not install a second plan beside the one that kept the child. Involvement is the load you actually complete. Awareness is noticing who carried what. Consistency is the small promise kept. Nurturance is the tone when you reenter. No one in this house is assumed to be a mother or a partner.\n\nTwelve weeks of one film, one checkpoint, and one practice.",
    leaderSummary:
      "Super-admin draft. Not published. Not released. The carrier may be a co-parent, kin, a program, or the child. Awareness of the load, involvement in one named load finished, consistency of small promises, nurturance in tone and same-day repair. A good week is one asked load done, no parallel plan, and trust treated as something that lags. If gratitude becomes cover for taking the wheel, or the keeper of the house is treated like household management, bring him back to one asked load. Sponsorship funds the organization, not a preferred seat.",
  },
  {
    slug: "knowing-again",
    description:
      "Children change while you are away. Interests, fears, friends, and how they want you all move. Yesterday's picture of them will miss them, over and over. Knowing your child is never finished when the weeks keep sending you out and bringing you back.\n\nThis course is twelve weeks of meeting the child in front of you. You update a private note about who they are now. You ask once and listen longer. Hesitation is information, not a verdict on your worth. Small deposits that fit them beat a big make-up weekend. Presence comes before providing. If you miss, you repair softly the same day. Another caregiver may help you see what changed. They are an ally when they are part of the week, never a required messenger. Involvement is the matching deposit. Awareness is the updated picture. Consistency is showing up after the next stretch. Nurturance is meeting coolness without forcing a reunion.\n\nWhen you cannot sit with your child, you still complete the week on paper.",
    leaderSummary:
      "Super-admin draft. Not published. Not released. Awareness of who this child is now, involvement in matching deposits, consistency of frequency over a make-up weekend, nurturance with hesitation. A good week is an honest child-now picture, an ask before an assumption, and presence that extracts nothing for a resume. If knowing becomes a talent review, a growth dashboard, or a forced reunion, bring him back to one question and a closed mouth. Sponsorship funds the organization, not a preferred seat.",
  },
];

export const AI_OVERVIEW_MARKERS = [
  "Purpose:",
  "Concrete objectives",
  "Kill the week",
  "This training is for fathers who",
  "Not treatment. Not a diagnosis",
] as const;

export function overviewParagraphs(): OverviewParagraphTraining[] {
  const catalog = catalogDescriptionsForSlugs(CATALOG_DESCRIPTION_SLUGS).map((training) => ({
    slug: training.slug,
    description: training.description,
    leaderSummary: training.leaderSummary,
  }));
  const ceo = icanDraftsForSlugs(ICAN_CEO_DRAFT_SLUGS).map((training) => ({
    slug: training.slug,
    description: training.description,
    leaderSummary: training.leaderSummary,
  }));

  return [...catalog, ...RETURN_HOME_OVERVIEW_PARAGRAPHS, ...ceo];
}

export function overviewParagraphBySlug(slug: string) {
  return overviewParagraphs().find((training) => training.slug === slug) ?? null;
}

function sqlLiteral(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function sqlTextBlock(value: string) {
  return `E${sqlLiteral(value.replaceAll("\n", "\\n"))}`;
}

export function renderOverviewParagraphUpdateSql() {
  const trainings = overviewParagraphs();
  const values = trainings
    .map((training) => {
      return `  (
    ${sqlLiteral(training.slug)},
    ${sqlTextBlock(training.description)},
    ${sqlTextBlock(training.leaderSummary)}
  )`;
    })
    .join(",\n");
  const slugList = OVERVIEW_PARAGRAPH_SLUGS.map((slug) => sqlLiteral(slug)).join(", ");

  return `-- Update stored overview paragraphs for ten trainings by slug.
-- Does not change titles, published, released_at, sessions, videos, or development_status.
-- Idempotent: re-run updates description and leader_summary in place by slug.
-- Does not touch test or flourishingfaith.

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
