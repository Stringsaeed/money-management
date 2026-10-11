import { addMonths, format, parseISO } from "date-fns";
import { and, asc, eq, inArray, sql } from "drizzle-orm";

import { v2Assignment, v2Envelope, v2EnvelopeCategory } from "@trove/db/schema/v2-budget";

import { budgetActor, resolveCategories } from "./budget-activate";
import { budgetView, findBudget, loadBudget } from "./budget";
import {
  BUDGET_CURRENCY,
  envelopeCreateSchema,
  envelopePaySchema,
  envelopeUpdateSchema,
  transactionCreateSchema,
  type V2BudgetView,
  type V2EnvelopePaid,
  type V2EnvelopePayInput,
  type V2EnvelopeRepeat,
  type V2EnvelopeCreateInput,
  type V2EnvelopeCreated,
  type V2EnvelopeGroup,
  type V2EnvelopeUpdateInput,
} from "./contracts";
import { insertTransaction } from "./transactions";
import {
  requireBudgetPlanAccess,
  requireExpectedVersion,
  V2ApiError,
  withLedgerMutation,
  type V2DbExecutor,
  type V2LedgerContext,
} from "./shared";

/**
 * Envelope writes (#370/#371). Changing the group, name, or categories never
 * touches assignments: history stays as written and the projection recomputes.
 */

/**
 * Creates an envelope with one Category mapping. `plannedMinor` is written as
 * a plan assignment from Not planned yet in the current period; the guard
 * projects the would-be state in the same transaction and rolls back when Not
 * planned yet would go negative.
 */
export async function createEnvelope(
  context: V2LedgerContext,
  input: V2EnvelopeCreateInput,
  today: string,
  idempotencyKey?: string,
): Promise<V2EnvelopeCreated> {
  const parsed = envelopeCreateSchema.parse(input);
  requireBudgetPlanAccess(context);
  return withLedgerMutation(context, "budget.envelope.create", idempotencyKey, async (db) => {
    const budget = await requireBudget(db, context);
    const actor = budgetActor(context);
    const periodStart = (await loadBudget(db, budget, today)).projection.current.period.start;

    const [categoryId] = await resolveCategories(db, context, [parsed]);
    if (!categoryId) throw new V2ApiError(500, "envelope_create_failed", "No Category resolved.");
    await assertCategoriesUnmapped(db, context.ledgerId, [categoryId]);

    const existing = await db
      .select({ sortOrder: sql<number>`coalesce(max(${v2Envelope.sortOrder}), -1)` })
      .from(v2Envelope)
      .where(eq(v2Envelope.budgetId, budget.id));
    const envelopeId = crypto.randomUUID();
    await db.insert(v2Envelope).values({
      ledgerId: context.ledgerId,
      id: envelopeId,
      budgetId: budget.id,
      name: parsed.name,
      group: parsed.group,
      targetMinor: parsed.targetMinor ?? null,
      dueDate: parsed.dueDate ?? null,
      repeat: parsed.repeat ?? null,
      sortOrder: (existing[0]?.sortOrder ?? -1) + 1,
      createdBy: actor,
      updatedBy: actor,
    });
    await db
      .insert(v2EnvelopeCategory)
      .values({ ledgerId: context.ledgerId, envelopeId, categoryId });
    if (parsed.plannedMinor > 0) {
      await db.insert(v2Assignment).values({
        ledgerId: context.ledgerId,
        id: crypto.randomUUID(),
        budgetId: budget.id,
        periodStart,
        fromEnvelopeId: null,
        toEnvelopeId: envelopeId,
        amountMinor: parsed.plannedMinor,
        reason: "plan",
        createdBy: actor,
      });
    }

    const loaded = await loadBudget(db, budget, today);
    const unassignedMinor = loaded.projection.current.unassignedMinor;
    if (parsed.plannedMinor > 0 && unassignedMinor < 0) {
      throw new V2ApiError(
        409,
        "budget_overplanned",
        "That plan uses more money than is not planned yet. Lower the amount and try again.",
        { unassignedMinor },
      );
    }
    return { ...activeView(budgetView(loaded)), envelopeId };
  });
}

