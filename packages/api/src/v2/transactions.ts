import { and, desc, eq, gte, ilike, inArray, lt, lte, or, sql, type SQL } from "drizzle-orm";

import { v2Account, v2Category, v2Transaction } from "@trove/db/schema/v2-ledger";

import {
  ledgerDateSchema,
  transactionCreateSchema,
  transactionUpdateSchema,
  type V2TransactionCreateInput,
  type V2TransactionUpdateInput,
  type V2Page,
  type V2Transaction,
  type V2TransactionKind,
  type V2TransactionSummary,
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

export interface TransactionFilterOptions {
  readonly accountIds?: readonly string[];
  readonly categoryIds?: readonly string[];
  readonly kinds?: readonly V2TransactionKind[];
  readonly from?: string;
  readonly to?: string;
  readonly search?: string;
}

export interface TransactionCursor {
  readonly date: string;
  readonly id: string;
}

export interface TransactionListOptions extends TransactionFilterOptions {
  readonly limit?: number;
  readonly cursor?: TransactionCursor;
}

export const TRANSACTION_PAGE_DEFAULT = 50;
export const TRANSACTION_PAGE_MAX = 200;

export function encodeTransactionCursor(cursor: TransactionCursor): string {
  return `${cursor.date}:${cursor.id}`;
}

/** Cursors are `date:id` of the last row served; ids never contain a colon. */
export function decodeTransactionCursor(value: string): TransactionCursor {
  const separator = value.indexOf(":");
  const date = value.slice(0, separator);
  const id = value.slice(separator + 1);
  if (separator < 0 || !ledgerDateSchema.safeParse(date).success || id.length === 0) {
    throw new V2ApiError(400, "invalid_cursor", "cursor is not a Transaction page cursor.");
  }
  return { date, id };
}

export async function listTransactions(
  context: V2LedgerContext,
  options: TransactionListOptions = {},
): Promise<V2Page<V2Transaction>> {
  const limit = Math.min(
    Math.max(options.limit ?? TRANSACTION_PAGE_DEFAULT, 1),
    TRANSACTION_PAGE_MAX,
  );
  const conditions = [...transactionFilters(context.ledgerId, options)];
  if (options.cursor) conditions.push(beforeCursor(options.cursor));
  const rows = await context.db
    .select()
    .from(v2Transaction)
    .where(and(...conditions))
    .orderBy(desc(v2Transaction.date), desc(v2Transaction.id))
    .limit(limit + 1);
  const pageRows = rows.slice(0, limit);
  const last = pageRows.at(-1);
  return {
    items: pageRows.map(transactionRow),
    nextCursor: rows.length > limit && last ? encodeTransactionCursor(last) : null,
  };
}

export async function summarizeTransactions(
  context: V2LedgerContext,
  options: TransactionFilterOptions = {},
): Promise<V2TransactionSummary> {
  const rows = await context.db
    .select({
      currency: v2Transaction.currency,
      kind: v2Transaction.kind,
      count: sql<string>`count(*)`,
      amountMinor: sql<string>`coalesce(sum(${v2Transaction.amountMinor}), 0)`,
    })
    .from(v2Transaction)
    .where(and(...transactionFilters(context.ledgerId, options)))
    .groupBy(v2Transaction.currency, v2Transaction.kind);

  const byCurrency = new Map<
    string,
    { count: number; incomeMinor: number; expenseMinor: number }
  >();
  let count = 0;
  for (const row of rows) {
    const rowCount = Number(row.count);
    const amount = safeMinor(row.amountMinor, "Transaction summary amount");
    const current = byCurrency.get(row.currency) ?? { count: 0, incomeMinor: 0, expenseMinor: 0 };
    current.count += rowCount;
    if (row.kind === "income") current.incomeMinor += amount;
    if (row.kind === "expense") current.expenseMinor += amount;
    byCurrency.set(row.currency, current);
    count += rowCount;
  }
  return {
    count,
    totals: [...byCurrency.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([currency, value]) => ({
        currency,
        ...value,
        netMinor: safeMinor(value.incomeMinor - value.expenseMinor, "Transaction summary net"),
      })),
  };
}

function beforeCursor(cursor: TransactionCursor) {
  return or(
    lt(v2Transaction.date, cursor.date),
    and(eq(v2Transaction.date, cursor.date), lt(v2Transaction.id, cursor.id)),
  )!;
}

/** Escapes LIKE wildcards so a search is always a literal substring match. */
function likeContains(value: string): string {
  return `%${value.replace(/[\\%_]/g, (match) => `\\${match}`)}%`;
}

// oxlint-disable-next-line complexity -- each filter is independent and maps to one predicate.
function transactionFilters(ledgerId: string, options: TransactionFilterOptions): SQL[] {
  const conditions: SQL[] = [eq(v2Transaction.ledgerId, ledgerId)];
  if (options.accountIds?.length) {
    conditions.push(
      or(
        inArray(v2Transaction.accountId, [...options.accountIds]),
        inArray(v2Transaction.toAccountId, [...options.accountIds]),
      )!,
    );
  }
  if (options.categoryIds?.length)
    conditions.push(inArray(v2Transaction.categoryId, [...options.categoryIds]));
  if (options.kinds?.length) conditions.push(inArray(v2Transaction.kind, [...options.kinds]));
  if (options.from) conditions.push(gte(v2Transaction.date, options.from));
  if (options.to) conditions.push(lte(v2Transaction.date, options.to));
  const search = options.search?.trim();
  if (search) conditions.push(ilike(v2Transaction.note, likeContains(search)));
  return conditions;
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
