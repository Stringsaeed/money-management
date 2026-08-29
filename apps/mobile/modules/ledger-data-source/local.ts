import { useSQLiteContext } from "expo-sqlite";

import { useDatabase } from "@/db/client";
import { useAccountVisibility } from "@/hooks/use-account-visibility";

import {
  createLedgerOperationRunner,
  type LedgerDataSource,
  type LedgerOperationRunner,
} from "./contract";
import { createLocalAccountPort } from "./local-accounts";
import { createLocalCategoryPort } from "./local-categories";
import { createLocalTransactionPort } from "./local-transactions";

type LocalTransferResult = { status: "not_required"; reason: "local_authoritative" };

const createLocalSource = <TReads, TMutations>(
  cacheKey: string,
  reads: TReads,
  mutations: TMutations,
  runner: LedgerOperationRunner,
) =>
  ({
    source: "local",
    cacheKey,
    offlineState: { kind: "offline_ready" },
    reads,
    mutations,
    hydration: {
      pull: async () => ({
        status: "not_required" as const,
        reason: "local_authoritative" as const,
      }),
    },
    writeback: {
      submit: async () => ({
        status: "not_required" as const,
        reason: "local_authoritative" as const,
      }),
    },
    observeErrors: runner.observeErrors,
  }) satisfies LedgerDataSource<
    TReads,
    TMutations,
    undefined,
    LocalTransferResult,
    undefined,
    LocalTransferResult
  >;

export const useLocalAccountDataSource = () => {
  const db = useDatabase();
  const sqlite = useSQLiteContext();
  const visibility = useAccountVisibility();
  const runner = createLedgerOperationRunner("local");
  const port = createLocalAccountPort({ db, sqlite, visibility }, runner);
  return createLocalSource(
    visibility.cacheKey,
    { accounts: port.reads },
    { accounts: port.mutations },
    runner,
  );
};

export const useLocalCategoryDataSource = () => {
  const db = useDatabase();
  const sqlite = useSQLiteContext();
  const runner = createLedgerOperationRunner("local");
  const port = createLocalCategoryPort({ db, sqlite }, runner);
  return createLocalSource(
    "local-only",
    { categories: port.reads },
    { categories: port.mutations },
    runner,
  );
};

export const useLocalTransactionDataSource = () => {
  const db = useDatabase();
  const visibility = useAccountVisibility();
  const runner = createLedgerOperationRunner("local");
  const port = createLocalTransactionPort({ db, visibility }, runner);
  return createLocalSource(
    visibility.cacheKey,
    { transactions: port.reads },
    { transactions: port.mutations },
    runner,
  );
};
