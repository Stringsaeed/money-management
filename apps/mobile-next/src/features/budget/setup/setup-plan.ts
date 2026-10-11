import { projectBudget } from "@trove/domain/budget";
import {
  type V2Account,
  type V2BudgetActivateInput,
  type V2BudgetSetupFacts,
  type V2PaydayRule,
} from "@trove/api/v2/contracts";

import { currencyFractionDigits, parseMoneyMinor } from "@/utils/money";

import { isItemTicked, type SetupItem } from "./setup-items";
import { type GROUP_ORDER, type SetupDraft } from "./setup-types";

/** Typed money text: empty is 0, anything that is not a valid amount in `currency` is `null`. */
export function parseAmountText(text: string, currency: string): number | null {
  const value = text.trim();
  if (!value) return 0;
  const minor = parseMoneyMinor(value, currency);
  return minor !== null && minor >= 0 ? minor : null;
}

const isFundingEligible = (account: V2Account, currency: string): boolean =>
  !account.archived && account.currency === currency && account.type !== "credit_card";

/** Accounts a person can tick as money they have now: active, in the budget currency, not a credit card. */
export const fundingEligibleAccounts = (
  accounts: readonly V2Account[],
  currency: string,
): V2Account[] => accounts.filter((account) => isFundingEligible(account, currency));

const DEFAULT_FUNDING_TYPES = new Set<V2Account["type"]>(["checking", "cash"]);

/** Current and cash accounts start ticked; savings, investment and the rest do not. */
export const isFundingTicked = (
  account: V2Account,
  funding: Readonly<Record<string, boolean>>,
): boolean => funding[account.id] ?? DEFAULT_FUNDING_TYPES.has(account.type);

export interface FundingChoice {
  /** Ticked eligible accounts. Empty when the person types one total instead. */
  readonly accountIds: readonly string[];
  /** The typed total in minor units when no eligible account exists. */
  readonly openingCashMinor: number | null;
  /** The typed total could not be read. */
  readonly invalid: boolean;
}

/** With eligible accounts the person ticks them; with none they type one total. */
export function fundingChoice(
  accounts: readonly V2Account[],
  draft: Pick<SetupDraft, "funding" | "openingCash">,
  currency: string,
): FundingChoice {
  const eligible = fundingEligibleAccounts(accounts, currency);
  if (eligible.length > 0) {
    return {
      accountIds: eligible
        .filter((account) => isFundingTicked(account, draft.funding))
        .map((account) => account.id),
      openingCashMinor: null,
      invalid: false,
    };
  }
  const total = parseAmountText(draft.openingCash, currency);
  return { accountIds: [], openingCashMinor: total ?? 0, invalid: total === null };
}

/** Whether S2 can move on: a payday, readable money text, and money to plan with. */
export function paydayStepReady(
  draft: Pick<SetupDraft, "payday" | "usualSalary">,
  funding: FundingChoice,
  currency: string,
): boolean {
  const needsAccount = funding.openingCashMinor === null && funding.accountIds.length === 0;
  return (
    draft.payday !== null &&
    parseAmountText(draft.usualSalary, currency) !== null &&
    !funding.invalid &&
    !needsAccount
  );
}

export interface PlanInputs {
  readonly currency: string;
  readonly facts: V2BudgetSetupFacts;
  readonly payday: V2PaydayRule;
  /** The ticked items, in envelope order. */
  readonly items: readonly SetupItem[];
  readonly amounts: Readonly<Record<string, string>>;
  readonly funding: FundingChoice;
}

export const plannedMinor = (
  item: SetupItem,
  amounts: Readonly<Record<string, string>>,
  currency: string,
): number => parseAmountText(amounts[item.key] ?? "", currency) ?? 0;

export const hasInvalidAmount = (
  items: readonly SetupItem[],
  amounts: Readonly<Record<string, string>>,
  currency: string,
): boolean => items.some((item) => parseAmountText(amounts[item.key] ?? "", currency) === null);

export interface PlanPreview {
  /** Left to plan (S4) and Not planned yet (S5): the engine's Unassigned Money at activation. */
  readonly leftToPlanMinor: number;
  readonly safeToSpendMinor: number;
  readonly perDayMinor: number;
  readonly daysLeft: number;
  readonly groupTotals: Readonly<Record<(typeof GROUP_ORDER)[number], number>>;
}

