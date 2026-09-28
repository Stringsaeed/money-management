import type { V2Account } from "@trove/api/v2/contracts";

import type { AccountInput, AccountType } from "@/data/ledger-client";
import { decimalFromMinor } from "@/utils/money";

import { accountTypeOption } from "./account-display";

export interface AccountDraft {
  readonly name: string;
  readonly type: AccountType;
  readonly currency: string;
  /** Unsigned keypad entry ("12.5"); the sign lives in `negative`. */
  readonly amount: string;
  /** Opening balance is money owed, e.g. a credit card that starts with a balance. */
  readonly negative: boolean;
}

export function initialAccountDraft(
  account: V2Account | undefined,
  defaultCurrency: string,
): AccountDraft {
  if (!account)
    return { name: "", type: "checking", currency: defaultCurrency, amount: "", negative: false };
  const opening = account.openingBalanceMinor;
  return {
    name: account.name,
    type: accountTypeOption(account.type).type,
    currency: account.currency,
    amount: opening === 0 ? "" : decimalFromMinor(Math.abs(opening), account.currency),
    negative: opening < 0,
  };
}

/** Returns a user-facing message explaining what to fix, or undefined when the draft is valid. */
export function accountDraftError(
  draft: AccountDraft,
  amountMinor: number | null,
): string | undefined {
  if (!draft.name.trim()) return "Give this account a name so you can spot it later.";
  if (amountMinor === null) return `Enter an opening balance ${draft.currency} can hold.`;
  return undefined;
}

export function accountInputFromDraft(draft: AccountDraft, amountMinor: number): AccountInput {
  return {
    name: draft.name.trim(),
    type: draft.type,
    currency: draft.currency,
    // Avoid sending -0 when "owed" is toggled on an empty balance.
    openingBalanceMinor: draft.negative && amountMinor !== 0 ? -amountMinor : amountMinor,
  };
}