/** Edits an envelope (If-Match on the envelope version). */
export async function updateEnvelope(
  context: V2LedgerContext,
  envelopeId: string,
  input: V2EnvelopeUpdateInput,
  today: string,
  expectedVersion?: number,
  idempotencyKey?: string,
): Promise<V2BudgetView> {
  const parsed = envelopeUpdateSchema.parse(input);
  requireBudgetPlanAccess(context);
  return withLedgerMutation(context, "budget.envelope.update", idempotencyKey, async (db) => {
    const budget = await requireBudget(db, context);
    const rows = await db
      .select()
      .from(v2Envelope)
      .where(and(eq(v2Envelope.budgetId, budget.id), eq(v2Envelope.id, envelopeId)))
      .limit(1);
    const envelope = rows[0];
    if (!envelope) throw new V2ApiError(404, "envelope_not_found", "This envelope was not found.");
    if (envelope.lifecycle === "archived") {
      throw new V2ApiError(409, "envelope_archived", "This envelope is archived.");
    }
    requireExpectedVersion(expectedVersion, envelope.version, envelope.id);

    const savingFields = savingFieldsPatch(parsed, envelope.group);
    if (parsed.categoryIds) {
      await resolveCategories(
        db,
        context,
        parsed.categoryIds.map((categoryId) => ({ categoryId })),
      );
      await assertCategoriesUnmapped(db, context.ledgerId, parsed.categoryIds, envelope.id);
      await replaceCategories(db, context.ledgerId, envelope.id, parsed.categoryIds);
    }
    if (parsed.lifecycle === "archived") {
      // Frees the Categories for a new envelope; spending in them stops counting.
      await replaceCategories(db, context.ledgerId, envelope.id, []);
    }

    await db
      .update(v2Envelope)
      .set({
        ...(parsed.name !== undefined && { name: parsed.name }),
        ...(parsed.group !== undefined && { group: parsed.group }),
        ...(parsed.startFresh !== undefined && { startFresh: parsed.startFresh }),
        ...(parsed.lifecycle !== undefined && { lifecycle: parsed.lifecycle }),
        ...savingFields,
        version: sql`${v2Envelope.version} + 1`,
        updatedBy: budgetActor(context),
        updatedAt: new Date(),
      })
      .where(eq(v2Envelope.id, envelope.id));

    return budgetView(await loadBudget(db, budget, today));
  });
}

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
export async function payEnvelope(
  context: V2LedgerContext,
  envelopeId: string,
  input: V2EnvelopePayInput,
  today: string,
  idempotencyKey?: string,
): Promise<V2EnvelopePaid> {
  const parsed = envelopePaySchema.parse(input);
  return withLedgerMutation(context, "budget.envelope.pay", idempotencyKey, async (db) => {
    const budget = await requireBudget(db, context);
    const rows = await db
      .select()
      .from(v2Envelope)
      .where(and(eq(v2Envelope.budgetId, budget.id), eq(v2Envelope.id, envelopeId)))
      .limit(1);
    const envelope = rows[0];
    if (!envelope) throw new V2ApiError(404, "envelope_not_found", "This envelope was not found.");
    if (envelope.lifecycle === "archived") {
      throw new V2ApiError(409, "envelope_archived", "This envelope is archived.");
    }
    if (envelope.group !== "saving") {
      throw new V2ApiError(
        422,
        "envelope_not_saving_for",
        "Only Saving-for envelopes can be marked paid.",
      );
    }
    const mappings = await db
      .select({ categoryId: v2EnvelopeCategory.categoryId })
      .from(v2EnvelopeCategory)
      .where(eq(v2EnvelopeCategory.envelopeId, envelope.id))
      .orderBy(asc(v2EnvelopeCategory.categoryId))
      .limit(1);
    const categoryId = mappings[0]?.categoryId;
    if (!categoryId) {
      throw new V2ApiError(
        422,
        "envelope_category_missing",
        "This envelope has no Category to record the payment in. Pick one first.",
      );
    }

    const transaction = await insertTransaction(
      db,
      context,
      transactionCreateSchema.parse({
        kind: "expense",
        accountId: parsed.accountId,
        categoryId,
        amountMinor: parsed.amountMinor,
        date: parsed.date,
        note: envelope.name,
      }),
    );
    if (transaction.currency !== BUDGET_CURRENCY) {
      throw new V2ApiError(
        422,
        "budget_account_invalid",
        "Budgets are in AED. Pay from an AED account.",
      );
    }

    await db
      .update(v2Envelope)
      .set({
        ...nextTarget(envelope),
        version: sql`${v2Envelope.version} + 1`,
        updatedBy: budgetActor(context),
        updatedAt: new Date(),
      })
      .where(eq(v2Envelope.id, envelope.id));

    const view = activeView(budgetView(await loadBudget(db, budget, today)));
    return { ...view, transactionId: transaction.id };
  });
}

