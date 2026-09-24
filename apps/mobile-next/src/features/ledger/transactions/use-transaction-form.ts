import { useState } from "react";

import type { V2Account, V2Category, V2Transaction } from "@trove/api/v2/contracts";

import type { TransactionInput } from "@/data/ledger-client";
import { currencyFractionDigits, parseMoneyMinor } from "@/utils/money";

import {
  applyAmountKey,
  fitAmountToPrecision,
  normalizeAmountEntry,
  type AmountKey,
} from "./amount-entry";
import { errorHaptic, keyHaptic } from "./transaction-haptics";
import {
  initialTransactionDraft,
  transactionDraftError,
  transactionInputFromDraft,
  type TransactionDraft,
} from "./transaction-validation";

const DEFAULT_FRACTION_DIGITS = 2;

interface UseTransactionFormOptions {
  readonly transaction?: V2Transaction;
  readonly accounts: readonly V2Account[];
  readonly categories: readonly V2Category[];
  readonly onSubmit: (input: TransactionInput) => Promise<void>;
}

export function useTransactionForm({
  transaction,
  accounts,
  categories,
  onSubmit,
}: UseTransactionFormOptions) {
  const activeAccounts = accounts.filter((item) => !item.archived);
  const [draft, setDraft] = useState(() => initialTransactionDraft(transaction, activeAccounts));
  const [validationError, setValidationError] = useState<string>();

  // Currency always comes from the chosen account; until one exists there is no currency to show.
  const currencyOf = (accountId: string): string | null =>
    accounts.find((item) => item.id === accountId)?.currency ?? transaction?.currency ?? null;
  const digitsFor = (code: string | null) =>
    code ? currencyFractionDigits(code) : DEFAULT_FRACTION_DIGITS;
  const currency = currencyOf(draft.accountId);
  const fractionDigits = digitsFor(currency);
  const activeCategories = categories.filter((item) => !item.archived);

  const update = (patch: Partial<TransactionDraft>) => {
    setValidationError(undefined);
    setDraft((current) => ({ ...current, ...patch }));
  };

  // The category decides the transaction type; transfers are picked from the same sheet.
  const selectCategory = (category: V2Category) =>
    update({ kind: category.kind, categoryId: category.id, toAccountId: null });

  const selectTransfer = () => update({ kind: "transfer", categoryId: null });

  const selectAccount = (accountId: string) =>
    update({
      accountId,
      toAccountId: draft.toAccountId === accountId ? null : draft.toAccountId,
      amount: fitAmountToPrecision(draft.amount, digitsFor(currencyOf(accountId))),
    });

  const pressKey = (key: AmountKey) => {
    keyHaptic();
    setValidationError(undefined);
    setDraft((current) => ({
      ...current,
      amount: applyAmountKey(current.amount, key, fractionDigits),
    }));
  };

  const submit = async () => {
    const amountMinor = currency
      ? parseMoneyMinor(normalizeAmountEntry(draft.amount), currency)
      : null;
    const error = transactionDraftError(draft, amountMinor, activeAccounts.length > 0);
    if (error || amountMinor === null) {
      errorHaptic();
      setValidationError(error);
      return;
    }
    setValidationError(undefined);
    await onSubmit(transactionInputFromDraft(draft, amountMinor));
  };

  return {
    draft,
    currency,
    fractionDigits,
    activeAccounts,
    activeCategories,
    validationError,
    selectCategory,
    selectTransfer,
    selectAccount,
    setToAccountId: (toAccountId: string) => update({ toAccountId }),
    setDate: (date: string) => update({ date }),
    setNote: (note: string) => update({ note }),
    pressKey,
    clearAmount: () => update({ amount: "" }),
    submit,
  };
}
