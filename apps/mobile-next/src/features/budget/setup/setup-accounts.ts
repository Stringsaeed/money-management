import type { V2Account, V2AccountType } from "@trove/api/v2/contracts";

import { accountTypeOption } from "@/features/ledger/accounts/account-display";
import { amountParts, MINUS } from "@/ui/trove";

import { fundingEligibleAccounts, isFundingTicked, type FundingChoice } from "./setup-plan";
import type { SetupDraft } from "./setup-types";

/** One "Money you have right now" row: what it shows and whether it can be ticked. */
export interface FundingRowModel {
  readonly id: string;
  readonly emoji: string;
  readonly name: string;
  /** The type, or why the row cannot be ticked. */
  readonly note: string;
  readonly balance: string;
  readonly ticked: boolean;
  readonly disabled: boolean;
}

const TYPE_NOTES = {
  checking: "Current account",
  savings: "Savings",
  cash: "Cash",
  credit_card: "Card",
  investment: "Investment",
  other: "Other",
} as const satisfies Record<V2AccountType, string>;

/** Why an account cannot hold budget money, or null when it can. */
function unavailableReason(account: V2Account, currency: string): string | null {
  if (account.type === "credit_card") return "Card spending comes out of envelopes";
  if (account.currency !== currency) return `Not in your ${currency} budget`;
  return null;
}

/**
 * The balance as the row prints it: "12,400.00" in the budget currency, "€3,120.00" or
 * "AED 3,120.00" in another one, "−2,140.00" for money owed.
 */
export function accountBalanceLabel(account: V2Account, currency: string): string {
  const parts = amountParts(account.balanceMinor, account.currency, "auto");
  const sign = account.balanceMinor < 0 ? MINUS : "";
  const digits = `${parts.whole}${parts.fraction}`;
  if (account.currency === currency) return `${sign}${digits}`;
  const prefix = parts.glyph ? `${account.currency} ` : parts.symbol;
  return `${sign}${prefix}${digits}`;
}

/**
 * Every active account, those that can be ticked first. Savings and the rest say they start
 * unticked; cards and other currencies say why they are left out.
 */
export function fundingRows(
  accounts: readonly V2Account[],
  draft: Pick<SetupDraft, "funding">,
  currency: string,
  /** Household setup prints the account name alone, as the board does. */
  showType: boolean,
): FundingRowModel[] {
  const rows = accounts
    .filter((account) => !account.archived)
    .map((account): FundingRowModel => {
      const reason = unavailableReason(account, currency);
      const ticked = reason === null && isFundingTicked(account, draft.funding);
      const startsTicked = isFundingTicked(account, {});
      const typeNote = `${TYPE_NOTES[account.type]}${startsTicked ? "" : " · not ticked by default"}`;
      return {
        id: account.id,
        emoji: accountTypeOption(account.type).emoji,
        name: account.name,
        note: reason ?? (showType ? typeNote : ""),
        balance: accountBalanceLabel(account, currency),
        ticked,
        disabled: reason !== null,
      };
    });
  return [...rows.filter((row) => !row.disabled), ...rows.filter((row) => row.disabled)];
}

/** Whether the person types one total because no account can hold budget money. */
export const needsTypedTotal = (accounts: readonly V2Account[], currency: string): boolean =>
  fundingEligibleAccounts(accounts, currency).length === 0;

/**
 * Money to plan: the typed total, else the ticked accounts' balances. Balances come from the
 * setup facts (transactions up to today) when they have loaded, as the plan preview uses.
 */
export function moneyToPlanMinor(
  funding: FundingChoice,
  accounts: readonly V2Account[],
  factsBalances: readonly { readonly accountId: string; readonly balanceMinor: number }[] | null,
): number {
  if (funding.openingCashMinor !== null) return funding.openingCashMinor;
  const ticked = new Set(funding.accountIds);
  const source =
    factsBalances ?? accounts.map((a) => ({ accountId: a.id, balanceMinor: a.balanceMinor }));
  return source
    .filter((balance) => ticked.has(balance.accountId))
    .reduce((sum, balance) => sum + balance.balanceMinor, 0);
}
