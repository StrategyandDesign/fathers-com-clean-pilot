export const TRAINING_SHELVES = ["fathering", "org_program"] as const;

export type TrainingShelf = (typeof TRAINING_SHELVES)[number];

export function asTrainingShelf(value: unknown): TrainingShelf {
  return value === "org_program" ? "org_program" : "fathering";
}

export function trainingShelf(training: { shelf?: string | null }): TrainingShelf {
  return asTrainingShelf(training.shelf);
}

export function catalogHasOrgProgram<T extends { training: { shelf?: string | null } }>(
  items: T[]
) {
  return items.some((item) => trainingShelf(item.training) === "org_program");
}

export function groupCatalogByShelf<T extends { training: { shelf?: string | null } }>(
  items: T[]
) {
  const fathering: T[] = [];
  const orgProgram: T[] = [];
  for (const item of items) {
    if (trainingShelf(item.training) === "org_program") orgProgram.push(item);
    else fathering.push(item);
  }
  return { fathering, orgProgram };
}
