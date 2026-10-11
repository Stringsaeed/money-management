import { addMonths, format, parseISO } from "date-fns";
import { Effect } from "effect";
import type { z } from "zod";

import { budgetView, loadBudget, requireBudget } from "./budget";
import { requireCategoriesUnmapped, resolveCategories } from "./budget-categories";
import {
  BudgetCurrencyMismatch,
  BudgetOverplanned,
  EnvelopeArchived,
  EnvelopeCategoryMissing,
  EnvelopeNotFound,
  EnvelopeNotSavingFor,
  EnvelopeSavingFieldsInvalid,
} from "./budget-errors";
import { LedgerFacts } from "./budget-ledger-facts";
import { inLedgerMutation } from "./budget-mutation";
import { BudgetLedger, budgetActor, checkVersion, requirePlanAccess } from "./budget-services";
import { BudgetStore, type EnvelopePatch, type EnvelopeRow } from "./budget-store";
import {
  transactionCreateSchema,
  type envelopeCreateSchema,
  type envelopePaySchema,
  type envelopeUpdateSchema,
  type V2EnvelopeGroup,
  type V2EnvelopeRepeat,
} from "./contracts";

/**
 * Envelope writes (#370/#371). Changing the group, name, or categories never
 * touches assignments: history stays as written and the projection recomputes.
 */

export type EnvelopeCreate = z.output<typeof envelopeCreateSchema>;
export type EnvelopeUpdate = z.output<typeof envelopeUpdateSchema>;
export type EnvelopePay = z.output<typeof envelopePaySchema>;

/**
 * Creates an envelope with one Category mapping. `plannedMinor` is written as
 * a plan assignment from Not planned yet in the current period; the guard
 * projects the would-be state in the same transaction and rolls back when Not
 * planned yet would go negative.
 */
export const createEnvelope = Effect.fn("createEnvelope")(function* (
  input: EnvelopeCreate,
  idempotencyKey: string | undefined,
) {
  yield* requirePlanAccess;
  return yield* inLedgerMutation("budget.envelope.create", idempotencyKey, writeEnvelope(input));
});

const writeEnvelope = Effect.fn("writeEnvelope")(function* (input: EnvelopeCreate) {
  const store = yield* BudgetStore;
  const { ledgerId } = yield* BudgetLedger;
  const budget = yield* requireBudget;
  const actor = yield* budgetActor;
  const periodStart = (yield* loadBudget(budget)).projection.current.period.start;

  const [categoryId] = yield* resolveCategories([input]);
  yield* requireCategoriesUnmapped(budget.id, [categoryId], undefined);

  const envelopeId = crypto.randomUUID();
  yield* store.insertEnvelope(
    {
      ledgerId,
      id: envelopeId,
      budgetId: budget.id,
      name: input.name,
      group: input.group,
      targetMinor: input.targetMinor ?? null,
      dueDate: input.dueDate ?? null,
      repeat: input.repeat ?? null,
      sortOrder: yield* store.nextSortOrder(budget.id),
      createdBy: actor,
      updatedBy: actor,
    },
    categoryId,
    input.plannedMinor > 0
      ? {
          ledgerId,
          id: crypto.randomUUID(),
          budgetId: budget.id,
          periodStart,
          fromEnvelopeId: null,
          toEnvelopeId: envelopeId,
          amountMinor: input.plannedMinor,
          reason: "plan",
          createdBy: actor,
        }
      : undefined,
  );

  const loaded = yield* loadBudget(budget);
  const unassignedMinor = loaded.projection.current.unassignedMinor;
  if (input.plannedMinor > 0 && unassignedMinor < 0) {
    return yield* new BudgetOverplanned({ change: "envelope", unassignedMinor });
  }
  return { ...budgetView(loaded), envelopeId };
});

/** Edits an envelope (If-Match on the envelope version). */
export const updateEnvelope = Effect.fn("updateEnvelope")(function* (
  envelopeId: string,
  input: EnvelopeUpdate,
  expectedVersion: number | undefined,
  idempotencyKey: string | undefined,
) {
  yield* requirePlanAccess;
  return yield* inLedgerMutation(
    "budget.envelope.update",
    idempotencyKey,
    writeEnvelopeUpdate(envelopeId, input, expectedVersion),
  );
});

