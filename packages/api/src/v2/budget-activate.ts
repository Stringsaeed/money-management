import { Effect } from "effect";
import type { z } from "zod";

import {
  nextPeriodStart,
  periodContaining,
  ruleInEffect,
  type PaydayChange,
  type PaydayRule,
} from "@trove/domain/budget";

import { budgetView, loadBudget, requireBudget } from "./budget";
import { resolveCategories } from "./budget-categories";
import {
  BudgetAlreadyActive,
  BudgetDefaultAccountInvalid,
  BudgetFundingInvalid,
  BudgetNotSaved,
  BudgetOverplanned,
} from "./budget-errors";
import { LedgerFacts } from "./budget-ledger-facts";
import { inLedgerMutation } from "./budget-mutation";
import {
  BudgetClock,
  BudgetLedger,
  budgetActor,
  checkVersion,
  requirePlanAccess,
} from "./budget-services";
import { BudgetStore, paydayColumns } from "./budget-store";
import { BUDGET_CURRENCY, type budgetActivateSchema, type budgetUpdateSchema } from "./contracts";
import { ReminderStore } from "./recurring-reminder-store";

export type BudgetActivation = z.output<typeof budgetActivateSchema>;
export type BudgetUpdate = z.output<typeof budgetUpdateSchema>;

const MY_MONEY_ACCOUNT_NAME = "My money";

/**
 * Activates the ledger's budget in one transaction (#367 S5): funding,
 * categories, envelopes, 1:1 mappings, payday history, and plan assignments.
 * The overplan guard projects the would-be state inside the same transaction
 * and fails (rolling everything back) when Not planned yet would go negative.
 */
export const activateBudget = Effect.fn("activateBudget")(function* (
  input: BudgetActivation,
  idempotencyKey: string | undefined,
) {
  yield* requirePlanAccess;
  return yield* inLedgerMutation("budget.activate", idempotencyKey, writeActivation(input));
});

const writeActivation = Effect.fn("writeActivation")(function* (input: BudgetActivation) {
  const store = yield* BudgetStore;
  const { ledgerId } = yield* BudgetLedger;
  const { today } = yield* BudgetClock;
  if (yield* store.findBudget) return yield* new BudgetAlreadyActive();
  const actor = yield* budgetActor;
  const period = periodContaining(input.paydayRule, today);
  const fundingAccountIds = yield* fundingAccounts(input);
  const categoryIds = yield* resolveCategories(input.envelopes);

  const budgetId = crypto.randomUUID();
  const envelopes = input.envelopes.map((envelope, index) => ({
    input: envelope,
    id: crypto.randomUUID(),
    categoryId: categoryIds[index],
  }));
  yield* store.insertPlan({
    budget: {
      ledgerId,
      id: budgetId,
      currency: BUDGET_CURRENCY,
      activationPeriodStart: period.start,
      usualSalaryMinor: input.usualSalaryMinor ?? null,
      paydayReminder: input.paydayReminder,
      defaultAccountId: input.defaultAccountId ?? fundingAccountIds[0],
      createdBy: actor,
      updatedBy: actor,
    },
    payday: {
      ledgerId,
      budgetId,
      effectiveFrom: period.start,
      ...paydayColumns(input.paydayRule),
      createdBy: actor,
    },
    funding: fundingAccountIds.map((accountId) => ({ ledgerId, budgetId, accountId })),
    envelopes: envelopes.map(({ input: envelope, id }, sortOrder) => ({
      ledgerId,
      id,
      budgetId,
      name: envelope.name,
      group: envelope.group,
      targetMinor: envelope.targetMinor ?? null,
      dueDate: envelope.dueDate ?? null,
      repeat: envelope.repeat ?? null,
      sortOrder,
      createdBy: actor,
      updatedBy: actor,
    })),
    mappings: envelopes.flatMap(({ id, categoryId }) =>
      categoryId ? [{ ledgerId, envelopeId: id, categoryId }] : [],
    ),
    // A Saving-for envelope's money already set aside is a second plan assignment.
    assignments: envelopes.flatMap(({ input: envelope, id }) =>
      [envelope.plannedMinor, envelope.setAsideMinor]
        .filter((amountMinor) => amountMinor > 0)
        .map((amountMinor) => ({
          ledgerId,
          id: crypto.randomUUID(),
          budgetId,
          periodStart: period.start,
          fromEnvelopeId: null,
          toEnvelopeId: id,
          amountMinor,
          reason: "plan" as const,
          createdBy: actor,
        })),
    ),
  });
  yield* (yield* ReminderStore).remindBillRules(
    envelopes.flatMap(({ input: envelope, categoryId }) =>
      envelope.group === "bills" && categoryId ? [categoryId] : [],
    ),
  );

  const budget = yield* store.findBudget;
  if (!budget) return yield* new BudgetNotSaved({ operation: "activation" });
  const loaded = yield* loadBudget(budget);
  const unassignedMinor = loaded.projection.current.unassignedMinor;
  if (unassignedMinor < 0) {
    return yield* new BudgetOverplanned({ change: "activation", unassignedMinor });
  }
  return budgetView(loaded);
});

