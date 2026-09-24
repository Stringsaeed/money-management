import type { V2Account, V2Transaction } from "@trove/api/v2/contracts";

import type { TransactionInput } from "@/data/ledger-client";
import { parseDateKey, todayDateKey } from "@/utils/date";
import { decimalFromMinor } from "@/utils/money";

export interface TransactionDraft {
  readonly kind: TransactionInput["kind"];
  readonly accountId: string;
  readonly categoryId: string | null;
  readonly toAccountId: string | null;
  readonly amount: string;
  readonly date: string;
  readonly note: string;
}

export function initialTransactionDraft(
  transaction: V2Transaction | undefined,
  activeAccounts: readonly V2Account[],
): TransactionDraft {
  if (!transaction)
    return {
      kind: "expense",
      accountId: activeAccounts[0]?.id ?? "",
      categoryId: null,
      toAccountId: null,
      amount: "",
      date: todayDateKey(),
      note: "",
    };
  return {
    kind: transaction.kind,
    accountId: transaction.accountId,
    categoryId: transaction.categoryId,
    toAccountId: transaction.toAccountId,
    amount: decimalFromMinor(transaction.amountMinor, transaction.currency),
    date: transaction.date,
    note: transaction.note,
  };
}

/** Returns a user-facing message explaining what to fix, or undefined when the draft is valid. */
export function transactionDraftError(
  draft: TransactionDraft,
  amountMinor: number | null,
  hasAccounts: boolean,
): string | undefined {
  if (!draft.accountId)
    return hasAccounts
      ? "Pick the account this came from."
      : "Create an account first, then come back to add this transaction. 🏦";
  if (amountMinor === null || amountMinor <= 0)
    return `Enter an amount above zero to save this ${draft.kind}.`;
  if (!parseDateKey(draft.date)) return "Pick a valid date for this transaction.";
  if (draft.kind === "transfer" && (!draft.toAccountId || draft.toAccountId === draft.accountId))
    return "Pick a different destination account for this transfer.";
  return undefined;
}

export function transactionInputFromDraft(
  draft: TransactionDraft,
  amountMinor: number,
): TransactionInput {
  const isTransfer = draft.kind === "transfer";
  return {
    accountId: draft.accountId,
    categoryId: isTransfer ? null : draft.categoryId,
    toAccountId: isTransfer ? draft.toAccountId : null,
    kind: draft.kind,
    amountMinor,
    date: draft.date,
    note: draft.note.trim(),
  };
}
