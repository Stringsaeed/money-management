import type { CommandEnvelope, CommandResult } from "@trove/protocol";

import type { TransactionQueryFilters } from "@/modules/ledger-cache";
import type {
  AccountArchivalPreview,
  AccountDeletionPreview,
} from "@/modules/accounts/account-lifecycle-types";
import type { CategoryDeletionPreview } from "@/modules/categories/category-lifecycle";
import type {
  Account,
  AccountWithBalance,
  Category,
  Transaction,
  TransactionWithDetails,
} from "@/types";

export type LedgerDataSourceKind = "local" | "synced";

export type LedgerOfflineState =
  | { readonly kind: "offline_ready" }
  | { readonly kind: "online" }
  | { readonly kind: "offline_cached"; readonly reason: string };

export type LedgerDataSourceOperation =
  | `read.${string}`
  | `mutation.${string}`
  | "hydration.pull"
  | "writeback.submit";

export class LedgerDataSourceError extends Error {
  readonly cause: unknown;
  readonly operation: LedgerDataSourceOperation;
  readonly reason: "offline" | "operation_failed";
  readonly source: LedgerDataSourceKind;

  constructor(
    source: LedgerDataSourceKind,
    operation: LedgerDataSourceOperation,
    cause: unknown,
    reason: "offline" | "operation_failed" = "operation_failed",
  ) {
    const detail = cause instanceof Error ? cause.message : "Unknown ledger failure";
    const impact =
      source === "synced"
        ? "Your last cached ledger data is unchanged."
        : "No ledger changes were saved.";
    const nextAction =
      source === "synced"
        ? "Check your connection and try again."
        : "Try again. If the problem continues, restart the app.";
    super(
      `The ${source} ledger could not ${operation.replaceAll("-", " ").replace(".", " ")}. ${impact} ${nextAction} Details: ${detail}`,
    );
    this.name = "LedgerDataSourceError";
    this.source = source;
    this.operation = operation;
    this.cause = cause;
    this.reason = reason;
  }
}

export type LedgerErrorObserver = (error: LedgerDataSourceError) => void;

export const unsupportedSyncedOperation = (
  operation: string,
  impact: string,
  nextAction: string,
): Error => new Error(`${operation} is unavailable for the synced ledger. ${impact} ${nextAction}`);

export interface LedgerHydration<TInput, TResult> {
  pull: (input: TInput) => Promise<TResult>;
}

export interface LedgerWriteback<TInput, TResult> {
  submit: (input: TInput) => Promise<TResult>;
}

export type LedgerLifecycle =
  | {
      readonly kind: "local";
      readonly offlineState: { readonly kind: "offline_ready" };
    }
  | {
      readonly kind: "synced";
      readonly offlineState: Exclude<LedgerOfflineState, { kind: "offline_ready" }>;
      readonly hydration: LedgerHydration<{ since: number }, unknown>;
      readonly writeback: LedgerWriteback<CommandEnvelope, CommandResult>;
    };

export type NewAccount = Omit<
  Account,
  "id" | "createdAt" | "updatedAt" | "lifecycle" | "lifecycleChangedAt"
>;
export type AccountVisibilityValue = "public" | "private";
export type AccountUpdate = Partial<
  Omit<Account, "id" | "createdAt" | "lifecycle" | "lifecycleChangedAt">
> & {
  readonly visibility?: AccountVisibilityValue;
};

export interface AccountPrivacy {
  readonly visibility: AccountVisibilityValue;
  readonly isOwner: boolean;
}

export interface LedgerAccountPolicy {
  readonly immutableFields: ReadonlySet<keyof AccountUpdate>;
}

export interface LedgerAccountResource {
  list: () => Promise<Account[]>;
  get: (id: string) => Promise<Account | undefined>;
  listWithBalances: (includeArchived: boolean) => Promise<AccountWithBalance[]>;
  create: (data: NewAccount) => Promise<string>;
  update: (id: string, data: AccountUpdate) => Promise<unknown>;
  archive: (id: string) => Promise<unknown>;
  restore: (id: string) => Promise<unknown>;
  readonly policy: LedgerAccountPolicy;
}

export type LedgerAccountLifecycle =
  | {
      readonly kind: "local";
      archivalPreview: (id: string, localDate: string) => Promise<AccountArchivalPreview>;
      deletionPreview: (id: string) => Promise<AccountDeletionPreview>;
      delete: (id: string) => Promise<unknown>;
    }
  | { readonly kind: "synced" };

export type LedgerAccountPrivacy =
  | { readonly kind: "unavailable"; readonly reason: string }
  | {
      readonly kind: "synced";
      read: (id: string) => Promise<AccountPrivacy | undefined>;
      set: (id: string, visibility: AccountPrivacy["visibility"]) => Promise<unknown>;
    };

