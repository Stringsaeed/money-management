import { createContext, useContext, type ReactNode } from "react";

import type { LedgerOfflineState } from "./contract";

export type LedgerSourceSelection =
  | { readonly kind: "local" }
  | {
      readonly kind: "synced";
      readonly householdId: string;
      readonly offlineState?: Exclude<LedgerOfflineState, { kind: "offline_ready" }>;
    };

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
