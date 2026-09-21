import { and, eq, or } from "drizzle-orm";
import { v2Account, v2RecurringRule, v2Transaction } from "@trove/db/schema/v2-ledger";

import {
  accountCreateSchema,
  accountUpdateSchema,
  type V2AccountCreateInput,
  type V2AccountUpdateInput,
  type V2Account,
} from "./contracts";
import {
  iso,
  requireExpectedVersion,
  safeMinor,
  type V2DbExecutor,
  type V2LedgerContext,
  V2ApiError as ApiError,
  withLedgerMutation,
} from "./shared";

type AccountRow = typeof v2Account.$inferSelect;

function accountRow(row: AccountRow, balanceMinor = row.openingBalanceMinor): V2Account {
  return {
    id: row.id,
    ledgerId: row.ledgerId,
    name: row.name,
    type: row.type,
    currency: row.currency,
    openingBalanceMinor: safeMinor(row.openingBalanceMinor, "Account opening balance"),
    balanceMinor: safeMinor(balanceMinor, "Account balance"),
    archived: row.lifecycle === "archived",
    version: row.version,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

async function findAccount(db: V2DbExecutor, ledgerId: string, id: string) {
  const rows = await db
    .select()
    .from(v2Account)
    .where(and(eq(v2Account.ledgerId, ledgerId), eq(v2Account.id, id)))
    .limit(1);
  return rows[0] ?? null;
}

async function accountBalance(
  db: V2DbExecutor,
  ledgerId: string,
  accountId: string,
): Promise<number> {
  const rows = await db
    .select({
      amountMinor: v2Transaction.amountMinor,
      kind: v2Transaction.kind,
      accountId: v2Transaction.accountId,
      toAccountId: v2Transaction.toAccountId,
    })
    .from(v2Transaction)
    .where(
      and(
        eq(v2Transaction.ledgerId, ledgerId),
        or(eq(v2Transaction.accountId, accountId), eq(v2Transaction.toAccountId, accountId)),
      ),
    );

  let balance = 0;
  for (const row of rows) {
    balance += accountTransactionDelta(row, accountId);
  }
  if (!Number.isSafeInteger(balance)) {
    throw new ApiError(
      422,
      "unsafe_balance",
      "The Account balance exceeds the supported money range.",
    );
  }
  return balance;
}

function accountTransactionDelta(
  row: {
    readonly amountMinor: number;
    readonly kind: string;
    readonly accountId: string;
    readonly toAccountId: string | null;
  },
  accountId: string,
): number {
  const amount = safeMinor(row.amountMinor, "Transaction amount");
  if (row.kind === "income" && row.accountId === accountId) return amount;
  if (row.kind === "expense" && row.accountId === accountId) return -amount;
  if (row.kind === "transfer" && row.accountId === accountId) return -amount;
  if (row.kind === "transfer" && row.toAccountId === accountId) return amount;
  return 0;
}

async function balancesFor(
  db: V2DbExecutor,
  ledgerId: string,
  accounts: readonly AccountRow[],
): Promise<Map<string, number>> {
  const rows = await db
    .select({
      accountId: v2Transaction.accountId,
      toAccountId: v2Transaction.toAccountId,
      amountMinor: v2Transaction.amountMinor,
      kind: v2Transaction.kind,
    })
    .from(v2Transaction)
    .where(eq(v2Transaction.ledgerId, ledgerId));
  const balances = new Map(
    accounts.map((account) => [
      account.id,
      safeMinor(account.openingBalanceMinor, "Account opening balance"),
    ]),
  );
  for (const row of rows) {
    const amount = safeMinor(row.amountMinor, "Transaction amount");
    const source = balances.get(row.accountId);
    if (source !== undefined) {
      balances.set(row.accountId, source + (row.kind === "income" ? amount : -amount));
    }
    if (row.kind === "transfer" && row.toAccountId) {
      const destination = balances.get(row.toAccountId);
      if (destination !== undefined) balances.set(row.toAccountId, destination + amount);
    }
  }
  for (const value of balances.values()) {
    if (!Number.isSafeInteger(value)) {
      throw new ApiError(
        422,
        "unsafe_balance",
        "The Account balance exceeds the supported money range.",
      );
    }
  }
  return balances;
}

export async function listAccounts(
  context: V2LedgerContext,
  options: { readonly includeArchived?: boolean } = {},
): Promise<readonly V2Account[]> {
  const rows = await context.db
    .select()
    .from(v2Account)
    .where(
      options.includeArchived
        ? eq(v2Account.ledgerId, context.ledgerId)
        : and(eq(v2Account.ledgerId, context.ledgerId), eq(v2Account.lifecycle, "active")),
    )
    .orderBy(v2Account.name, v2Account.id);
  const balances = await balancesFor(context.db, context.ledgerId, rows);
  return rows.map((row) => accountRow(row, balances.get(row.id) ?? row.openingBalanceMinor));
}

export async function getAccount(context: V2LedgerContext, id: string): Promise<V2Account> {
  const row = await findAccount(context.db, context.ledgerId, id);
  if (!row) throw new ApiError(404, "account_not_found", "Account not found.");
  return accountRow(
    row,
    row.openingBalanceMinor + (await accountBalance(context.db, context.ledgerId, id)),
  );
}

export async function createAccount(
  context: V2LedgerContext,
  input: V2AccountCreateInput,
  idempotencyKey?: string,
): Promise<V2Account> {
  const parsed = accountCreateSchema.parse(input);
  return withLedgerMutation(context, "accounts.create", idempotencyKey, async (db) => {
    const id = parsed.id ?? crypto.randomUUID();
    const existing = await db
      .select({ id: v2Account.id })
      .from(v2Account)
      .where(and(eq(v2Account.ledgerId, context.ledgerId), eq(v2Account.id, id)))
      .limit(1);
    if (existing[0])
      throw new ApiError(409, "account_exists", "An Account with this id already exists.");

    const now = new Date();
    const inserted = await db
      .insert(v2Account)
      .values({
        ledgerId: context.ledgerId,
        id,
        name: parsed.name,
        type: parsed.type,
        currency: parsed.currency,
        openingBalanceMinor: parsed.openingBalanceMinor,
        createdBy: context.ownerId,
        updatedBy: context.ownerId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    const row = inserted[0];
    if (!row) throw new ApiError(500, "account_create_failed", "Account could not be created.");
    return accountRow(row);
  });
}

export async function updateAccount(
  context: V2LedgerContext,
  id: string,
  input: V2AccountUpdateInput,
  expectedVersion?: number,
  idempotencyKey?: string,
): Promise<V2Account> {
  const parsed = accountUpdateSchema.parse(input);
  return withLedgerMutation(context, "accounts.update", idempotencyKey, async (db) => {
    const current = await findAccount(db, context.ledgerId, id);
    if (!current) throw new ApiError(404, "account_not_found", "Account not found.");
    requireExpectedVersion(expectedVersion, current.version, id);

    await assertAccountUpdateAllowed(db, context.ledgerId, id, current, parsed);

    const updated = await db
      .update(v2Account)
      .set({
        ...(parsed.name !== undefined && { name: parsed.name }),
        ...(parsed.type !== undefined && { type: parsed.type }),
        ...(parsed.currency !== undefined && { currency: parsed.currency }),
        ...(parsed.openingBalanceMinor !== undefined && {
          openingBalanceMinor: parsed.openingBalanceMinor,
        }),
        ...(parsed.archived !== undefined && {
          lifecycle: parsed.archived ? "archived" : "active",
        }),
        updatedBy: context.ownerId,
        updatedAt: new Date(),
        version: current.version + 1,
      })
      .where(and(eq(v2Account.ledgerId, context.ledgerId), eq(v2Account.id, id)))
      .returning();
    const row = updated[0];
    if (!row) throw new ApiError(500, "account_update_failed", "Account could not be updated.");
    return accountRow(
      row,
      row.openingBalanceMinor + (await accountBalance(db, context.ledgerId, id)),
    );
  });
}

async function assertAccountUpdateAllowed(
  db: V2DbExecutor,
  ledgerId: string,
  accountId: string,
  current: AccountRow,
  changes: ReturnType<typeof accountUpdateSchema.parse>,
): Promise<void> {
  if (current.lifecycle === "archived" && changes.archived !== false) {
    throw new ApiError(409, "account_archived", "Restore the Account before editing it.");
  }
  if (changes.currency === undefined || changes.currency === current.currency) return;
  const history = await db
    .select({ id: v2Transaction.id })
    .from(v2Transaction)
    .where(
      and(
        eq(v2Transaction.ledgerId, ledgerId),
        or(eq(v2Transaction.accountId, accountId), eq(v2Transaction.toAccountId, accountId)),
      ),
    )
    .limit(1);
  if (history[0]) {
    throw new ApiError(
      409,
      "account_currency_locked",
      "An Account with transaction history cannot change currency.",
    );
  }
}

export async function deleteAccount(
  context: V2LedgerContext,
  id: string,
  expectedVersion?: number,
  idempotencyKey?: string,
): Promise<{ readonly id: string; readonly archived: boolean; readonly deleted: boolean }> {
  return withLedgerMutation(context, "accounts.delete", idempotencyKey, async (db) => {
    const current = await findAccount(db, context.ledgerId, id);
    if (!current) throw new ApiError(404, "account_not_found", "Account not found.");
    requireExpectedVersion(expectedVersion, current.version, id);

    if (await accountHasDependencies(db, context.ledgerId, id)) {
      await db
        .update(v2Account)
        .set({
          lifecycle: "archived",
          version: current.version + 1,
          updatedBy: context.ownerId,
          updatedAt: new Date(),
        })
        .where(and(eq(v2Account.ledgerId, context.ledgerId), eq(v2Account.id, id)));
      return { id, archived: true, deleted: false };
    }
    await db
      .delete(v2Account)
      .where(and(eq(v2Account.ledgerId, context.ledgerId), eq(v2Account.id, id)));
    return { id, archived: false, deleted: true };
  });
}

async function accountHasDependencies(
  db: V2DbExecutor,
  ledgerId: string,
  accountId: string,
): Promise<boolean> {
  const [transactionHistory, recurringUsage] = await Promise.all([
    db
      .select({ id: v2Transaction.id })
      .from(v2Transaction)
      .where(
        and(
          eq(v2Transaction.ledgerId, ledgerId),
          or(eq(v2Transaction.accountId, accountId), eq(v2Transaction.toAccountId, accountId)),
        ),
      )
      .limit(1),
    db
      .select({ id: v2RecurringRule.id })
      .from(v2RecurringRule)
      .where(
        and(
          eq(v2RecurringRule.ledgerId, ledgerId),
          or(eq(v2RecurringRule.accountId, accountId), eq(v2RecurringRule.toAccountId, accountId)),
        ),
      )
      .limit(1),
  ]);
  return Boolean(transactionHistory[0] || recurringUsage[0]);
}
