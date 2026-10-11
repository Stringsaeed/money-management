import { useEffect, useState, type ReactNode } from "react";
import type { V2LedgerScope } from "@trove/api/v2/contracts";

import { track } from "@/features/analytics";
import {
  cancelBudgetReminders,
  ledgerReminderPrefix,
} from "@/features/budget/reminders/notifications";
import { useHouseholdMembership } from "@/features/household/use-household-membership";
import { showToast } from "@/ui/trove";

import { LedgerScopeContext } from "./ledger-scope-context";

const PERSONAL: V2LedgerScope = { kind: "personal" };

interface LedgerScopeProviderProps {
  readonly identityKey: string;
  readonly children: ReactNode;
}

export const LedgerScopeProvider = ({ identityKey, children }: LedgerScopeProviderProps) => {
  const [scope, setScope] = useState<V2LedgerScope>(PERSONAL);
  const selectScope = (next: V2LedgerScope) => {
    const same =
      next.kind === scope.kind &&
      (next.kind !== "household" ||
        (scope.kind === "household" && next.householdId === scope.householdId));
    setScope(next);
    if (!same) track("ledger_switched", { to: next.kind });
  };
  const [scopeSheetOpen, setScopeSheetOpen] = useState(false);
  const membership = useHouseholdMembership(scope.kind === "household" ? scope.householdId : null);

  // Revoked access (removed, or left on another device) never leaves the app on a household it
  // can no longer read: go back to Personal, say why, and drop that household's budget reminders.
  const revokedScope =
    scope.kind === "household" && membership.known && membership.household === null ? scope : null;
  useEffect(() => {
    if (!revokedScope) return;
    const prefix = ledgerReminderPrefix({ identityKey, scope: revokedScope });
    cancelBudgetReminders((identifier) => identifier.startsWith(prefix)).catch((cause: unknown) =>
      console.warn("Budget reminders for a household you left could not be cancelled.", cause),
    );
    setScope(PERSONAL);
    showToast({ message: "You no longer have access to that household. Showing Personal." });
  }, [revokedScope, identityKey]);

  return (
    <LedgerScopeContext value={{ scope, selectScope, scopeSheetOpen, setScopeSheetOpen }}>
      {children}
    </LedgerScopeContext>
  );
};
