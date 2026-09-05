import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react";

import { useDatabase } from "@/db/client";
import { useLedgerSourceSelection } from "@/modules/ledger-data-source/provider";

import { createLedgerDependencies } from "./deps";
import type { SyncedTransactionLedger } from "./ledger";
import { acquireSyncedTransactionLedger } from "./registry";

const LedgerContext = createContext<SyncedTransactionLedger | null>(null);

export interface SyncedTransactionsProviderProps {
  readonly householdId: string;
  readonly userId: string;
  readonly children: ReactNode;
}

export const SyncedTransactionsProvider = ({
  householdId,
  userId,
  children,
}: SyncedTransactionsProviderProps) => {
  const db = useDatabase();
  const selection = useLedgerSourceSelection();
  const offline = selection.kind === "synced" && selection.offlineState?.kind === "offline_cached";
  const [ledger, setLedger] = useState<SyncedTransactionLedger | null>(null);

  useLayoutEffect(() => {
    const handle = acquireSyncedTransactionLedger(
      createLedgerDependencies({ householdId, userId, db, offline }),
    );
    handle.ledger.setOffline(offline);
    setLedger(handle.ledger);
    return () => {
      handle.release();
      setLedger(null);
    };
  }, [db, householdId, offline, userId]);

  return <LedgerContext value={ledger}>{children}</LedgerContext>;
};

export const useSyncedTransactionLedger = (): SyncedTransactionLedger | null =>
  useContext(LedgerContext);

export const useRequiredLedger = (): SyncedTransactionLedger => {
  const ledger = useContext(LedgerContext);
  if (!ledger) {
    throw new Error("SyncedTransactionsProvider must wrap synced transaction screens.");
  }
  return ledger;
};
