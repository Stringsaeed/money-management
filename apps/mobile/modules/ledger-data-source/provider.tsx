import { createContext, useContext, type ReactNode } from "react";

import type { LedgerOfflineState } from "./contract";

export type LedgerSourceSelection =
  | { readonly kind: "local" }
  | {
      readonly kind: "synced";
      readonly householdId: string;
      readonly userId: string;
      readonly offlineState?: Exclude<LedgerOfflineState, { kind: "offline_ready" }>;
    };

export function selectLedgerSource(input: {
  readonly authenticatedUserId: string | null;
  readonly activeHouseholdId: string | null;
  readonly migratedHouseholdId: string | null;
  readonly offlineReason: string | null;
}): LedgerSourceSelection {
  if (
    !input.authenticatedUserId ||
    !input.activeHouseholdId ||
    input.activeHouseholdId !== input.migratedHouseholdId
  ) {
    return { kind: "local" };
  }
  return {
    kind: "synced",
    householdId: input.activeHouseholdId,
    userId: input.authenticatedUserId,
    ...(input.offlineReason && {
      offlineState: { kind: "offline_cached" as const, reason: input.offlineReason },
    }),
  };
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
