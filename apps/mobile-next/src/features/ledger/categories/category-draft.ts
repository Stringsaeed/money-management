import type { V2Category } from "@trove/api/v2/contracts";

import type { CategoryInput } from "@/data/ledger-client";

import { categoryEmoji } from "../transactions/transaction-display";
import { DEFAULT_CATEGORY_COLOR, DEFAULT_CATEGORY_ICON } from "./category-palette";

export interface CategoryDraft {
  readonly name: string;
  readonly kind: CategoryInput["kind"];
  readonly color: string;
  readonly icon: string;
}

export function initialCategoryDraft(category: V2Category | undefined): CategoryDraft {
  if (!category)
    return {
      name: "",
      kind: "expense",
      color: DEFAULT_CATEGORY_COLOR,
      icon: DEFAULT_CATEGORY_ICON,
    };
  return {
    name: category.name,
    kind: category.kind,
    color: category.color || DEFAULT_CATEGORY_COLOR,
    // Legacy icon slugs ("tag") have no glyph here; they already render as the fallback emoji.
    icon: categoryEmoji(category.icon),
  };
}

/** Returns a user-facing message explaining what to fix, or undefined when the draft is valid. */
export function categoryDraftError(draft: CategoryDraft): string | undefined {
  if (!draft.name.trim()) return "Name this category so it's easy to pick later.";
  return undefined;
}

export function categoryInputFromDraft(draft: CategoryDraft): CategoryInput {
  return { name: draft.name.trim(), kind: draft.kind, color: draft.color, icon: draft.icon };
}
