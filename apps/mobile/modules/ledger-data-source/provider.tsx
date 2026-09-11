import { createContext, useContext, type ReactNode } from "react";

import type { CommandScope } from "@trove/protocol";
import { ledgerIdForScope } from "@trove/protocol";

import type { LedgerOfflineState } from "./contract";

/**
 * The Ledger this device is synced to, in the shape every layer below needs:
 * `ledgerId` filters rows, `scope` goes on the command envelope, and
 * `householdId` is non-null only while the Ledger is backed by a Household.
 */
export interface SyncedLedgerBinding {
  readonly ledgerId: string;
  readonly scope: CommandScope;
  readonly householdId: string | null;
}

export type LedgerSourceSelection =
  | { readonly kind: "local" }
  | {
      readonly kind: "synced";
      readonly ledger: SyncedLedgerBinding;
      readonly userId: string;
      readonly offlineState?: Exclude<LedgerOfflineState, { kind: "offline_ready" }>;
    };

// Bindings are interned so the same Ledger is always the same object: the
// PowerSync provider keys its teardown effect on binding identity, and a fresh
// object every render would tear the ledger down on every render.
const bindings = new Map<string, SyncedLedgerBinding>();

const intern = (binding: SyncedLedgerBinding): SyncedLedgerBinding => {
  const existing = bindings.get(binding.ledgerId);
  if (existing) return existing;
  bindings.set(binding.ledgerId, binding);
  return binding;
};

export function personalLedgerBinding(userId: string): SyncedLedgerBinding {
  return intern({
    ledgerId: ledgerIdForScope({ type: "personal", userId }),
    scope: { type: "personal" },
    householdId: null,
  });
}

export function householdLedgerBinding(householdId: string): SyncedLedgerBinding {
  return intern({
    ledgerId: householdId,
    scope: { type: "organization", organizationId: householdId },
    householdId,
  });
}

export function selectLedgerSource(input: {
  readonly authenticatedUserId: string | null;
  readonly activeHouseholdId: string | null;
  readonly migratedHouseholdId: string | null;
  /** The user whose Personal Ledger this device has opted into, if any. */
  readonly personalSyncUserId: string | null;
  readonly offlineReason: string | null;
}): LedgerSourceSelection {
  const userId = input.authenticatedUserId;
  if (!userId) return { kind: "local" };

  const offline = input.offlineReason
    ? { offlineState: { kind: "offline_cached" as const, reason: input.offlineReason } }
    : {};

  // A migrated Household always wins: this device already uploaded its rows
  // there, and a Personal Ledger would hide them.
  if (input.activeHouseholdId && input.activeHouseholdId === input.migratedHouseholdId) {
    return {
      kind: "synced",
      ledger: householdLedgerBinding(input.activeHouseholdId),
      userId,
      ...offline,
    };
  }
  if (input.personalSyncUserId === userId) {
    return { kind: "synced", ledger: personalLedgerBinding(userId), userId, ...offline };
  }
  return { kind: "local" };
}

const DEFAULT_SELECTION = { kind: "local" } as const;
const LedgerSourceContext = createContext<LedgerSourceSelection>(DEFAULT_SELECTION);

interface LedgerDataSourceProviderProps {
  children: ReactNode;
  selection?: LedgerSourceSelection;
}

export const LedgerDataSourceProvider = ({
  children,
  selection = DEFAULT_SELECTION,
}: LedgerDataSourceProviderProps) => (
  <LedgerSourceContext value={selection}>{children}</LedgerSourceContext>
);

export const useLedgerSourceSelection = (): LedgerSourceSelection =>
  useContext(LedgerSourceContext);
