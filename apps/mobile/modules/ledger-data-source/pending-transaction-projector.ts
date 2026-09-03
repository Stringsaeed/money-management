import type { ProjectableCommand } from "@/lib/sync/outbox";

import type { SyncedAccount, SyncedTransaction } from "./synced-mappers";
import type { SyncedTransactionSnapshot } from "./synced-transaction-snapshot";

type TransactionType = SyncedTransaction["type"];
type AccountType = SyncedAccount["type"];
type AccountVisibility = SyncedAccount["visibility"];

export type PendingTransactionCommandKind =
  | "transaction.create"
  | "transaction.edit"
  | "transaction.remove"
  | "refund.link";

export interface PendingAccountCreatePayload {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  color: string;
  icon: string;
  initialBalanceMinor: number;
  excludeFromTotal: boolean;
  sortOrder: number;
  visibility?: AccountVisibility;
}

export interface PendingAccountUpdatePayload {
  accountId: string;
  name?: string;
  color?: string;
  icon?: string;
  excludeFromTotal?: boolean;
  sortOrder?: number;
  visibility?: AccountVisibility;
}

export interface PendingAccountArchivePayload {
  accountId: string;
}

export interface PendingTransactionCreatePayload {
  id: string;
  type: TransactionType;
  amountMinor: number;
  date: string;
  accountId: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  description?: string;
  originalAmountMinor?: number | null;
  originalCurrency?: string | null;
  exchangeRate?: number | null;
  isRecurring?: boolean;
}

export interface PendingTransactionEditPayload {
  transactionId: string;
  type?: TransactionType;
  amountMinor?: number;
  date?: string;
  accountId?: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  description?: string;
}

export interface PendingTransactionRemovePayload {
  transactionId: string;
}

export interface PendingRefundPayload {
  transactionId: string;
  originalTransactionId: string;
  depositAccountId: string;
  currency: string;
  amountMinor: number;
  date: string;
}

export type PendingTransactionPayload =
  | PendingTransactionCreatePayload
  | PendingTransactionEditPayload
  | PendingTransactionRemovePayload
  | PendingRefundPayload;

interface ProjectionState {
  readonly householdId: string;
  readonly userId: string;
  readonly accounts: Map<string, SyncedAccount>;
  readonly transactions: Map<string, SyncedTransaction>;
}

export function projectPendingLedger(
  snapshot: SyncedTransactionSnapshot,
  commands: readonly ProjectableCommand[],
): SyncedTransactionSnapshot {
  const state: ProjectionState = {
    householdId: snapshot.householdId,
    userId: snapshot.userId,
    accounts: new Map(snapshot.accounts.map((row) => [row.id, row])),
    transactions: new Map(snapshot.transactions.map((row) => [row.id, row])),
  };

  for (const command of commands) {
    projectCommand(state, command);
  }

  return {
    ...snapshot,
    accounts: [...state.accounts.values()],
    transactions: [...state.transactions.values()].filter(
      (row) =>
        state.accounts.has(row.accountId) &&
        (row.toAccountId === null || state.accounts.has(row.toAccountId)),
    ),
  };
}

export const projectPendingTransactions = projectPendingLedger;

function projectCommand(state: ProjectionState, command: ProjectableCommand): void {
  switch (command.kind) {
    case "account.create":
      projectAccountCreate(state, command);
      break;
    case "account.update":
      projectAccountUpdate(state, command);
      break;
    case "account.archive":
      projectAccountArchive(state, command);
      break;
    case "account.restore":
      projectAccountRestore(state, command);
      break;
    case "transaction.create":
      projectCreate(state, command);
      break;
    case "transaction.edit":
      projectEdit(state, command);
      break;
    case "transaction.remove":
      projectRemove(state, command);
      break;
    case "refund.link":
      projectRefund(state, command);
      break;
  }
}

