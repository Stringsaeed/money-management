import { Effect } from "effect";

import {
  nextPeriodStart,
  paydaysLeft,
  projectBudget,
  ruleInEffect,
  savingPerPayday,
  type BudgetProjection,
  type EnvelopePeriodTotals,
  type PaydayChange,
} from "@trove/domain/budget";

import { BudgetNotFound } from "./budget-errors";
import { LedgerFacts } from "./budget-ledger-facts";
import { BudgetClock, budgetToday } from "./budget-services";
import { BudgetStore, type BudgetRow, type EnvelopeRow, type MappedEnvelope } from "./budget-store";
import type { V2Budget, V2BudgetView, V2Envelope, V2EnvelopeTotals } from "./contracts";
import { iso } from "./shared";

/**
 * Budget reads (#366/#367). Every total is derived on read by `projectBudget`
 * from the stored plan plus bounded, ledger-scoped aggregates over
 * transactions. Facts dated after today do not count yet.
 */

export type ActiveBudgetView = Extract<V2BudgetView, { readonly budget: object }>;

/** The stored plan plus the projection derived from it. */
export interface LoadedBudget {
  readonly budget: BudgetRow;
  readonly paydays: readonly PaydayChange[];
  readonly fundingAccountIds: readonly string[];
  readonly envelopes: readonly MappedEnvelope[];
  readonly projection: BudgetProjection;
}

/** `GET /budget`. */
export const getBudget = Effect.gen(function* () {
  const budget = yield* (yield* BudgetStore).findBudget;
  if (!budget) return { budget: null } satisfies V2BudgetView;
  return budgetView(yield* loadBudget(budget));
});

/** The ledger's budget, or `BudgetNotFound`. */
export const requireBudget = Effect.gen(function* () {
  const budget = yield* (yield* BudgetStore).findBudget;
  if (!budget) return yield* new BudgetNotFound();
  return budget;
});

/** Loads the plan and bounded transaction aggregates, then projects them for today. */
export const loadBudget = Effect.fn("loadBudget")(function* (budget: BudgetRow) {
  const store = yield* BudgetStore;
  const facts = yield* LedgerFacts;
  const { today } = yield* BudgetClock;
  const [plan, cardIds] = yield* Effect.all([store.loadPlan(budget), facts.cardAccountIds], {
    concurrency: "unbounded",
  });
  const range = { from: budget.activationPeriodStart, to: today };
  const [balances, spending, cardPayments, openingCardDebtMinor] = yield* Effect.all(
    [
      facts.balancesAsOf(plan.fundingAccountIds, today),
      facts.spending(
        plan.envelopes.flatMap((envelope) => envelope.categoryIds),
        plan.fundingAccountIds,
        cardIds,
        range,
      ),
      facts.cardPayments(plan.fundingAccountIds, cardIds, range),
      facts.openingCardDebt(cardIds, budget.activationPeriodStart),
    ],
    { concurrency: "unbounded" },
  );
  let cashMinor = 0;
  for (const value of balances.values()) cashMinor += value;

  const projection = projectBudget({
    paydays: plan.paydays,
    activationStart: budget.activationPeriodStart,
    envelopes: plan.envelopes.map((envelope) => ({
      id: envelope.id,
      group: envelope.group,
      categoryIds: envelope.categoryIds,
      startFresh: envelope.startFresh,
    })),
    assignments: plan.assignments,
    spending,
    cardPayments,
    cashMinor,
    openingCardDebtMinor,
    today,
  });
  return {
    budget,
    paydays: plan.paydays,
    fundingAccountIds: plan.fundingAccountIds,
    envelopes: plan.envelopes,
    projection,
  } satisfies LoadedBudget;
});

export function budgetView(loaded: LoadedBudget): ActiveBudgetView {
  const { budget, projection } = loaded;
  const current = projection.current;
  return {
    budget: budgetRow(budget),
    paydayRule: ruleInEffect(loaded.paydays, current.period.start),
    fundingAccountIds: loaded.fundingAccountIds,
    envelopes: loaded.envelopes.map((envelope) => ({
      ...envelopeRow(envelope),
      ...savingSuggestion(loaded, envelope),
    })),
    current: {
      period: current.period,
      unassignedMinor: current.unassignedMinor,
      safeToSpendMinor: current.safeToSpendMinor,
      perDayMinor: current.perDayMinor,
      daysLeft: current.daysLeft,
      cardReserveMinor: current.cardReserveMinor,
      envelopes: current.envelopes.map(envelopeTotals),
    },
  };
}

export function envelopeTotals(totals: EnvelopePeriodTotals): V2EnvelopeTotals {
  return {
    id: totals.envelopeId,
    plannedMinor: totals.plannedMinor,
    budgetedMinor: totals.budgetedMinor,
    spentMinor: totals.spentMinor,
    rolloverMinor: totals.rolloverMinor,
    leftMinor: totals.leftMinor,
  };
}

/**
 * Per-payday suggestion for a Saving-for envelope with a target and due date
 * (data rule 10). The envelope's current Left counts as already set aside, so
 * the suggestion recalculates after every assignment or payment.
 */
function savingSuggestion(
  loaded: LoadedBudget,
  envelope: EnvelopeRow,
): Pick<V2Envelope, "savingPerPaydayMinor" | "paydaysLeft" | "shortBeforePaydayMinor"> {
  const { targetMinor, dueDate } = envelope;
  if (envelope.group !== "saving" || targetMinor === null || dueDate === null) return {};
  const currentStart = loaded.projection.current.period.start;
  const rule = ruleInEffect(loaded.paydays, currentStart);
  const leftMinor =
    loaded.projection.current.envelopes.find((totals) => totals.envelopeId === envelope.id)
      ?.leftMinor ?? 0;
  const goal = {
    targetMinor,
    setAsideMinor: Math.max(leftMinor, 0),
    dueDate,
    rule,
    currentPeriodStart: currentStart,
  };
  const dueBeforePayday = dueDate < nextPeriodStart(rule, currentStart);
  return {
    savingPerPaydayMinor: savingPerPayday(goal),
    paydaysLeft: paydaysLeft(goal),
    ...(dueBeforePayday &&
      leftMinor < targetMinor && { shortBeforePaydayMinor: targetMinor - Math.max(leftMinor, 0) }),
  };
}

function budgetRow(row: BudgetRow): V2Budget {
  return {
    id: row.id,
    ledgerId: row.ledgerId,
    currency: row.currency,
    activationPeriodStart: row.activationPeriodStart,
    activatedOn: budgetToday(row.createdAt),
    usualSalaryMinor: row.usualSalaryMinor,
    paydayReminder: row.paydayReminder,
    defaultAccountId: row.defaultAccountId,
    version: row.version,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

function envelopeRow(row: MappedEnvelope): V2Envelope {
  return {
    id: row.id,
    name: row.name,
    group: row.group,
    startFresh: row.startFresh,
    targetMinor: row.targetMinor,
    dueDate: row.dueDate,
    repeat: row.repeat,
    archived: row.lifecycle === "archived",
    sortOrder: row.sortOrder,
    categoryIds: row.categoryIds,
    version: row.version,
  };
}