const writeEnvelopeUpdate = Effect.fn("writeEnvelopeUpdate")(function* (
  envelopeId: string,
  input: EnvelopeUpdate,
  expectedVersion: number | undefined,
) {
  const store = yield* BudgetStore;
  const budget = yield* requireBudget;
  const envelope = yield* requireActiveEnvelope(budget.id, envelopeId);
  yield* checkVersion(expectedVersion, envelope.version, envelope.id);

  const savingFields = yield* savingFieldsPatch(input, envelope.group);
  if (input.categoryIds) {
    yield* resolveCategories(input.categoryIds.map((categoryId) => ({ categoryId })));
    yield* requireCategoriesUnmapped(budget.id, input.categoryIds, envelope.id);
    yield* store.replaceMappings(budget.id, envelope.id, input.categoryIds);
  }
  if (input.lifecycle === "archived") {
    // Frees the Categories for a new envelope; spending in them stops counting.
    yield* store.replaceMappings(budget.id, envelope.id, []);
  }

  yield* store.updateEnvelope(
    envelope.id,
    {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.group !== undefined && { group: input.group }),
      ...(input.startFresh !== undefined && { startFresh: input.startFresh }),
      ...(input.lifecycle !== undefined && { lifecycle: input.lifecycle }),
      ...savingFields,
    },
    yield* budgetActor,
  );
  return budgetView(yield* loadBudget(budget));
});

const REPEAT_MONTHS = {
  every_3_months: 3,
  every_6_months: 6,
  yearly: 12,
} satisfies Record<Exclude<V2EnvelopeRepeat, "once">, number>;

/**
 * Mark a big payment paid (#373 B3): one expense Transaction in the envelope's
 * first mapped Category, then the next target. A repeating envelope keeps its
 * target and moves the due date forward; a one-off clears target, due date,
 * and repeat. Any shortfall shows up as the envelope's negative Left (O1).
 */
export const payEnvelope = Effect.fn("payEnvelope")(function* (
  envelopeId: string,
  input: EnvelopePay,
  idempotencyKey: string | undefined,
) {
  return yield* inLedgerMutation(
    "budget.envelope.pay",
    idempotencyKey,
    writeEnvelopePayment(envelopeId, input),
  );
});

const writeEnvelopePayment = Effect.fn("writeEnvelopePayment")(function* (
  envelopeId: string,
  input: EnvelopePay,
) {
  const store = yield* BudgetStore;
  const budget = yield* requireBudget;
  const envelope = yield* requireActiveEnvelope(budget.id, envelopeId);
  if (envelope.group !== "saving") return yield* new EnvelopeNotSavingFor();
  const categoryId = yield* store.firstCategoryOf(envelope.id);
  if (!categoryId) return yield* new EnvelopeCategoryMissing();

  const expense = transactionCreateSchema.safeParse({
    kind: "expense",
    accountId: input.accountId,
    categoryId,
    amountMinor: input.amountMinor,
    date: input.date,
    note: envelope.name,
  });
  // The pay body is already valid, so a refusal here is a contract bug; it surfaces as before.
  if (!expense.success) return yield* Effect.die(expense.error);
  const transaction = yield* (yield* LedgerFacts).insertTransaction(expense.data);
  // Rolls the expense back: a budget pays only from accounts in its own currency.
  if (transaction.currency !== budget.currency) {
    return yield* new BudgetCurrencyMismatch({
      accountId: input.accountId,
      budgetCurrency: budget.currency,
    });
  }

  yield* store.updateEnvelope(envelope.id, nextTarget(envelope), yield* budgetActor);
  return { ...budgetView(yield* loadBudget(budget)), transactionId: transaction.id };
});

const requireActiveEnvelope = Effect.fn("requireActiveEnvelope")(function* (
  budgetId: string,
  envelopeId: string,
) {
  const envelope = yield* (yield* BudgetStore).findEnvelope(budgetId, envelopeId);
  if (!envelope) return yield* new EnvelopeNotFound({ envelopeId, source: "path" });
  if (envelope.lifecycle === "archived") return yield* new EnvelopeArchived();
  return envelope;
});

function nextTarget(envelope: EnvelopeRow): EnvelopePatch {
  const months = envelope.repeat && envelope.repeat !== "once" ? REPEAT_MONTHS[envelope.repeat] : 0;
  if (months === 0 || envelope.dueDate === null) {
    return { targetMinor: null, dueDate: null, repeat: null };
  }
  return { dueDate: format(addMonths(parseISO(envelope.dueDate), months), "yyyy-MM-dd") };
}

/**
 * Target, due date, and repeat belong to Saving-for envelopes. Leaving the
 * group clears them; setting them on any other group is refused.
 */
function savingFieldsPatch(
  input: EnvelopeUpdate,
  currentGroup: V2EnvelopeGroup,
): Effect.Effect<EnvelopePatch, EnvelopeSavingFieldsInvalid> {
  const group = input.group ?? currentGroup;
  if (group === "saving") {
    return Effect.succeed({
      ...(input.targetMinor !== undefined && { targetMinor: input.targetMinor }),
      ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
      ...(input.repeat !== undefined && { repeat: input.repeat }),
    });
  }
  if (input.targetMinor != null || input.dueDate != null || input.repeat != null) {
    return Effect.fail(new EnvelopeSavingFieldsInvalid());
  }
  return Effect.succeed({ targetMinor: null, dueDate: null, repeat: null });
}