/** The ticked funding accounts, or a new "My money" cash account holding the opening cash. */
const fundingAccounts = Effect.fn("fundingAccounts")(function* (input: BudgetActivation) {
  const facts = yield* LedgerFacts;
  if (!input.fundingAccountIds) {
    const id = crypto.randomUUID();
    yield* facts.insertCashAccount(id, MY_MONEY_ACCOUNT_NAME, input.openingCashMinor ?? 0);
    return [id];
  }
  const accountIds = input.fundingAccountIds;
  const rows = yield* facts.accountsByIds(accountIds);
  // Funding accounts hold spendable AED: active, AED, and not a credit card.
  for (const accountId of accountIds) {
    const account = rows.find((row) => row.id === accountId);
    const reason =
      !account || account.lifecycle !== "active"
        ? "missing"
        : account.currency !== BUDGET_CURRENCY
          ? "currency"
          : account.type === "credit_card"
            ? "credit_card"
            : undefined;
    if (reason) return yield* new BudgetFundingInvalid({ accountId, reason });
  }
  return accountIds;
});

/**
 * Changes budget settings (If-Match). A payday change is recorded from the
 * current period start, so earlier periods never move.
 */
export const updateBudget = Effect.fn("updateBudget")(function* (
  input: BudgetUpdate,
  expectedVersion: number | undefined,
  idempotencyKey: string | undefined,
) {
  yield* requirePlanAccess;
  return yield* inLedgerMutation(
    "budget.update",
    idempotencyKey,
    writeUpdate(input, expectedVersion),
  );
});

const writeUpdate = Effect.fn("writeUpdate")(function* (
  input: BudgetUpdate,
  expectedVersion: number | undefined,
) {
  const store = yield* BudgetStore;
  const budget = yield* requireBudget;
  yield* checkVersion(expectedVersion, budget.version, budget.id);
  const actor = yield* budgetActor;

  if (input.paydayRule) {
    const { today } = yield* BudgetClock;
    const loaded = yield* loadBudget(budget);
    const currentStart = loaded.projection.current.period.start;
    const effectiveFrom = paydayEffectiveFrom(
      loaded.paydays,
      currentStart,
      input.paydayRule,
      today,
    );
    yield* store.recordPaydayChange(
      budget.id,
      currentStart,
      effectiveFrom,
      input.paydayRule,
      actor,
    );
  }
  if (input.defaultAccountId) yield* requireDefaultAccount(input.defaultAccountId);

  const updated = yield* store.updateBudget(
    budget.id,
    {
      ...(input.usualSalaryMinor !== undefined && { usualSalaryMinor: input.usualSalaryMinor }),
      ...(input.paydayReminder !== undefined && { paydayReminder: input.paydayReminder }),
      ...(input.defaultAccountId !== undefined && { defaultAccountId: input.defaultAccountId }),
    },
    actor,
  );
  if (!updated) return yield* new BudgetNotSaved({ operation: "update" });
  return budgetView(yield* loadBudget(updated));
});

const requireDefaultAccount = Effect.fn("requireDefaultAccount")(function* (accountId: string) {
  const [account] = yield* (yield* LedgerFacts).accountsByIds([accountId]);
  if (!account || account.lifecycle !== "active" || account.currency !== BUDGET_CURRENCY) {
    return yield* new BudgetDefaultAccountInvalid({ accountId });
  }
});

/**
 * Where a payday change starts, or null when `rule` is already the rule in effect.
 * It reshapes the current period only while that period, re-cut under the new
 * rule, still contains today. Otherwise today would sit in a brand-new period
 * that started in the past without this period's plan, so the change waits for
 * the next payday under the old rule.
 */
function paydayEffectiveFrom(
  paydays: readonly PaydayChange[],
  currentStart: string,
  rule: PaydayRule,
  today: string,
): string | null {
  const inEffect = ruleInEffect(paydays, currentStart);
  if (samePaydayRule(inEffect, rule)) return null;
  if (nextPeriodStart(rule, currentStart) > today) return currentStart;
  return nextPeriodStart(inEffect, currentStart);
}

function samePaydayRule(left: PaydayRule, right: PaydayRule): boolean {
  return (
    left.kind === right.kind &&
    (left.kind !== "day" || right.kind !== "day" || left.day === right.day)
  );
}
