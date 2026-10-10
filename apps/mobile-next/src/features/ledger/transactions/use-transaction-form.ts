import { useState } from "react";

import type { V2Account, V2Category, V2Transaction } from "@trove/api/v2/contracts";

import type { TransactionInput } from "@/data/ledger-client";
import { useAiPreferences } from "@/features/ai";
import { playCue } from "@/features/sound";
import { currencyFractionDigits, parseMoneyMinor } from "@/utils/money";

import { hasAiPickChoice } from "./ai-pick";
import { fitAmountToPrecision, normalizeAmountEntry } from "./amount-entry";
import { errorHaptic } from "./transaction-haptics";
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
  // "AI pick" is offered on create only; an edit keeps the category the person sees.
  const canAutoCategorize = useAiPreferences().autoCategorize && !transaction;
  const [draft, setDraft] = useState(() =>
    initialTransactionDraft(transaction, activeAccounts, canAutoCategorize),
  );

  // Validation copy stays quiet until the person has touched the form.
  const [touched, setTouched] = useState(false);

  // Currency always comes from the chosen account; until one exists there is no currency to show.
  const currencyOf = (accountId: string): string | null =>
    accounts.find((item) => item.id === accountId)?.currency ?? transaction?.currency ?? null;
  const digitsFor = (code: string | null) =>
    code ? currencyFractionDigits(code) : DEFAULT_FRACTION_DIGITS;
  const currency = currencyOf(draft.accountId);
  const fractionDigits = digitsFor(currency);
  const activeCategories = categories.filter((item) => !item.archived);
  const autoCategorize =
    canAutoCategorize && draft.autoCategorize && hasAiPickChoice(activeCategories, draft.kind);

  const amountMinorOf = (amount: string) =>
    currency ? parseMoneyMinor(normalizeAmountEntry(amount), currency) : null;
  const draftError = transactionDraftError(
    draft,
    amountMinorOf(draft.amount),
    activeAccounts.length > 0,
  );

  const update = (patch: Partial<TransactionDraft>) => {
    setTouched(true);
    setDraft((current) => ({ ...current, ...patch }));
  };

  // The category decides the transaction type; transfers are picked from the same sheet.
  const selectCategory = (category: V2Category) =>
    update({
      kind: category.kind,
      categoryId: category.id,
      toAccountId: null,
      autoCategorize: false,
    });

  const selectTransfer = () =>
    update({ kind: "transfer", categoryId: null, autoCategorize: false });

  /** The person sets the direction; AI picks among that kind's categories on save. */
  const selectAutoCategory = (kind: V2Category["kind"]) =>
    update({ kind, categoryId: null, toAccountId: null, autoCategorize: true });

  const selectAccount = (accountId: string) =>
    update({
      accountId,
      toAccountId: draft.toAccountId === accountId ? null : draft.toAccountId,
      amount: fitAmountToPrecision(draft.amount, digitsFor(currencyOf(accountId))),
    });

  /** The keypad reports the next canonical entry; it already gives its own key haptic. */
  const changeAmount = (amount: string) => {
    playCue("key");
    update({ amount });
  };

  const submit = async () => {
    const amountMinor = amountMinorOf(draft.amount);
    if (draftError || amountMinor === null) {
      errorHaptic();
      playCue("error");
      setTouched(true);
      return;
    }
    await onSubmit(transactionInputFromDraft({ ...draft, autoCategorize }, amountMinor));
  };

  return {
    draft,
    currency,
    fractionDigits,
    activeAccounts,
    activeCategories,
    canSave: draftError === undefined,
    validationError: touched ? draftError : undefined,
    autoCategorize,
    selectCategory,
    selectTransfer,
    selectAutoCategory: canAutoCategorize ? selectAutoCategory : undefined,
    selectAccount,
    setToAccountId: (toAccountId: string) => update({ toAccountId }),
    setDate: (date: string) => update({ date }),
    setNote: (note: string) => update({ note }),
    changeAmount,
    clearAmount: () => update({ amount: "" }),
    submit,
  };
}
