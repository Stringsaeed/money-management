import { CATEGORIZE_QUOTA, consumeAiQuota, RESEARCH_QUOTA } from "./ai-quota";
import type { TransactionCategorizer } from "./categorizer";
import { listCategories } from "./categories";
import {
  personalLedgerOwner,
  type V2AutoCategorization,
  type V2Category,
  type V2CreatedTransaction,
  type V2Transaction,
} from "./contracts";
import { type V2LedgerContext, V2ApiError } from "./shared";
import { getTransaction, updateTransaction } from "./transactions";

/** Save waits on this at most; past it the Transaction simply stays uncategorized. */
export const AUTO_CATEGORIZE_BUDGET_MS = 12_000;

const result = (
  transaction: V2Transaction,
  autoCategorization: V2AutoCategorization,
): V2CreatedTransaction => ({ ...transaction, autoCategorization });

/**
 * Files a just-created Transaction under one of the ledger's categories using
 * its note. The Transaction is already committed, so every AI or quota failure
 * resolves to an uncategorized result instead of failing the create.
 */
export async function autoCategorizeTransaction(
  context: V2LedgerContext,
  created: V2Transaction,
  categorizer: TransactionCategorizer | undefined,
): Promise<V2CreatedTransaction> {
  if (!categorizer) return result(created, { outcome: "unavailable" });
  try {
    return await categorize(context, created.id, categorizer);
  } catch (cause) {
    // Notes are user content, so only the failure's kind is logged.
    console.error("transaction auto-categorization failed", {
      name: cause instanceof Error ? cause.name : "UnknownError",
    });
    return result(created, { outcome: "unavailable" });
  }
}

async function categorize(
  context: V2LedgerContext,
  id: string,
  categorizer: TransactionCategorizer,
): Promise<V2CreatedTransaction> {
  // Re-read so an idempotent replay of the create sees a category set by the first attempt.
  const transaction = await getTransaction(context, id);
  if (transaction.kind === "transfer" || transaction.categoryId || !transaction.note.trim())
    return result(transaction, { outcome: "skipped" });

  const categories = await listCategories(context, { kind: transaction.kind });
  if (categories.length === 0) return result(transaction, { outcome: "skipped" });

  // Quotas follow the person, not the ledger, so household members don't share one.
  const subject = personalLedgerOwner(context.principal);
  if (!(await consumeAiQuota(context.db, subject, CATEGORIZE_QUOTA)))
    return result(transaction, { outcome: "rate_limited" });

  const outcome = await categorizer.categorize(
    {
      note: transaction.note,
      kind: transaction.kind,
      currency: transaction.currency,
      categories: categories.map(({ id: categoryId, name }) => ({ id: categoryId, name })),
    },
    {
      signal: AbortSignal.timeout(AUTO_CATEGORIZE_BUDGET_MS),
      allowResearch: () => consumeAiQuota(context.db, subject, RESEARCH_QUOTA),
    },
  );
  const category = categories.find((candidate) => candidate.id === outcome.categoryId);
  if (!category) return result(transaction, { outcome: "uncategorized" });
  return applyCategory(context, transaction, category, outcome.stage === "research");
}

/** Pinned to the version that was read, so an edit made meanwhile wins. */
async function applyCategory(
  context: V2LedgerContext,
  transaction: V2Transaction,
  category: V2Category,
  researched: boolean,
): Promise<V2CreatedTransaction> {
  try {
    const updated = await updateTransaction(
      context,
      transaction.id,
      { categoryId: category.id },
      transaction.version,
    );
    return result(updated, {
      outcome: "categorized",
      source: researched ? "research" : "jev",
      category,
    });
  } catch (error) {
    if (error instanceof V2ApiError && error.code === "version_conflict")
      return result(await getTransaction(context, transaction.id), { outcome: "skipped" });
    throw error;
  }
}