function nextTarget(envelope: typeof v2Envelope.$inferSelect) {
  const months = envelope.repeat && envelope.repeat !== "once" ? REPEAT_MONTHS[envelope.repeat] : 0;
  if (months === 0 || envelope.dueDate === null) {
    return { targetMinor: null, dueDate: null, repeat: null };
  }
  return { dueDate: format(addMonths(parseISO(envelope.dueDate), months), "yyyy-MM-dd") };
}

type EnvelopeUpdate = ReturnType<typeof envelopeUpdateSchema.parse>;

/**
 * Target, due date, and repeat belong to Saving-for envelopes. Leaving the
 * group clears them; setting them on any other group is refused.
 */
function savingFieldsPatch(parsed: EnvelopeUpdate, currentGroup: V2EnvelopeGroup) {
  const group = parsed.group ?? currentGroup;
  if (group === "saving") {
    return {
      ...(parsed.targetMinor !== undefined && { targetMinor: parsed.targetMinor }),
      ...(parsed.dueDate !== undefined && { dueDate: parsed.dueDate }),
      ...(parsed.repeat !== undefined && { repeat: parsed.repeat }),
    };
  }
  if (parsed.targetMinor != null || parsed.dueDate != null || parsed.repeat != null) {
    throw new V2ApiError(
      422,
      "envelope_saving_fields_invalid",
      "Only Saving-for envelopes have a target, due date, or repeat.",
    );
  }
  return { targetMinor: null, dueDate: null, repeat: null };
}

async function replaceCategories(
  db: V2DbExecutor,
  ledgerId: string,
  envelopeId: string,
  categoryIds: readonly string[],
): Promise<void> {
  await db.delete(v2EnvelopeCategory).where(eq(v2EnvelopeCategory.envelopeId, envelopeId));
  if (categoryIds.length === 0) return;
  await db
    .insert(v2EnvelopeCategory)
    .values(categoryIds.map((categoryId) => ({ ledgerId, envelopeId, categoryId })));
}

async function requireBudget(db: V2DbExecutor, context: V2LedgerContext) {
  const budget = await findBudget(db, context.ledgerId);
  if (!budget) throw new V2ApiError(404, "budget_not_found", "This ledger has no budget.");
  return budget;
}

/** A Category maps to at most one envelope; `ownEnvelopeId`'s own mappings are about to be replaced. */
async function assertCategoriesUnmapped(
  db: V2DbExecutor,
  ledgerId: string,
  categoryIds: readonly string[],
  ownEnvelopeId?: string,
): Promise<void> {
  const rows = await db
    .select({
      envelopeId: v2EnvelopeCategory.envelopeId,
      categoryId: v2EnvelopeCategory.categoryId,
    })
    .from(v2EnvelopeCategory)
    .where(
      and(
        eq(v2EnvelopeCategory.ledgerId, ledgerId),
        inArray(v2EnvelopeCategory.categoryId, [...categoryIds]),
      ),
    );
  const conflict = rows.find((row) => row.envelopeId !== ownEnvelopeId);
  if (conflict) {
    throw new V2ApiError(
      409,
      "category_already_mapped",
      "That Category already belongs to another envelope. Move it there or pick a different one.",
      { categoryId: conflict.categoryId, envelopeId: conflict.envelopeId },
    );
  }
}

function activeView(view: V2BudgetView): Extract<V2BudgetView, { readonly budget: object }> {
  if (view.budget === null) {
    throw new V2ApiError(500, "budget_not_found", "This ledger has no budget.");
  }
  return view;
}
