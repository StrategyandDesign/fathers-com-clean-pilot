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

export const AI_OVERVIEW_MARKERS = [
  "Purpose:",
  "Concrete objectives",
  "Kill the week",
  "This training is for fathers who",
  "Not treatment. Not a diagnosis",
] as const;

export function repoBackedOverviewParagraphs(): OverviewParagraphTraining[] {
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

  return [...catalog, ...ceo];
}