function projectAccountCreate(state: ProjectionState, command: ProjectableCommand): void {
  const input = command.payload as PendingAccountCreatePayload;
  if (!input.id || state.accounts.has(input.id)) return;
  const timestamp = command.issuedAt ?? "1970-01-01T00:00:00.000Z";
  state.accounts.set(input.id, {
    householdId: state.householdId,
    id: input.id,
    name: input.name,
    type: input.type,
    currency: input.currency,
    color: input.color,
    icon: input.icon,
    initialBalanceMinor: input.initialBalanceMinor,
    excludeFromTotal: input.excludeFromTotal,
    sortOrder: input.sortOrder,
    lifecycle: "active",
    lifecycleChangedAt: null,
    visibility: input.visibility ?? "public",
    ownerUserId: state.userId,
    version: 0,
    createdBy: "optimistic",
    updatedBy: "optimistic",
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

function projectAccountUpdate(state: ProjectionState, command: ProjectableCommand): void {
  const input = command.payload as PendingAccountUpdatePayload;
  const existing = state.accounts.get(input.accountId);
  if (!existing || existing.lifecycle === "archived") return;
  state.accounts.set(input.accountId, {
    ...existing,
    ...(input.name !== undefined && { name: input.name }),
    ...(input.color !== undefined && { color: input.color }),
    ...(input.icon !== undefined && { icon: input.icon }),
    ...(input.excludeFromTotal !== undefined && { excludeFromTotal: input.excludeFromTotal }),
    ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
    ...(input.visibility !== undefined && { visibility: input.visibility }),
    version: existing.version + 1,
    updatedBy: "optimistic",
    updatedAt: command.issuedAt ?? existing.updatedAt,
  });
}

function projectAccountRestore(state: ProjectionState, command: ProjectableCommand): void {
  const input = decodeAccountIdPayload(command.payload as PendingAccountArchivePayload);
  if (!input) return;
  const existing = state.accounts.get(input.accountId);
  if (!existing || existing.lifecycle !== "archived") return;
  const timestamp = command.issuedAt ?? existing.updatedAt;
  state.accounts.set(input.accountId, {
    ...existing,
    lifecycle: "active",
    lifecycleChangedAt: timestamp,
    version: existing.version + 1,
    updatedBy: "optimistic",
    updatedAt: timestamp,
  });
}

function decodeAccountIdPayload(
  payload: PendingAccountArchivePayload,
): PendingAccountArchivePayload | null {
  return payload.accountId ? payload : null;
}

function projectAccountArchive(state: ProjectionState, command: ProjectableCommand): void {
  const input = decodeAccountIdPayload(command.payload as PendingAccountArchivePayload);
  if (!input) return;
  const existing = state.accounts.get(input.accountId);
  if (!existing || existing.lifecycle === "archived") return;
  const timestamp = command.issuedAt ?? existing.updatedAt;
  state.accounts.set(input.accountId, {
    ...existing,
    lifecycle: "archived",
    lifecycleChangedAt: timestamp,
    version: existing.version + 1,
    updatedBy: "optimistic",
    updatedAt: timestamp,
  });
}

function projectCreate(state: ProjectionState, command: ProjectableCommand): void {
  // SAFETY: createSyncedTransactionResource is the sole writer for this command kind.
  const input = command.payload as PendingTransactionCreatePayload;
  const account = state.accounts.get(input.accountId);
  if (!account) return;
  const timestamp = command.issuedAt ?? "1970-01-01T00:00:00.000Z";
  state.transactions.set(input.id, {
    householdId: state.householdId,
    id: input.id,
    type: input.type,
    amountMinor: input.amountMinor,
    currency: account.currency,
    originalAmountMinor: input.originalAmountMinor ?? null,
    originalCurrency: input.originalCurrency ?? null,
    exchangeRate: input.exchangeRate ?? null,
    date: input.date,
    accountId: input.accountId,
    toAccountId: input.toAccountId ?? null,
    categoryId: input.categoryId ?? null,
    isRecurring: input.isRecurring ?? false,
    recurringRuleId: null,
    description: input.description ?? "",
    version: 0,
    createdBy: "optimistic",
    updatedBy: "optimistic",
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

function projectEdit(state: ProjectionState, command: ProjectableCommand): void {
  // SAFETY: createSyncedTransactionResource is the sole writer for this command kind.
  const input = command.payload as PendingTransactionEditPayload;
  const existing = state.transactions.get(input.transactionId);
  if (!existing) return;
  state.transactions.set(input.transactionId, {
    ...existing,
    ...(input.type !== undefined && { type: input.type }),
    ...(input.amountMinor !== undefined && { amountMinor: input.amountMinor }),
    ...(input.date !== undefined && { date: input.date }),
    ...(input.accountId !== undefined && { accountId: input.accountId }),
    ...(input.toAccountId !== undefined && { toAccountId: input.toAccountId }),
    ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
    ...(input.description !== undefined && { description: input.description }),
    version: existing.version + 1,
    updatedAt: command.issuedAt ?? existing.updatedAt,
  });
}

function projectRemove(state: ProjectionState, command: ProjectableCommand): void {
  // SAFETY: createSyncedTransactionResource is the sole writer for this command kind.
  const input = command.payload as PendingTransactionRemovePayload;
  state.transactions.delete(input.transactionId);
}

function projectRefund(state: ProjectionState, command: ProjectableCommand): void {
  // SAFETY: createSyncedTransactionResource is the sole writer for this command kind.
  const input = command.payload as PendingRefundPayload;
  const original = state.transactions.get(input.originalTransactionId);
  if (!original) return;
  const timestamp = command.issuedAt ?? "1970-01-01T00:00:00.000Z";
  state.transactions.set(input.transactionId, {
    householdId: state.householdId,
    id: input.transactionId,
    type: "income",
    amountMinor: input.amountMinor,
    currency: input.currency,
    originalAmountMinor: null,
    originalCurrency: null,
    exchangeRate: null,
    date: input.date,
    accountId: input.depositAccountId,
    toAccountId: null,
    categoryId: original.categoryId,
    isRecurring: false,
    recurringRuleId: null,
    description: `Refund of ${input.originalTransactionId}`,
    version: 0,
    createdBy: "optimistic",
    updatedBy: "optimistic",
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}
