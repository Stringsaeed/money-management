import { Effect } from "effect";

import {
  BudgetCategoryDuplicate,
  BudgetCategoryInvalid,
  CategoryAlreadyMapped,
} from "./budget-errors";
import { LedgerFacts } from "./budget-ledger-facts";
import { BudgetStore } from "./budget-store";

/** An envelope names an existing Category or asks for a new one by name. */
export interface CategoryChoice {
  readonly categoryId?: string;
  readonly newCategory?: { readonly name: string };
}

/**
 * One Category per envelope, in input order. A new Category name reuses a
 * non-archived expense Category with the same name (case-insensitive); two
 * envelopes may not share one Category.
 */
export const resolveCategories = Effect.fn("resolveCategories")(function* (
  choices: readonly CategoryChoice[],
) {
  const facts = yield* LedgerFacts;
  const expense = yield* facts.activeExpenseCategories;
  const knownIds = new Set(expense.map((row) => row.id));
  const byName = new Map(expense.map((row) => [row.name.toLowerCase(), row.id]));

  const resolved: string[] = [];
  for (const choice of choices) {
    if (choice.categoryId !== undefined) {
      if (!knownIds.has(choice.categoryId)) {
        return yield* new BudgetCategoryInvalid({ categoryId: choice.categoryId });
      }
      resolved.push(choice.categoryId);
      continue;
    }
    const name = choice.newCategory?.name ?? "";
    let id = byName.get(name.toLowerCase());
    if (!id) {
      id = crypto.randomUUID();
      yield* facts.insertExpenseCategory(id, name);
      byName.set(name.toLowerCase(), id);
    }
    resolved.push(id);
  }
  const duplicate = resolved.find((id, index) => resolved.indexOf(id) !== index);
  if (duplicate) return yield* new BudgetCategoryDuplicate({ categoryId: duplicate });
  return resolved;
});

/** A Category maps to at most one envelope; `ownEnvelopeId`'s own mappings are about to be replaced. */
export const requireCategoriesUnmapped = Effect.fn("requireCategoriesUnmapped")(function* (
  categoryIds: readonly string[],
  ownEnvelopeId: string | undefined,
) {
  const rows = yield* (yield* BudgetStore).mappingsOf(categoryIds);
  const conflict = rows.find((row) => row.envelopeId !== ownEnvelopeId);
  if (conflict) {
    return yield* new CategoryAlreadyMapped({
      categoryId: conflict.categoryId,
      envelopeId: conflict.envelopeId,
    });
  }
});
