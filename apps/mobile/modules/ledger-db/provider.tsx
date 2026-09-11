import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react";

import {
  useLedgerSourceSelection,
  type SyncedLedgerBinding,
} from "@/modules/ledger-data-source/provider";
import { openPowerSyncDatabase } from "@/modules/powersync/database";

import { createLedgerDependencies } from "./deps";
import type { SyncedTransactionLedger } from "./ledger";
import { acquireSyncedTransactionLedger } from "./registry";

const LedgerContext = createContext<SyncedTransactionLedger | null>(null);

export interface SyncedTransactionsProviderProps {
  readonly binding: SyncedLedgerBinding;
  readonly userId: string;
  readonly children: ReactNode;
}

export const SyncedTransactionsProvider = ({
  binding,
  userId,
  children,
}: SyncedTransactionsProviderProps) => {
  const selection = useLedgerSourceSelection();
  const offline = selection.kind === "synced" && selection.offlineState?.kind === "offline_cached";
  const [ledger, setLedger] = useState<SyncedTransactionLedger | null>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    let release: (() => void) | undefined;
    setLedger(null);
    setLoadError(null);
    void openPowerSyncDatabase(userId)
      .then((database) => {
        if (cancelled) return;
        const handle = acquireSyncedTransactionLedger(
          createLedgerDependencies({ ledger: binding, userId, database }),
        );
        release = handle.release;
        setLedger(handle.ledger);
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error : new Error("PowerSync database initialization failed."),
          );
        }
      });
    return () => {
      cancelled = true;
      release?.();
      setLedger(null);
    };
  }, [binding, userId]);

  useLayoutEffect(() => {
    ledger?.setOffline(offline);
  }, [ledger, offline]);

  if (loadError) throw loadError;
  return <LedgerContext value={ledger}>{ledger ? children : null}</LedgerContext>;
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
