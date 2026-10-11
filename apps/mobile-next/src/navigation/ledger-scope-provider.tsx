import { useEffect, useState, type ReactNode } from "react";
import type { V2LedgerScope } from "@trove/api/v2/contracts";

import { useHouseholdMembership } from "@/features/household/use-household-membership";
import { showToast } from "@/ui/toast";

import { LedgerScopeContext } from "./ledger-scope-context";

const PERSONAL: V2LedgerScope = { kind: "personal" };

export const LedgerScopeProvider = ({ children }: { readonly children: ReactNode }) => {
  const [scope, selectScope] = useState<V2LedgerScope>(PERSONAL);
  const [scopeSheetOpen, setScopeSheetOpen] = useState(false);
  const membership = useHouseholdMembership(scope.kind === "household" ? scope.householdId : null);

  // Revoked access (removed, or left on another device) never leaves the app on a household it
  // can no longer read: go back to Personal and say why.
  const revoked = scope.kind === "household" && membership.known && membership.household === null;
  useEffect(() => {
    if (!revoked) return;
    selectScope(PERSONAL);
    showToast({ message: "You no longer have access to that household. Showing Personal." });
  }, [revoked]);

  return (
    <LedgerScopeContext value={{ scope, selectScope, scopeSheetOpen, setScopeSheetOpen }}>
      {children}
    </LedgerScopeContext>
  );
};