/**
 * Runs the same engine the server runs at activation on the draft plan, so Left to plan and the
 * Safe to spend in the review equal the numbers the new budget shows. Spending already logged in
 * the period counts once: it lowers what an envelope has left and is not added back.
 */
export function previewPlan(inputs: PlanInputs): PlanPreview {
  const { currency, facts, payday, items, amounts, funding } = inputs;
  const start = facts.period.start;
  const fundingIds = new Set(funding.accountIds);
  const mappedCategoryIds = new Set(
    items.flatMap((item) => (item.categoryId ? [item.categoryId] : [])),
  );

  const cashMinor =
    funding.openingCashMinor ??
    facts.accountBalances
      .filter((balance) => fundingIds.has(balance.accountId))
      .reduce((sum, balance) => sum + balance.balanceMinor, 0);

  const projection = projectBudget({
    paydays: [{ effectiveFrom: start, rule: payday }],
    activationStart: start,
    envelopes: items.map((item) => ({
      id: item.key,
      group: item.group,
      categoryIds: item.categoryId ? [item.categoryId] : [],
      startFresh: false,
    })),
    assignments: items.flatMap((item) => {
      const amountMinor = plannedMinor(item, amounts, currency);
      return amountMinor > 0
        ? [
            {
              periodStart: start,
              fromEnvelopeId: null,
              toEnvelopeId: item.key,
              amountMinor,
              reason: "plan" as const,
            },
          ]
        : [];
    }),
    // The server's rule: EVERY expense on a budget-currency credit card (archived cards and unmapped
    // Categories too: they reserve cash), plus expenses from a ticked funding account in a mapped
    // Category.
    spending: facts.spendSincePeriodStart.flatMap((row) =>
      row.onCard ||
      (fundingIds.has(row.accountId) &&
        row.categoryId !== null &&
        mappedCategoryIds.has(row.categoryId))
        ? [
            {
              date: start,
              categoryId: row.categoryId,
              amountMinor: row.amountMinor,
              onCard: row.onCard,
            },
          ]
        : [],
    ),
    // Every row already pays a budget-currency credit card; only payments from a ticked account count.
    cardPayments: facts.cardPaymentsSincePeriodStart
      .filter((payment) => fundingIds.has(payment.fromAccountId))
      .map((payment) => ({ date: start, amountMinor: payment.amountMinor })),
    cashMinor,
    openingCardDebtMinor: facts.openingCardDebtMinor,
    minorUnitsPerWhole: 10 ** currencyFractionDigits(currency),
    today: facts.today,
  });

  const groupTotals = { bills: 0, everyday: 0, saving: 0 };
  for (const item of items) groupTotals[item.group] += plannedMinor(item, amounts, currency);
  const current = projection.current;
  return {
    leftToPlanMinor: current.unassignedMinor,
    safeToSpendMinor: current.safeToSpendMinor,
    perDayMinor: current.perDayMinor,
    daysLeft: current.daysLeft,
    groupTotals,
  };
}

/** The ticked items in envelope order: Bills, then Everyday, then Saving for. */
export const tickedItems = (
  items: readonly SetupItem[],
  selection: Readonly<Record<string, boolean>>,
): SetupItem[] => items.filter((item) => isItemTicked(item, selection));

/** The one activation request for the draft: funding, envelopes with their Categories, amounts. */
export function buildActivateInput(
  draft: Pick<SetupDraft, "usualSalary" | "paydayReminder" | "amounts">,
  payday: V2PaydayRule,
  funding: FundingChoice,
  items: readonly SetupItem[],
  currency: string,
): V2BudgetActivateInput & { readonly currency: string } {
  const salary = parseAmountText(draft.usualSalary, currency) ?? 0;
  return {
    currency,
    paydayRule: payday,
    ...(salary > 0 && { usualSalaryMinor: salary }),
    paydayReminder: draft.paydayReminder,
    ...(funding.openingCashMinor === null
      ? { fundingAccountIds: [...funding.accountIds] }
      : { openingCashMinor: funding.openingCashMinor }),
    envelopes: items.map((item) => ({
      name: item.name,
      group: item.group,
      ...(item.categoryId ? { categoryId: item.categoryId } : { newCategory: { name: item.name } }),
      plannedMinor: plannedMinor(item, draft.amounts, currency),
    })),
  };
}
