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
  readonly source: LedgerDataSourceKind;

  constructor(source: LedgerDataSourceKind, operation: LedgerDataSourceOperation, cause: unknown) {
    const detail = cause instanceof Error ? cause.message : "Unknown ledger failure";
    super(`The ${source} ledger could not ${operation.replace(".", " ")}: ${detail}`);
    this.name = "LedgerDataSourceError";
    this.source = source;
    this.operation = operation;
    this.cause = cause;
  }
}

export type LedgerErrorObserver = (error: LedgerDataSourceError) => void;

export interface LedgerHydration<TInput, TResult> {
  pull: (input: TInput) => Promise<TResult>;
}

export interface LedgerWriteback<TInput, TResult> {
  submit: (input: TInput) => Promise<TResult>;
}

/**
 * Owned mobile ledger seam. Adapters expose authoritative reads and mutations,
 * plus the cache hydration/writeback lifecycle needed by a synced ledger.
 * Storage and transport handles never cross this interface.
 */
export interface LedgerDataSource<
  TReads,
  TMutations,
  THydrationInput,
  THydrationResult,
  TWriteInput,
  TWriteResult,
> {
  readonly source: LedgerDataSourceKind;
  readonly cacheKey: string;
  readonly offlineState: LedgerOfflineState;
  readonly reads: TReads;
  readonly mutations: TMutations;
  readonly hydration: LedgerHydration<THydrationInput, THydrationResult>;
  readonly writeback: LedgerWriteback<TWriteInput, TWriteResult>;
  observeErrors: (observer: LedgerErrorObserver) => () => void;
}

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
