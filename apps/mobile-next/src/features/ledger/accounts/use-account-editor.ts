import { useState } from "react";

import type { V2Account } from "@trove/api/v2/contracts";

import type { AccountInput, AccountType } from "@/data/ledger-client";
import { playCue } from "@/features/sound";
import { currencyFractionDigits, parseMoneyMinor } from "@/utils/money";

import { fitEntryToPrecision, normalizeEntry } from "./account-entry";
import { errorHaptic, pickHaptic } from "./editor-haptics";
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
      amount: fitEntryToPrecision(draft.amount, currencyFractionDigits(currency)),
    });

  const selectSign = (negative: boolean) => {
    if (negative === draft.negative) return;
    pickHaptic();
    playCue("toggle");
    update({ negative });
  };

  /** Keypad presses report the next canonical entry; the pad already supplies its own haptic. */
  const changeAmount = (amount: string) => {
    playCue("key");
    update({ amount });
  };

  const submit = async () => {
    const amountMinor = parseMoneyMinor(normalizeEntry(draft.amount), draft.currency);
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
    selectSign,
    changeAmount,
    clearAmount: () => update({ amount: "" }),
    submit,
  };
}
