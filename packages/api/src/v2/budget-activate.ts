import { and, eq, inArray, sql } from "drizzle-orm";

import { periodContaining, ruleInEffect, type PaydayRule } from "@trove/domain/budget";
import {
  v2Assignment,
  v2Budget,
  v2BudgetFundingAccount,
  v2BudgetPayday,
  v2Envelope,
  v2EnvelopeCategory,
} from "@trove/db/schema/v2-budget";
import { v2Account, v2Category } from "@trove/db/schema/v2-ledger";

import { budgetView, findBudget, loadBudget } from "./budget";
import {
  BUDGET_CURRENCY,
  budgetActivateSchema,
  budgetUpdateSchema,
  type V2BudgetActivateInput,
  type V2BudgetUpdateInput,
  type V2BudgetView,
} from "./contracts";
import {
  requireExpectedVersion,
  V2ApiError,
  withLedgerMutation,
  type V2LedgerContext,
  type V2TransactionDatabase,
} from "./shared";

const MY_MONEY_ACCOUNT_NAME = "My money";

/**
 * Activates the ledger's budget in one transaction (#367 S5): funding,
 * categories, envelopes, 1:1 mappings, payday history, and plan assignments.
 * The overplan guard projects the would-be state inside the same transaction
 * and throws (rolling everything back) when Not planned yet would go negative.
 */