export const createLedgerOperationRunner = (source: LedgerDataSourceKind) => {
  const observers = new Set<LedgerErrorObserver>();

  return {
    observeErrors(observer: LedgerErrorObserver) {
      observers.add(observer);
      return () => observers.delete(observer);
    },
    async run<TResult>(
      operation: LedgerDataSourceOperation,
      execute: () => Promise<TResult>,
    ): Promise<TResult> {
      try {
        return await execute();
      } catch (cause) {
        const error =
          cause instanceof LedgerDataSourceError
            ? cause
            : new LedgerDataSourceError(source, operation, cause);
        for (const observer of observers) {
          observer(error);
        }
        throw error;
      }
    },
  };
};

export type LedgerOperationRunner = ReturnType<typeof createLedgerOperationRunner>;

export interface LedgerAccountDataSource {
  readonly source: LedgerDataSourceKind;
  readonly cacheKey: string;
  readonly offlineState: LedgerOfflineState;
  readonly accounts: LedgerAccountResource;
  readonly accountLifecycle: LedgerAccountLifecycle;
  readonly accountPrivacy: LedgerAccountPrivacy;
  observeErrors: (observer: LedgerErrorObserver) => () => void;
}

export type NewCategory = Omit<
  Category,
  "id" | "createdAt" | "updatedAt" | "lifecycle" | "lifecycleChangedAt"
>;
export type CategoryUpdate = Partial<
  Omit<Category, "id" | "createdAt" | "lifecycle" | "lifecycleChangedAt">
>;

export interface LedgerCategoryResource {
  list: (type?: "income" | "expense", includeArchived?: boolean) => Promise<Category[]>;
  get: (id: string) => Promise<Category | undefined>;
  create: (data: NewCategory) => Promise<string>;
  update: (id: string, data: CategoryUpdate) => Promise<unknown>;
  archive: (id: string) => Promise<unknown>;
}

export type LedgerCategoryLifecycle =
  | {
      readonly kind: "local";
      deletionPreview: (id: string) => Promise<CategoryDeletionPreview>;
      restore: (id: string) => Promise<unknown>;
      delete: (id: string) => Promise<unknown>;
    }
  | { readonly kind: "synced" };

export interface LedgerCategoryDataSource {
  readonly source: LedgerDataSourceKind;
  readonly cacheKey: string;
  readonly offlineState: LedgerOfflineState;
  readonly categories: LedgerCategoryResource;
  readonly categoryLifecycle: LedgerCategoryLifecycle;
  observeErrors: (observer: LedgerErrorObserver) => () => void;
}

export type NewTransaction = Omit<Transaction, "id" | "createdAt" | "updatedAt" | "isRecurring"> & {
  isRecurring?: boolean;
};
export type TransactionUpdate = Partial<
  Omit<Transaction, "id" | "createdAt" | "date"> & { date?: Date | string }
>;
export interface NewCardPayment {
  readonly cardAccountId: string;
  readonly fundingAccountId: string;
  readonly currency: string;
  readonly amountMinor: number;
  readonly budgetPeriod: string;
  readonly date?: string;
}

export interface NewRefund {
  readonly originalTransactionId: string;
  readonly depositAccountId: string;
  readonly currency: string;
  readonly amountMinor: number;
  readonly date: string;
}

export interface LedgerTransactionResource {
  list: (filters: TransactionQueryFilters) => Promise<TransactionWithDetails[]>;
  get: (id: string) => Promise<TransactionWithDetails | undefined>;
  dateRange: () => Promise<{ minDate: string | null; maxDate: string | null }>;
  monthSummary: (
    year: number,
    month: number,
    accountId?: string | null,
  ) => Promise<{ totalIncome: number; totalExpense: number; netAmount: number }>;
  page: (options: { limit: number; beforeDate?: string; beforeId?: string }) => Promise<{
    transactions: TransactionWithDetails[];
    hasMore: boolean;
    nextCursor?: { date: string; id: string } | null;
  }>;
  create: (data: NewTransaction) => Promise<string>;
  update: (id: string, data: TransactionUpdate) => Promise<unknown>;
  delete: (id: string) => Promise<unknown>;
  recordCardPayment: (data: NewCardPayment) => Promise<string>;
  linkRefund: (data: NewRefund) => Promise<string>;
}

export interface LedgerTransactionDataSource {
  readonly source: LedgerDataSourceKind;
  readonly cacheKey: string;
  readonly offlineState: LedgerOfflineState;
  readonly transactions: LedgerTransactionResource;
  observeErrors: (observer: LedgerErrorObserver) => () => void;
}
