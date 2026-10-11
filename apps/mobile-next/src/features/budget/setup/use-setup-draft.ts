import { useEffect, useSyncExternalStore } from "react";

import { scopeKey } from "@/data/ledger-collections";
import { useLedgerData } from "@/data/ledger-queries";

import { emptySetupDraft } from "./setup-draft";
import {
  clearSetupDraft,
  draftStorageKey,
  getSetupDraft,
  loadSetupDraft,
  setSetupDraft,
  subscribeSetupDraft,
} from "./setup-draft-store";
import type { SetupDraft } from "./setup-types";
import { useSetupTarget } from "./use-setup-target";

export interface UseSetupDraft {
  /** False until the stored draft has been read. */
  readonly ready: boolean;
  /** A saved draft exists, so setup can continue. */
  readonly exists: boolean;
  /** The saved draft, or a fresh one with defaults. */
  readonly draft: SetupDraft;
  readonly update: (patch: Partial<SetupDraft>) => void;
  readonly clear: () => void;
}

/**
 * The Setup Draft for this identity and ledger scope, saved on the device. An additional
 * currency's setup has its own draft, so starting USD never touches an unfinished AED one.
 */
export function useSetupDraft(): UseSetupDraft {
  const { identityKey, scope } = useLedgerData();
  const target = useSetupTarget();
  const storageKey = draftStorageKey(scopeKey(identityKey, scope), target);
  const stored = useSyncExternalStore(subscribeSetupDraft, () => getSetupDraft(storageKey));
  useEffect(() => {
    void loadSetupDraft(storageKey);
  }, [storageKey]);

  return {
    ready: stored !== undefined,
    exists: Boolean(stored),
    draft: stored ?? emptySetupDraft(),
    update: (patch) =>
      setSetupDraft(storageKey, { ...(getSetupDraft(storageKey) ?? emptySetupDraft()), ...patch }),
    clear: () => clearSetupDraft(storageKey),
  };
}
