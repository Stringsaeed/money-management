import type { CommandEnvelope } from "@trove/protocol";

import type {
  PendingRefundPayload,
  PendingTransactionCreatePayload,
  PendingTransactionEditPayload,
  PendingTransactionRemovePayload,
} from "@/modules/ledger-data-source/pending-transaction-projector";
import type { SyncedTransactionSnapshot } from "@/modules/ledger-data-source/synced-transaction-snapshot";
import type { TransactionWithDetails } from "@/types";
import { monthBounds } from "@/utils/date";

export type TransactionId = string & { readonly __brand: "TransactionId" };
export type CommandId = string & { readonly __brand: "CommandId" };
export type Seq = number & { readonly __brand: "Seq" };

export const asTransactionId = (id: string): TransactionId => {
  // SAFETY: TransactionId is a compile-time brand over a non-empty entity id string.
  return id as TransactionId;
};
export const asCommandId = (id: string): CommandId => {
  // SAFETY: CommandId is a compile-time brand over the envelope commandId string.
  return id as CommandId;
};
export const asSeq = (seq: number): Seq => {
  // SAFETY: Seq is a compile-time brand over the household change sequence number.
  return seq as Seq;
};

export type SyncMark =
  | { readonly kind: "confirmed" }
  | { readonly kind: "pending"; readonly commandIds: readonly string[] };

export type LedgerTransaction = TransactionWithDetails & {
  readonly version: number;
  readonly sync: SyncMark;
};

export interface IntentReceipt {
  readonly id: string;
  readonly commandId: string;
}

export type RawLedgerSnapshot = SyncedTransactionSnapshot;
export type ProjectedLedgerSnapshot = SyncedTransactionSnapshot;

export interface ConfirmedCommand {
  readonly commandId: CommandId;
  readonly seq: Seq;
  readonly command: CommandEnvelope;
}

export interface TransactionFilters {
  readonly from?: string;
  readonly to?: string;
  readonly accountId?: string;
  readonly categoryId?: string;
  readonly type?: TransactionWithDetails["type"];
  readonly isRecurring?: boolean;
  readonly sort?: "asc" | "desc";
  readonly limit?: number;
}

export const monthFilter = (year: number, month: number): TransactionFilters => {
  const { start, end } = monthBounds(year, month);
  return { from: start, to: end };
};

export interface TransactionTotals {
  readonly income: number;
  readonly expense: number;
  readonly net: number;
}

export interface LedgerDateRange {
  readonly minDate: string | null;
  readonly maxDate: string | null;
}

export type LedgerStatus =
  | { readonly phase: "hydrating" }
  | {
      readonly phase: "ready";
      readonly queuedCommands: number;
      readonly stale?: "offline" | "refresh_failed";
    }
  | { readonly phase: "unavailable"; readonly message: string };

export interface NewTransactionInput {
  readonly type: TransactionWithDetails["type"];
  readonly amount: number;
  readonly date: string;
  readonly accountId: string;
  readonly toAccountId?: string | null;
  readonly categoryId?: string | null;
  readonly description?: string;
  readonly originalAmount?: number | null;
  readonly originalCurrency?: string | null;
  readonly exchangeRate?: number | null;
  readonly isRecurring?: boolean;
}

export interface TransactionEdit {
  readonly type?: TransactionWithDetails["type"];
  readonly amount?: number;
  readonly date?: string;
  readonly accountId?: string;
  readonly toAccountId?: string | null;
  readonly categoryId?: string | null;
  readonly description?: string;
}

export interface RefundInput {
  readonly originalTransactionId: string;
  readonly depositAccountId: string;
  readonly currency: string;
  readonly amount: number;
  readonly date: string;
}

export const transactionIdOf = (command: CommandEnvelope): string | undefined => {
  switch (command.kind) {
    case "transaction.create": {
      // SAFETY: mintCreate and createSyncedTransactionResource are the writers of this kind.
      const payload = command.payload as PendingTransactionCreatePayload;
      return payload.id;
    }
    case "transaction.edit": {
      // SAFETY: mintEdit and createSyncedTransactionResource are the writers of this kind.
      const payload = command.payload as PendingTransactionEditPayload;
      return payload.transactionId;
    }
    case "transaction.remove": {
      // SAFETY: mintRemove and createSyncedTransactionResource are the writers of this kind.
      const payload = command.payload as PendingTransactionRemovePayload;
      return payload.transactionId;
    }
    case "refund.link": {
      // SAFETY: mintRefund and createSyncedTransactionResource are the writers of this kind.
      const payload = command.payload as PendingRefundPayload;
      return payload.transactionId;
    }
    default:
      return undefined;
  }
};
