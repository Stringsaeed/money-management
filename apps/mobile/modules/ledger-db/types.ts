import { z } from "zod";

import type { TransactionWithDetails } from "@/types";
import { monthBounds } from "@/utils/date";

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

const sqliteBooleanSchema = z.union([z.literal(0), z.literal(1)]);

export const powerSyncAccountRowSchema = z.object({
  id: z.string(),
  household_id: z.string(),
  name: z.string(),
  type: z.enum(["cash", "bank", "card"]),
  currency: z.string(),
  color: z.string(),
  icon: z.string(),
  initial_balance_minor: z.number().int(),
  exclude_from_total: sqliteBooleanSchema,
  sort_order: z.number().int(),
  lifecycle: z.enum(["active", "archived"]),
  lifecycle_changed_at: z.string().nullable(),
  visibility: z.enum(["public", "private"]),
  owner_user_id: z.string().nullable(),
  version: z.number().int().nonnegative(),
  created_by: z.string(),
  updated_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const powerSyncCategoryRowSchema = z.object({
  id: z.string(),
  household_id: z.string(),
  name: z.string(),
  type: z.enum(["income", "expense"]),
  color: z.string(),
  icon: z.string(),
  parent_id: z.string().nullable(),
  sort_order: z.number().int(),
  lifecycle: z.enum(["active", "archived"]),
  lifecycle_changed_at: z.string().nullable(),
  version: z.number().int().nonnegative(),
  created_by: z.string(),
  updated_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const powerSyncTransactionRowSchema = z.object({
  id: z.string(),
  household_id: z.string(),
  type: z.enum(["expense", "income", "transfer"]),
  amount_minor: z.number().int().positive(),
  currency: z.string(),
  original_amount_minor: z.number().int().nullable(),
  original_currency: z.string().nullable(),
  exchange_rate: z.number().int().nullable(),
  date: z.string(),
  account_id: z.string(),
  to_account_id: z.string().nullable(),
  category_id: z.string().nullable(),
  is_recurring: sqliteBooleanSchema,
  recurring_rule_id: z.string().nullable(),
  description: z.string(),
  version: z.number().int().nonnegative(),
  created_by: z.string(),
  updated_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const powerSyncRejectedChangeRowSchema = z.object({
  id: z.string(),
  command_id: z.string(),
  household_id: z.string(),
  kind: z.string(),
  rejection_kind: z.string(),
  rejection_payload: z.string(),
  envelope: z.string(),
  attempts: z.number().int().nonnegative(),
  created_at: z.string(),
});

export type PowerSyncAccountRow = z.infer<typeof powerSyncAccountRowSchema>;
export type PowerSyncCategoryRow = z.infer<typeof powerSyncCategoryRowSchema>;
export type PowerSyncTransactionRow = z.infer<typeof powerSyncTransactionRowSchema>;
export type PowerSyncRejectedChangeRow = z.infer<typeof powerSyncRejectedChangeRowSchema>;
