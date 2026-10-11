import { useEffect, useSyncExternalStore } from "react";

import { scopeKey } from "@/data/ledger-collections";
import { useLedgerData } from "@/data/ledger-queries";

import { EMPTY_QUICK_ADD_MEMORY, type QuickAddMemory } from "./quick-add-memory";
import {
  getQuickAddMemory,
  loadQuickAddMemory,
  memoryStorageKey,
  rememberQuickAddSpend,
  subscribeQuickAddMemory,
} from "./quick-add-memory-store";

export interface UseQuickAddMemory {
  readonly memory: QuickAddMemory;
  readonly remember: (spend: { accountId: string; envelopeId: string }) => Promise<void>;
}

/** Last used account and recent envelopes for this identity and ledger scope, kept on the device. */
export function useQuickAddMemory(): UseQuickAddMemory {
  const { identityKey, scope } = useLedgerData();
  const storageKey = memoryStorageKey(scopeKey(identityKey, scope));
  const stored = useSyncExternalStore(subscribeQuickAddMemory, () => getQuickAddMemory(storageKey));
  useEffect(() => {
    void loadQuickAddMemory(storageKey);
  }, [storageKey]);

  return {
    memory: stored ?? EMPTY_QUICK_ADD_MEMORY,
    remember: (spend) => rememberQuickAddSpend(storageKey, spend),
  };
}
