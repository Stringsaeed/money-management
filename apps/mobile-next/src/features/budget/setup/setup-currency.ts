import type { V2Account } from "@trove/api/v2/contracts";

import { defaultFirstBudgetCurrency } from "@/data/budget-currency";

export interface SetupCurrency {
  readonly currency: string;
  /** An additional budget's currency is fixed by the route; the first budget's is a choice. */
  readonly fixed: boolean;
}

/**
 * The currency this setup is for: the route's for an additional budget, else the person's pick,
 * else the currency most of their active non-card accounts hold (AED on ties).
 */
export function resolveSetupCurrency(
  target: string | null,
  chosen: string | null,
  accounts: readonly V2Account[],
): SetupCurrency {
  if (target !== null) return { currency: target, fixed: true };
  return { currency: chosen ?? defaultFirstBudgetCurrency(accounts), fixed: false };
}

/** S2's lead-in for an additional budget, which names its currency; the first budget has none. */
export const paydayIntro = (fixed: boolean, currency: string): string | null =>
  fixed ? `Your ${currency} budget. No bank connection needed.` : null;

/** The currencies to pick from: those of active accounts, the current pick always included. */
export function currencyChoices(accounts: readonly V2Account[], current: string): string[] {
  const held = new Set(accounts.filter((account) => !account.archived).map((a) => a.currency));
  held.add(current);
  return [...held].sort();
}
