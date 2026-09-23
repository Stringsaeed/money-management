import { createContext, useContext } from "react";
import type { V2LedgerScope } from "@trove/api/v2/contracts";

interface LedgerScopeValue {
  readonly scope: V2LedgerScope;
  readonly selectScope: (scope: V2LedgerScope) => void;
}

export const LedgerScopeContext = createContext<LedgerScopeValue | null>(null);

export const useLedgerScope = (): LedgerScopeValue => {
  const value = useContext(LedgerScopeContext);
  if (!value) throw new Error("Ledger scope is unavailable outside the signed-in app.");
  return value;
};
