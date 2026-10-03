import { MIN_AUTO_CATEGORIZE_CATEGORIES, type V2Category } from "@trove/api/v2/contracts";

/** "AI pick" is only offered when AI has at least two categories of `kind` to choose between. */
export const hasAiPickChoice = (categories: readonly V2Category[], kind: string): boolean =>
  categories.filter((item) => item.kind === kind).length >= MIN_AUTO_CATEGORIZE_CATEGORIES;