export async function activateBudget(
  context: V2LedgerContext,
  input: V2BudgetActivateInput,
  today: string,
  idempotencyKey?: string,
): Promise<V2BudgetView> {
  const parsed = budgetActivateSchema.parse(input);
  return withLedgerMutation(context, "budget.activate", idempotencyKey, async (db) => {
    if (await findBudget(db, context.ledgerId)) {
      throw new V2ApiError(409, "budget_already_active", "This ledger already has a budget.");
    }
    const actor = budgetActor(context);
    const period = periodContaining(parsed.paydayRule, today);

    const fundingAccountIds = parsed.fundingAccountIds ?? [
      await createMyMoneyAccount(db, context, parsed.openingCashMinor),
    ];
    if (parsed.fundingAccountIds)
      await assertFundingAccounts(db, context.ledgerId, fundingAccountIds);

    const categoryIds = await resolveCategories(db, context, parsed.envelopes);

    const budgetId = crypto.randomUUID();
    await db.insert(v2Budget).values({
      ledgerId: context.ledgerId,
      id: budgetId,
      currency: BUDGET_CURRENCY,
      activationPeriodStart: period.start,
      usualSalaryMinor: parsed.usualSalaryMinor ?? null,
      paydayReminder: parsed.paydayReminder,
      defaultAccountId: parsed.defaultAccountId ?? fundingAccountIds[0],
      createdBy: actor,
      updatedBy: actor,
    });
    await db.insert(v2BudgetPayday).values({
      ledgerId: context.ledgerId,
      budgetId,
      effectiveFrom: period.start,
      ...paydayColumns(parsed.paydayRule),
      createdBy: actor,
    });
    await db
      .insert(v2BudgetFundingAccount)
      .values(
        fundingAccountIds.map((accountId) => ({ ledgerId: context.ledgerId, budgetId, accountId })),
      );

    const envelopes = parsed.envelopes.map((envelope, index) => ({
      input: envelope,
      id: crypto.randomUUID(),
      categoryId: categoryIds[index],
      sortOrder: index,
    }));
    await db.insert(v2Envelope).values(
      envelopes.map(({ input: envelope, id, sortOrder }) => ({
        ledgerId: context.ledgerId,
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
    );
    await db
      .insert(v2EnvelopeCategory)
      .values(
        envelopes.flatMap(({ id, categoryId }) =>
          categoryId ? [{ ledgerId: context.ledgerId, envelopeId: id, categoryId }] : [],
        ),
      );
    const assignments = envelopes.flatMap(({ input: envelope, id }) =>
      [envelope.plannedMinor, envelope.setAsideMinor]
        .filter((amountMinor) => amountMinor > 0)
        .map((amountMinor) => ({
          ledgerId: context.ledgerId,
          id: crypto.randomUUID(),
          budgetId,
          periodStart: period.start,
          fromEnvelopeId: null,
          toEnvelopeId: id,
          amountMinor,
          reason: "plan" as const,
          createdBy: actor,
        })),
    );
    if (assignments.length > 0) await db.insert(v2Assignment).values(assignments);

    const budget = await findBudget(db, context.ledgerId);
    if (!budget) throw new V2ApiError(500, "budget_activation_failed", "The budget was not saved.");
    const loaded = await loadBudget(db, budget, today);
    const unassignedMinor = loaded.projection.current.unassignedMinor;
    if (unassignedMinor < 0) {
      throw new V2ApiError(
        409,
        "budget_overplanned",
        "The plan uses more money than you have. Lower some amounts and try again.",
        { unassignedMinor },
      );
    }
    return budgetView(loaded);
  });
}

/**
 * Changes budget settings (If-Match). A payday change is recorded from the
 * current period start, so earlier periods never move.
 */
export async function updateBudget(
  context: V2LedgerContext,
  input: V2BudgetUpdateInput,
  today: string,
  expectedVersion?: number,
  idempotencyKey?: string,
): Promise<V2BudgetView> {
  const parsed = budgetUpdateSchema.parse(input);
  return withLedgerMutation(context, "budget.update", idempotencyKey, async (db) => {
    const budget = await findBudget(db, context.ledgerId);
    if (!budget) throw new V2ApiError(404, "budget_not_found", "This ledger has no budget.");
    requireExpectedVersion(expectedVersion, budget.version, budget.id);
    const actor = budgetActor(context);

    if (parsed.paydayRule) {
      const loaded = await loadBudget(db, budget, today);
      const currentStart = loaded.projection.current.period.start;
      const inEffect = ruleInEffect(loaded.paydays, currentStart);
      if (!samePaydayRule(inEffect, parsed.paydayRule)) {
        // History is insert-only per period start; a second change within the
        // same period replaces only that period's row.
        await db
          .insert(v2BudgetPayday)
          .values({
            ledgerId: context.ledgerId,
            budgetId: budget.id,
            effectiveFrom: currentStart,
            ...paydayColumns(parsed.paydayRule),
            createdBy: actor,
          })
          .onConflictDoUpdate({
            target: [v2BudgetPayday.budgetId, v2BudgetPayday.effectiveFrom],
            set: { ...paydayColumns(parsed.paydayRule), createdBy: actor, createdAt: new Date() },
          });
      }
    }
    if (parsed.defaultAccountId) {
      await assertActiveAedAccount(db, context.ledgerId, parsed.defaultAccountId);
    }

    await db
      .update(v2Budget)
      .set({
        ...(parsed.usualSalaryMinor !== undefined && { usualSalaryMinor: parsed.usualSalaryMinor }),
        ...(parsed.paydayReminder !== undefined && { paydayReminder: parsed.paydayReminder }),
        ...(parsed.defaultAccountId !== undefined && { defaultAccountId: parsed.defaultAccountId }),
        version: sql`${v2Budget.version} + 1`,
        updatedBy: actor,
        updatedAt: new Date(),
      })
      .where(eq(v2Budget.id, budget.id));

    const updated = await findBudget(db, context.ledgerId);
    if (!updated) throw new V2ApiError(500, "budget_update_failed", "The budget was not saved.");
    return budgetView(await loadBudget(db, updated, today));
  });
}

/** The person acting, for "who" lines; a household ledger's owner id would not say who. */
export function budgetActor(context: V2LedgerContext): string {
  return context.principal.kind === "user"
    ? context.principal.userId
    : context.principal.guestSessionId;
}

function paydayColumns(rule: PaydayRule) {
  return rule.kind === "day"
    ? { kind: "day" as const, day: rule.day }
    : { kind: "last_workday" as const, day: null };
}

function samePaydayRule(left: PaydayRule, right: PaydayRule): boolean {
  return (
    left.kind === right.kind &&
    (left.kind !== "day" || right.kind !== "day" || left.day === right.day)
  );
}

async function createMyMoneyAccount(
  db: V2TransactionDatabase,
  context: V2LedgerContext,
  openingBalanceMinor = 0,
): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(v2Account).values({
    ledgerId: context.ledgerId,
    id,
    name: MY_MONEY_ACCOUNT_NAME,
    type: "cash",
    currency: BUDGET_CURRENCY,
    openingBalanceMinor,
    createdBy: context.ownerId,
    updatedBy: context.ownerId,
  });
  return id;
}

/** Funding accounts hold spendable AED: active, AED, and not a credit card. */
async function assertFundingAccounts(
  db: V2TransactionDatabase,
  ledgerId: string,
  accountIds: readonly string[],
): Promise<void> {
  const rows = await db
    .select()
    .from(v2Account)
    .where(and(eq(v2Account.ledgerId, ledgerId), inArray(v2Account.id, [...accountIds])));
  for (const accountId of accountIds) {
    const account = rows.find((row) => row.id === accountId);
    if (!account || account.lifecycle !== "active") {
      throw new V2ApiError(422, "budget_funding_invalid", "A funding account was not found.", {
        accountId,
      });
    }
    if (account.currency !== BUDGET_CURRENCY) {
      throw new V2ApiError(422, "budget_funding_invalid", "AED budgets only for now.", {
        accountId,
      });
    }
    if (account.type === "credit_card") {
      throw new V2ApiError(
        422,
        "budget_funding_invalid",
        "A credit card can't fund a budget. Pick the accounts that hold your money.",
        { accountId },
      );
    }
  }
}

async function assertActiveAedAccount(
  db: V2TransactionDatabase,
  ledgerId: string,
  accountId: string,
): Promise<void> {
  const rows = await db
    .select()
    .from(v2Account)
    .where(and(eq(v2Account.ledgerId, ledgerId), eq(v2Account.id, accountId)))
    .limit(1);
  const account = rows[0];
  if (!account || account.lifecycle !== "active" || account.currency !== BUDGET_CURRENCY) {
    throw new V2ApiError(
      422,
      "budget_default_account_invalid",
      "Pick an active AED account as the default.",
      { accountId },
    );
  }
}

/**
 * One Category per envelope, in input order. A new Category name reuses a
 * non-archived expense Category with the same name (case-insensitive).
 */
export async function resolveCategories(
  db: V2TransactionDatabase,
  context: V2LedgerContext,
  envelopes: readonly {
    readonly categoryId?: string;
    readonly newCategory?: { readonly name: string };
  }[],
): Promise<string[]> {
  const expense = await db
    .select({ id: v2Category.id, name: v2Category.name })
    .from(v2Category)
    .where(
      and(
        eq(v2Category.ledgerId, context.ledgerId),
        eq(v2Category.kind, "expense"),
        eq(v2Category.lifecycle, "active"),
      ),
    );
  const knownIds = new Set(expense.map((row) => row.id));
  const byName = new Map(expense.map((row) => [row.name.toLowerCase(), row.id]));

  const resolved: string[] = [];
  for (const envelope of envelopes) {
    if (envelope.categoryId !== undefined) {
      if (!knownIds.has(envelope.categoryId)) {
        throw new V2ApiError(
          422,
          "budget_category_invalid",
          "An envelope's Category was not found or is not an active expense Category.",
          { categoryId: envelope.categoryId },
        );
      }
      resolved.push(envelope.categoryId);
      continue;
    }
    const name = envelope.newCategory?.name ?? "";
    let id = byName.get(name.toLowerCase());
    if (!id) {
      id = crypto.randomUUID();
      await db.insert(v2Category).values({
        ledgerId: context.ledgerId,
        id,
        name,
        kind: "expense",
        createdBy: context.ownerId,
        updatedBy: context.ownerId,
      });
      byName.set(name.toLowerCase(), id);
    }
    resolved.push(id);
  }
  const duplicate = resolved.find((id, index) => resolved.indexOf(id) !== index);
  if (duplicate) {
    throw new V2ApiError(
      422,
      "budget_category_duplicate",
      "Two envelopes use the same Category. Merge them into one envelope.",
      { categoryId: duplicate },
    );
  }
  return resolved;
}
