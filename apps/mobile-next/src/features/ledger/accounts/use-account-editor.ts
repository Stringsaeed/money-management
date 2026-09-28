import { useState } from "react";

import type { V2Account } from "@trove/api/v2/contracts";

import type { AccountInput, AccountType } from "@/data/ledger-client";
import { playCue } from "@/features/sound";
import { currencyFractionDigits, parseMoneyMinor } from "@/utils/money";

import {
  applyAmountKey,
  fitAmountToPrecision,
  normalizeAmountEntry,
  type AmountKey,
} from "../transactions/amount-entry";
import { errorHaptic, keyHaptic } from "../transactions/transaction-haptics";
import {
  accountDraftError,
  accountInputFromDraft,
  initialAccountDraft,
  type AccountDraft,
} from "./account-draft";

interface UseAccountEditorOptions {
  readonly account?: V2Account;
  readonly defaultCurrency: string;
  readonly onSubmit: (input: AccountInput) => Promise<void>;
}

export function useAccountEditor({ account, defaultCurrency, onSubmit }: UseAccountEditorOptions) {
  const [draft, setDraft] = useState(() => initialAccountDraft(account, defaultCurrency));
  const [validationError, setValidationError] = useState<string>();
  const fractionDigits = currencyFractionDigits(draft.currency);

  const update = (patch: Partial<AccountDraft>) => {
    setValidationError(undefined);
    setDraft((current) => ({ ...current, ...patch }));
  };

  const selectCurrency = (currency: string) =>
    update({
      currency,
      amount: fitAmountToPrecision(draft.amount, currencyFractionDigits(currency)),
    });

  const toggleSign = () => {
    keyHaptic();
    playCue("toggle");
    update({ negative: !draft.negative });
  };

  const pressKey = (key: AmountKey) => {
    keyHaptic();
    playCue("key");
    setValidationError(undefined);
    setDraft((current) => ({
      ...current,
      amount: applyAmountKey(current.amount, key, fractionDigits),
    }));
  };

  const submit = async () => {
    const amountMinor = parseMoneyMinor(normalizeAmountEntry(draft.amount), draft.currency);
    const error = accountDraftError(draft, amountMinor);
    if (error || amountMinor === null) {
      errorHaptic();
      playCue("error");
      setValidationError(error);
      return;
    }
    setValidationError(undefined);
    await onSubmit(accountInputFromDraft(draft, amountMinor));
  };

  return {
    draft,
    fractionDigits,
    validationError,
    selectType: (type: AccountType) => update({ type }),
    selectCurrency,
    setName: (name: string) => update({ name }),
    toggleSign,
    pressKey,
    clearAmount: () => update({ amount: "" }),
    submit,
  };
}
