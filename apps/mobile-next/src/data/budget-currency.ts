import { z } from "zod";

import { BUDGET_CURRENCY, type V2Account } from "@trove/api/v2/contracts";

/** Shown only before any budget exists, and when a screen cannot know its budget yet. */
export const DEFAULT_BUDGET_CURRENCY: string = BUDGET_CURRENCY;

/**
 * What a person chose on this device for one ledger: the budget they last looked at, and the
 * "Start a USD budget" prompts they dismissed (with the accounts in that currency they had then).
 */
export interface BudgetCurrencyState {
  readonly selected: string | null;
  /** Currency -> ids of that currency's accounts when the prompt was dismissed. */
  readonly dismissed: Readonly<Record<string, readonly string[]>>;
}

export const EMPTY_BUDGET_CURRENCY_STATE: BudgetCurrencyState = { selected: null, dismissed: {} };

const stateSchema = z.object({
  selected: z.string().nullable(),
  dismissed: z.record(z.string(), z.array(z.string())),
});

export const serializeBudgetCurrencyState = (state: BudgetCurrencyState): string =>
  JSON.stringify(state);

/** A damaged stored value reads as the defaults. */
export function parseBudgetCurrencyState(raw: string | null): BudgetCurrencyState {
  if (!raw) return EMPTY_BUDGET_CURRENCY_STATE;
  try {
    const parsed = stateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : EMPTY_BUDGET_CURRENCY_STATE;
  } catch {
    return EMPTY_BUDGET_CURRENCY_STATE;
  }
}

/**
 * The budget to show: the remembered one when it still exists, else the first (oldest) budget.
 * `null` when the ledger has no budget.
 */
export function pickBudgetCurrency(
  budgetCurrencies: readonly string[],
  selected: string | null,
): string | null {
  if (selected !== null && budgetCurrencies.includes(selected)) return selected;
  return budgetCurrencies[0] ?? null;
}

const isActive = (account: V2Account): boolean => !account.archived;

/** Counts accounts per currency, biggest first; equal counts sort by code. */
function currencyCounts(accounts: readonly V2Account[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const account of accounts) {
    counts.set(account.currency, (counts.get(account.currency) ?? 0) + 1);
  }
  return [...counts.entries()].sort(
    ([leftCode, left], [rightCode, right]) => right - left || leftCode.localeCompare(rightCode),
  );
}

/**
 * The currency to prefill for the first budget: the one most active non-card accounts hold.
 * AED wins a tie it takes part in, and is the answer when there are no such accounts.
 */
export function defaultFirstBudgetCurrency(accounts: readonly V2Account[]): string {
  const counts = currencyCounts(
    accounts.filter((account) => isActive(account) && account.type !== "credit_card"),
  );
  const [top] = counts;
  if (!top) return DEFAULT_BUDGET_CURRENCY;
  const tied = counts.filter(([, count]) => count === top[1]).map(([code]) => code);
  return tied.includes(DEFAULT_BUDGET_CURRENCY) ? DEFAULT_BUDGET_CURRENCY : top[0];
}

/**
 * Currencies to offer a "Start a USD budget" prompt for: the ledger has an active account in
 * the currency, no budget exists for it, and the person has not dismissed the prompt since the
 * newest of those accounts appeared. Most accounts first.
 */
export function promptCurrencies(
  accounts: readonly V2Account[],
  budgetCurrencies: readonly string[],
  dismissed: BudgetCurrencyState["dismissed"],
): string[] {
  const open = accounts.filter(
    (account) => isActive(account) && !budgetCurrencies.includes(account.currency),
  );
  return currencyCounts(open)
    .map(([code]) => code)
    .filter((code) => {
      const seen = new Set(dismissed[code] ?? []);
      return open.some((account) => account.currency === code && !seen.has(account.id));
    });
}

/** Remembers the dismissal together with the accounts the person had in that currency. */
export function dismissCurrencyPrompt(
  state: BudgetCurrencyState,
  currency: string,
  accounts: readonly V2Account[],
): BudgetCurrencyState {
  const ids = accounts
    .filter((account) => account.currency === currency)
    .map((account) => account.id);
  return { ...state, dismissed: { ...state.dismissed, [currency]: ids } };
}

/**
 * Operation name for an idempotent budget write. The server keeps one key per ledger and
 * operation, so every currency gets its own operation (and so its own key).
 */
export const budgetOperation = (operation: string, currency: string): string =>
  `${operation}:${currency}`;
