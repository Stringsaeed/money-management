import { and, desc, eq, gte, lt, lte, or } from "drizzle-orm";

import { v2Account, v2Category, v2Transaction } from "@trove/db/schema/v2-ledger";

import {
  transactionCreateSchema,
  transactionUpdateSchema,
  type V2TransactionCreateInput,
  type V2TransactionUpdateInput,
  type V2Page,
  type V2Transaction,
  type V2TransactionKind,
} from "./contracts";
import {
  iso,
  requireExpectedVersion,
  safeMinor,
  type V2DbExecutor,
  type V2LedgerContext,
  V2ApiError,
  withLedgerMutation,
} from "./shared";

type TransactionRow = typeof v2Transaction.$inferSelect;
type AccountRow = NonNullable<Awaited<ReturnType<typeof loadAccount>>>;

function transactionRow(row: TransactionRow): V2Transaction {
  return {
    id: row.id,
    ledgerId: row.ledgerId,
    accountId: row.accountId,
    categoryId: row.categoryId,
    toAccountId: row.toAccountId,
    kind: row.kind,
    amountMinor: safeMinor(row.amountMinor, "Transaction amount"),
    currency: row.currency,
    date: row.date,
    note: row.note,
    recurringRuleId: row.recurringRuleId,
    version: row.version,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

async function findTransaction(db: V2DbExecutor, ledgerId: string, id: string) {
  const rows = await db
    .select()
    .from(v2Transaction)
    .where(and(eq(v2Transaction.ledgerId, ledgerId), eq(v2Transaction.id, id)))
    .limit(1);
  return rows[0] ?? null;
}

interface TransactionReferences {
  readonly kind: V2TransactionKind;
  readonly accountId: string;
  readonly toAccountId: string | null;
  readonly categoryId: string | null;
}

async function loadAccount(db: V2DbExecutor, ledgerId: string, id: string) {
  const rows = await db
    .select()
    .from(v2Account)
    .where(and(eq(v2Account.ledgerId, ledgerId), eq(v2Account.id, id)))
    .limit(1);
  return rows[0] ?? null;
}

async function validateTransactionOwnership(
  db: V2DbExecutor,
  ledgerId: string,
  transaction: TransactionReferences,
) {
  const source = await loadAccount(db, ledgerId, transaction.accountId);
  if (!source)
    throw new V2ApiError(422, "account_not_found", "Source Account is not in this ledger.");
  if (source.lifecycle !== "active")
    throw new V2ApiError(422, "account_archived", "Source Account is archived.");

  const destination = transaction.toAccountId
    ? await loadAccount(db, ledgerId, transaction.toAccountId)
    : null;
  validateTransferOwnership(source, destination, transaction);
  await validateCategoryOwnership(db, ledgerId, transaction);
  return { currency: source.currency };
}

function validateTransferOwnership(
  source: AccountRow,
  destination: AccountRow | null,
  transaction: TransactionReferences,
): void {
  if (!destination) {
    if (transaction.kind === "transfer") {
      throw new V2ApiError(
        422,
        "transfer_destination_required",
        "Transfer needs a destination Account.",
      );
    }
    return;
  }
  if (destination.lifecycle !== "active")
    throw new V2ApiError(422, "account_archived", "Destination Account is archived.");
  if (destination.currency !== source.currency) {
    throw new V2ApiError(
      422,
      "currency_mismatch",
      "Transfers must use Accounts with the same currency.",
    );
  }
  if (transaction.kind !== "transfer") {
    throw new V2ApiError(
      422,
      "non_transfer_destination_forbidden",
      "Only transfers have a destination Account.",
    );
  }
  if (transaction.categoryId) {
    throw new V2ApiError(422, "transfer_category_forbidden", "Transfers cannot have a Category.");
  }
}

async function validateCategoryOwnership(
  db: V2DbExecutor,
  ledgerId: string,
  transaction: TransactionReferences,
): Promise<void> {
  if (!transaction.categoryId) return;
  const categoryRows = await db
    .select()
    .from(v2Category)
    .where(and(eq(v2Category.ledgerId, ledgerId), eq(v2Category.id, transaction.categoryId)))
    .limit(1);
  const category = categoryRows[0];
  if (!category) throw new V2ApiError(422, "category_not_found", "Category is not in this ledger.");
  if (category.lifecycle !== "active")
    throw new V2ApiError(422, "category_archived", "Category is archived.");
  const expectedKind = transaction.kind === "income" ? "income" : "expense";
  if (category.kind !== expectedKind) {
    throw new V2ApiError(
      422,
      "category_kind_mismatch",
      "Category kind does not match the Transaction.",
    );
  }
}

export interface TransactionListOptions {
  readonly limit?: number;
  readonly beforeDate?: string;
  readonly beforeId?: string;
  readonly accountId?: string;
  readonly categoryId?: string;
  readonly kind?: V2TransactionKind;
  readonly from?: string;
  readonly to?: string;
}

export async function listTransactions(
  context: V2LedgerContext,
  options: TransactionListOptions = {},
): Promise<V2Page<V2Transaction>> {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const conditions = transactionFilters(context.ledgerId, options);
  const rows = await context.db
    .select()
    .from(v2Transaction)
    .where(conditions)
    .orderBy(desc(v2Transaction.date), desc(v2Transaction.id))
    .limit(limit + 1);
  const pageRows = rows.slice(0, limit);
  const last = pageRows.at(-1);
  return {
    items: pageRows.map(transactionRow),
    nextCursor: rows.length > limit && last ? `${last.date}:${last.id}` : null,
  };
}

function transactionFilters(ledgerId: string, options: TransactionListOptions) {
  const conditions = [eq(v2Transaction.ledgerId, ledgerId)];
  if (options.accountId)
    conditions.push(
      or(
        eq(v2Transaction.accountId, options.accountId),
        eq(v2Transaction.toAccountId, options.accountId),
      )!,
    );
  if (options.categoryId) conditions.push(eq(v2Transaction.categoryId, options.categoryId));
  if (options.kind) conditions.push(eq(v2Transaction.kind, options.kind));
  if (options.from) conditions.push(gte(v2Transaction.date, options.from));
  if (options.to) conditions.push(lte(v2Transaction.date, options.to));
  if (options.beforeDate) {
    conditions.push(
      or(
        lt(v2Transaction.date, options.beforeDate),
        options.beforeId
          ? and(eq(v2Transaction.date, options.beforeDate), lt(v2Transaction.id, options.beforeId))
          : undefined,
      )!,
    );
  }
  return and(...conditions);
}

export async function getTransaction(context: V2LedgerContext, id: string): Promise<V2Transaction> {
  const row = await findTransaction(context.db, context.ledgerId, id);
  if (!row) throw new V2ApiError(404, "transaction_not_found", "Transaction not found.");
  return transactionRow(row);
}

export async function createTransaction(
  context: V2LedgerContext,
  input: V2TransactionCreateInput,
  idempotencyKey?: string,
): Promise<V2Transaction> {
  const parsed = transactionCreateSchema.parse(input);
  return withLedgerMutation(context, "transactions.create", idempotencyKey, async (db) => {
    const id = parsed.id ?? crypto.randomUUID();
    const existing = await db
      .select({ id: v2Transaction.id })
      .from(v2Transaction)
      .where(and(eq(v2Transaction.ledgerId, context.ledgerId), eq(v2Transaction.id, id)))
      .limit(1);
    if (existing[0])
      throw new V2ApiError(409, "transaction_exists", "A Transaction with this id already exists.");
    const ownership = await validateTransactionOwnership(db, context.ledgerId, {
      kind: parsed.kind,
      accountId: parsed.accountId,
      toAccountId: parsed.toAccountId ?? null,
      categoryId: parsed.categoryId ?? null,
    });
    const now = new Date();
    const inserted = await db
      .insert(v2Transaction)
      .values({
        ledgerId: context.ledgerId,
        id,
        kind: parsed.kind,
        amountMinor: parsed.amountMinor,
        currency: ownership.currency,
        date: parsed.date,
        accountId: parsed.accountId,
        toAccountId: parsed.toAccountId ?? null,
        categoryId: parsed.categoryId ?? null,
        note: parsed.note,
        createdBy: context.ownerId,
        updatedBy: context.ownerId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    const row = inserted[0];
    if (!row)
      throw new V2ApiError(500, "transaction_create_failed", "Transaction could not be created.");
    return transactionRow(row);
  });
}

export async function updateTransaction(
  context: V2LedgerContext,
  id: string,
  input: V2TransactionUpdateInput,
  expectedVersion?: number,
  idempotencyKey?: string,
): Promise<V2Transaction> {
  const parsed = transactionUpdateSchema.parse(input);
  return withLedgerMutation(context, "transactions.update", idempotencyKey, async (db) => {
    const current = await findTransaction(db, context.ledgerId, id);
    if (!current) throw new V2ApiError(404, "transaction_not_found", "Transaction not found.");
    requireExpectedVersion(expectedVersion, current.version, id);
    const merged = {
      kind: parsed.kind ?? current.kind,
      accountId: parsed.accountId ?? current.accountId,
      toAccountId: parsed.toAccountId !== undefined ? parsed.toAccountId : current.toAccountId,
      categoryId: parsed.categoryId !== undefined ? parsed.categoryId : current.categoryId,
      amountMinor: parsed.amountMinor ?? safeMinor(current.amountMinor, "Transaction amount"),
      date: parsed.date ?? current.date,
      note: parsed.note ?? current.note,
    };
    const ownership = await validateTransactionOwnership(db, context.ledgerId, merged);
    const updated = await db
      .update(v2Transaction)
      .set({
        kind: merged.kind,
        accountId: merged.accountId,
        toAccountId: merged.toAccountId,
        categoryId: merged.categoryId,
        amountMinor: merged.amountMinor,
        currency: ownership.currency,
        date: merged.date,
        note: merged.note,
        version: current.version + 1,
        updatedBy: context.ownerId,
        updatedAt: new Date(),
      })
      .where(and(eq(v2Transaction.ledgerId, context.ledgerId), eq(v2Transaction.id, id)))
      .returning();
    const row = updated[0];
    if (!row)
      throw new V2ApiError(500, "transaction_update_failed", "Transaction could not be updated.");
    return transactionRow(row);
  });
}

export async function deleteTransaction(
  context: V2LedgerContext,
  id: string,
  expectedVersion?: number,
  idempotencyKey?: string,
): Promise<{ readonly id: string; readonly deleted: true }> {
  return withLedgerMutation(context, "transactions.delete", idempotencyKey, async (db) => {
    const current = await findTransaction(db, context.ledgerId, id);
    if (!current) throw new V2ApiError(404, "transaction_not_found", "Transaction not found.");
    requireExpectedVersion(expectedVersion, current.version, id);
    await db
      .delete(v2Transaction)
      .where(and(eq(v2Transaction.ledgerId, context.ledgerId), eq(v2Transaction.id, id)));
    return { id, deleted: true as const };
  });
}
