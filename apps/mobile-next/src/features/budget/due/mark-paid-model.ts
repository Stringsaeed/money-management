import {
  type V2Account,
  type V2DueOccurrence,
  type V2RecurringPayInput,
} from "@trove/api/v2/contracts";

import { ApiError } from "@/data/http";

import { parseMoneyMinor } from "@/utils/money";

import { paidWithAccounts } from "../quick-add/quick-add-model";
import { currencyErrorMessage } from "../currency/currency-errors";
import { roleErrorMessage } from "../role/budget-role";

/**
 * Where a bill in the budget's currency can be paid from: the budget's funding accounts and credit cards, the accounts
 * whose spending the budget counts. A bill in another currency is outside the budget, so any
 * active account in its currency.
 */
export function markPaidAccounts(
  accounts: readonly V2Account[],
  item: Pick<V2DueOccurrence, "currency">,
  fundingAccountIds: readonly string[],
  budgetCurrency: string,
): V2Account[] {
  if (item.currency !== budgetCurrency) {
    return accounts.filter((account) => !account.archived && account.currency === item.currency);
  }
  const { funding, cards } = paidWithAccounts(accounts, fundingAccountIds, budgetCurrency);
  return [...funding, ...cards];
}

/** The bill's own account when it is on offer, else the first account on offer. */
export function markPaidDefaultAccountId(
  choices: readonly V2Account[],
  item: Pick<V2DueOccurrence, "accountId">,
): string {
  return choices.some((account) => account.id === item.accountId)
    ? item.accountId
    : (choices[0]?.id ?? item.accountId);
}

export interface MarkPaidDraft {
  readonly amountText: string;
  readonly accountId: string;
  readonly date: string;
}

export type MarkPaidCheck =
  | { readonly ok: true; readonly input: V2RecurringPayInput }
  | { readonly ok: false; readonly error: string };

/**
 * Only what differs from the bill is sent, so a plain Mark paid posts the rule's amount, account
 * and scheduled date. Overrides apply to this payment only.
 */
export function checkMarkPaid(item: V2DueOccurrence, draft: MarkPaidDraft): MarkPaidCheck {
  const amountMinor = parseMoneyMinor(draft.amountText, item.currency);
  if (amountMinor === null || amountMinor <= 0) {
    return { ok: false, error: "Enter an amount above zero." };
  }
  if (!draft.accountId) return { ok: false, error: "Choose the account you paid from." };
  const input: V2RecurringPayInput = {};
  if (amountMinor !== item.amountMinor) input.amountMinor = amountMinor;
  if (draft.accountId !== item.accountId) input.accountId = draft.accountId;
  if (draft.date !== item.scheduledDate) input.date = draft.date;
  return { ok: true, input };
}

/** What went wrong and that nothing was recorded, for Mark paid and Skip. */
export function occurrenceErrorMessage(cause: unknown, action: "pay" | "skip"): string {
  const refused = roleErrorMessage(cause) ?? currencyErrorMessage(cause);
  if (refused) return refused;
  if (cause instanceof ApiError) {
    if (cause.code === "network_error") return "You're offline. Nothing was recorded.";
    if (cause.code === "occurrence_already_paid") return "This bill was already marked paid.";
    if (cause.code === "occurrence_already_skipped") return "This bill was already skipped.";
  }
  return action === "pay"
    ? "Couldn't mark this paid. Nothing was recorded, so try again."
    : "Couldn't skip this bill. Nothing was recorded, so try again.";
}
