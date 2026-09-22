import { and, eq, inArray, sql } from "drizzle-orm";

import {
  v2Category,
  v2RecurringOccurrence,
  v2RecurringRule,
  v2Transaction,
} from "@trove/db/schema/v2-ledger";

import {
  categoryCreateSchema,
  categoryUpdateSchema,
  type V2CategoryCreateInput,
  type V2CategoryUpdateInput,
  type V2Category,
} from "./contracts";
import {
  iso,
  requireExpectedVersion,
  type V2DbExecutor,
  type V2LedgerContext,
  V2ApiError,
  withLedgerMutation,
} from "./shared";

type CategoryRow = typeof v2Category.$inferSelect;

function categoryRow(row: CategoryRow): V2Category {
  return {
    id: row.id,
    ledgerId: row.ledgerId,
    name: row.name,
    kind: row.kind,
    color: row.color,
    icon: row.icon,
    parentId: row.parentId,
    sortOrder: row.sortOrder,
    archived: row.lifecycle === "archived",
    version: row.version,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

async function findCategory(db: V2DbExecutor, ledgerId: string, id: string) {
  const rows = await db
    .select()
    .from(v2Category)
    .where(and(eq(v2Category.ledgerId, ledgerId), eq(v2Category.id, id)))
    .limit(1);
  return rows[0] ?? null;
}

export async function listCategories(
  context: V2LedgerContext,
  options: { readonly includeArchived?: boolean; readonly kind?: "income" | "expense" } = {},
): Promise<readonly V2Category[]> {
  const conditions = [eq(v2Category.ledgerId, context.ledgerId)];
  if (!options.includeArchived) conditions.push(eq(v2Category.lifecycle, "active"));
  if (options.kind) conditions.push(eq(v2Category.kind, options.kind));
  const rows = await context.db
    .select()
    .from(v2Category)
    .where(and(...conditions))
    .orderBy(v2Category.sortOrder, v2Category.name, v2Category.id);
  return rows.map(categoryRow);
}

export async function getCategory(context: V2LedgerContext, id: string): Promise<V2Category> {
  const row = await findCategory(context.db, context.ledgerId, id);
  if (!row) throw new V2ApiError(404, "category_not_found", "Category not found.");
  return categoryRow(row);
}

export async function createCategory(
  context: V2LedgerContext,
  input: V2CategoryCreateInput,
  idempotencyKey?: string,
): Promise<V2Category> {
  const parsed = categoryCreateSchema.parse(input);
  return withLedgerMutation(context, "categories.create", idempotencyKey, async (db) => {
    const id = parsed.id ?? crypto.randomUUID();
    const existing = await db
      .select({ id: v2Category.id })
      .from(v2Category)
      .where(and(eq(v2Category.ledgerId, context.ledgerId), eq(v2Category.id, id)))
      .limit(1);
    if (existing[0])
      throw new V2ApiError(409, "category_exists", "A Category with this id already exists.");

    if (parsed.parentId) {
      const parent = await findCategory(db, context.ledgerId, parsed.parentId);
      if (!parent || parent.lifecycle !== "active") {
        throw new V2ApiError(
          422,
          "invalid_parent_category",
          "Parent Category is not active in this ledger.",
        );
      }
    }
    const now = new Date();
    const inserted = await db
      .insert(v2Category)
      .values({
        ledgerId: context.ledgerId,
        id,
        name: parsed.name,
        kind: parsed.kind,
        color: parsed.color ?? "#4A8F69",
        icon: parsed.icon ?? "tag",
        parentId: parsed.parentId ?? null,
        sortOrder: parsed.sortOrder,
        createdBy: context.ownerId,
        updatedBy: context.ownerId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    const row = inserted[0];
    if (!row) throw new V2ApiError(500, "category_create_failed", "Category could not be created.");
    return categoryRow(row);
  });
}

export async function updateCategory(
  context: V2LedgerContext,
  id: string,
  input: V2CategoryUpdateInput,
  expectedVersion?: number,
  idempotencyKey?: string,
): Promise<V2Category> {
  const parsed = categoryUpdateSchema.parse(input);
  return withLedgerMutation(context, "categories.update", idempotencyKey, async (db) => {
    const current = await findCategory(db, context.ledgerId, id);
    if (!current) throw new V2ApiError(404, "category_not_found", "Category not found.");
    requireExpectedVersion(expectedVersion, current.version, id);
    await assertCategoryUpdateAllowed(db, context.ledgerId, id, current, parsed);
    return updateCategoryRecord(db, context, id, current.version, parsed);
  });
}

async function updateCategoryRecord(
  db: V2DbExecutor,
  context: V2LedgerContext,
  id: string,
  version: number,
  parsed: ReturnType<typeof categoryUpdateSchema.parse>,
): Promise<V2Category> {
  const updated = await db
    .update(v2Category)
    .set({
      ...(parsed.name !== undefined && { name: parsed.name }),
      ...(parsed.kind !== undefined && { kind: parsed.kind }),
      ...(parsed.color !== undefined && { color: parsed.color }),
      ...(parsed.icon !== undefined && { icon: parsed.icon }),
      ...(parsed.parentId !== undefined && { parentId: parsed.parentId }),
      ...(parsed.sortOrder !== undefined && { sortOrder: parsed.sortOrder }),
      ...(parsed.archived !== undefined && { lifecycle: parsed.archived ? "archived" : "active" }),
      version: version + 1,
      updatedBy: context.ownerId,
      updatedAt: new Date(),
    })
    .where(and(eq(v2Category.ledgerId, context.ledgerId), eq(v2Category.id, id)))
    .returning();
  const row = updated[0];
  if (!row) throw new V2ApiError(500, "category_update_failed", "Category could not be updated.");
  return categoryRow(row);
}

async function assertCategoryUpdateAllowed(
  db: V2DbExecutor,
  ledgerId: string,
  categoryId: string,
  current: CategoryRow,
  changes: ReturnType<typeof categoryUpdateSchema.parse>,
): Promise<void> {
  if (current.lifecycle === "archived" && changes.archived !== false) {
    throw new V2ApiError(409, "category_archived", "Restore the Category before editing it.");
  }
  await validateParentCategory(db, ledgerId, categoryId, changes.parentId);
  if (changes.kind === undefined || changes.kind === current.kind) return;
  const used = await db
    .select({ id: v2Transaction.id })
    .from(v2Transaction)
    .where(and(eq(v2Transaction.ledgerId, ledgerId), eq(v2Transaction.categoryId, categoryId)))
    .limit(1);
  if (used[0])
    throw new V2ApiError(
      409,
      "category_kind_locked",
      "A Category with history cannot change kind.",
    );
}

async function validateParentCategory(
  db: V2DbExecutor,
  ledgerId: string,
  categoryId: string,
  parentId: string | null | undefined,
): Promise<void> {
  if (!parentId) return;
  const parent = await findCategory(db, ledgerId, parentId);
  if (!parent || parent.lifecycle !== "active" || parent.id === categoryId) {
    throw new V2ApiError(
      422,
      "invalid_parent_category",
      "Parent Category is not valid in this ledger.",
    );
  }
}

export async function deleteCategory(
  context: V2LedgerContext,
  id: string,
  expectedVersion?: number,
  idempotencyKey?: string,
): Promise<{ readonly id: string; readonly archived: boolean; readonly deleted: boolean }> {
  return withLedgerMutation(context, "categories.delete", idempotencyKey, async (db) => {
    const current = await findCategory(db, context.ledgerId, id);
    if (!current) throw new V2ApiError(404, "category_not_found", "Category not found.");
    requireExpectedVersion(expectedVersion, current.version, id);
    // Delete the dependent facts in this ledger before removing the Category.
    // `withLedgerMutation` keeps the complete cascade atomic and scoped to the
    // authenticated ledger, including recurring rules that could otherwise
    // recreate transactions with an invalid Category.
    const linkedTransactionIds = db
      .select({ id: v2Transaction.id })
      .from(v2Transaction)
      .where(and(eq(v2Transaction.ledgerId, context.ledgerId), eq(v2Transaction.categoryId, id)));
    await db
      .update(v2RecurringOccurrence)
      .set({ transactionId: null })
      .where(
        and(
          eq(v2RecurringOccurrence.ledgerId, context.ledgerId),
          inArray(v2RecurringOccurrence.transactionId, linkedTransactionIds),
        ),
      );
    await db
      .delete(v2Transaction)
      .where(and(eq(v2Transaction.ledgerId, context.ledgerId), eq(v2Transaction.categoryId, id)));
    await db
      .delete(v2RecurringRule)
      .where(
        and(eq(v2RecurringRule.ledgerId, context.ledgerId), eq(v2RecurringRule.categoryId, id)),
      );
    await db
      .update(v2Category)
      .set({
        parentId: null,
        version: sql`${v2Category.version} + 1`,
        updatedBy: context.ownerId,
        updatedAt: new Date(),
      })
      .where(and(eq(v2Category.ledgerId, context.ledgerId), eq(v2Category.parentId, id)));
    await db
      .delete(v2Category)
      .where(and(eq(v2Category.ledgerId, context.ledgerId), eq(v2Category.id, id)));
    return { id, archived: false, deleted: true };
  });
}
