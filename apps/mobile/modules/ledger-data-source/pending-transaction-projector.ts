import { format, lastDayOfMonth, parseISO } from "date-fns";

import type { ProjectableCommand } from "@/lib/sync/outbox";

import type { SyncedAccount, SyncedTransaction } from "./synced-mappers";
import type { SyncedTransactionSnapshot } from "./synced-transaction-snapshot";

type TransactionType = SyncedTransaction["type"];

export type PendingTransactionCommandKind =
  | "transaction.create"
  | "transaction.edit"
  | "transaction.remove"
  | "card_payment.record"
  | "refund.link";

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

export interface PendingCardPaymentPayload {
  transactionId: string;
  cardAccountId: string;
  fundingAccountId: string;
  currency: string;
  amountMinor: number;
  budgetPeriod: string;
  date?: string;
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
  | PendingCardPaymentPayload
  | PendingRefundPayload;

interface ProjectionState {
  readonly householdId: string;
  readonly accounts: Map<string, SyncedAccount>;
  readonly transactions: Map<string, SyncedTransaction>;
}

/** Folds queued Transaction intents over one authorized server snapshot. */
export function projectPendingTransactions(
  snapshot: SyncedTransactionSnapshot,
  commands: readonly ProjectableCommand[],
): SyncedTransactionSnapshot {
  const state: ProjectionState = {
    householdId: snapshot.householdId,
    accounts: new Map(snapshot.accounts.map((row) => [row.id, row])),
    transactions: new Map(snapshot.transactions.map((row) => [row.id, row])),
  };

  for (const command of commands) {
    projectCommand(state, command);
  }

  return {
    ...snapshot,
    transactions: [...state.transactions.values()].filter(
      (row) =>
        state.accounts.has(row.accountId) &&
        (row.toAccountId === null || state.accounts.has(row.toAccountId)),
    ),
  };
}

function projectCommand(state: ProjectionState, command: ProjectableCommand): void {
  switch (command.kind) {
    case "transaction.create":
      projectCreate(state, command);
      break;
    case "transaction.edit":
      projectEdit(state, command);
      break;
    case "transaction.remove":
      projectRemove(state, command);
      break;
    case "card_payment.record":
      projectCardPayment(state, command);
      break;
    case "refund.link":
      projectRefund(state, command);
      break;
  }
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

function projectCardPayment(state: ProjectionState, command: ProjectableCommand): void {
  // SAFETY: createSyncedTransactionResource is the sole writer for this command kind.
  const input = command.payload as PendingCardPaymentPayload;
  const timestamp = command.issuedAt ?? "1970-01-01T00:00:00.000Z";
  state.transactions.set(input.transactionId, {
    householdId: state.householdId,
    id: input.transactionId,
    type: "transfer",
    amountMinor: input.amountMinor,
    currency: input.currency,
    originalAmountMinor: null,
    originalCurrency: null,
    exchangeRate: null,
    date: input.date ?? format(lastDayOfMonth(parseISO(`${input.budgetPeriod}-01`)), "yyyy-MM-dd"),
    accountId: input.fundingAccountId,
    toAccountId: input.cardAccountId,
    categoryId: null,
    isRecurring: false,
    recurringRuleId: null,
    description: "Card payment",
    version: 0,
    createdBy: "optimistic",
    updatedBy: "optimistic",
    createdAt: timestamp,
    updatedAt: timestamp,
  });
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
