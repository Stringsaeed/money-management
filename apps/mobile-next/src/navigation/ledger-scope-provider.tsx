import { useState, type ReactNode } from "react";
import type { V2LedgerScope } from "@trove/api/v2/contracts";
import { LedgerScopeContext } from "./ledger-scope-context";

export const LedgerScopeProvider = ({ children }: { readonly children: ReactNode }) => {
  const [scope, selectScope] = useState<V2LedgerScope>({ kind: "personal" });
  return <LedgerScopeContext value={{ scope, selectScope }}>{children}</LedgerScopeContext>;
};
