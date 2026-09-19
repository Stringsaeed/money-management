import { useLedgerSourceSelection } from "@/modules/ledger-data-source/provider";

import type { AccessState, LedgerSelection, MembershipSummary } from "./types";
import { useAccess } from "./use-access";

export type LedgerScopeKind = "personal" | "household" | "local_anonymous";

export interface LedgerScope {
  readonly kind: LedgerScopeKind;
  readonly selection: LedgerSelection;
  readonly householdId: string | null;
  readonly householdName: string | null;
  readonly canSwitch: boolean;
  readonly availableHouseholds: readonly MembershipSummary[];
  readonly setActiveHousehold: ((householdId: string | null) => Promise<void>) | null;
}

/**
 * Provides a unified view of the current ledger scope for UI components.
 *
 * - `kind`: "personal" (signed-in, personal ledger), "household" (signed-in,
 *   household ledger), or "local_anonymous" (not signed in).
 * - `selection`: the raw LedgerSelection from AccessState.
 * - `householdId` / `householdName`: populated only when kind is "household".
 * - `canSwitch`: true when the user has memberships to switch between.
 * - `availableHouseholds`: list of households the user can switch to.
 * - `setActiveHousehold`: function to switch ledgers (null when not signed in).
 */
export function useLedgerScope(): LedgerScope {
  const access = useAccess();
  const source = useLedgerSourceSelection();

  return deriveLedgerScope(access, source.kind === "synced" ? source.ledger.householdId : null);
}

function deriveLedgerScope(access: AccessState, sourceHouseholdId: string | null): LedgerScope {
  if (access.kind !== "signed_in") {
    return {
      kind: "local_anonymous",
      selection: { kind: "personal" },
      householdId: null,
      householdName: null,
      canSwitch: false,
      availableHouseholds: [],
      setActiveHousehold: null,
    };
  }

  const selection = access.selection;
  const memberships = access.memberships;
  const canSwitch = memberships.length > 0;

  if (selection.kind === "household") {
    const membership = memberships.find((m) => m.householdId === selection.householdId);
    return {
      kind: "household",
      selection,
      householdId: selection.householdId,
      householdName: membership?.name ?? null,
      canSwitch,
      availableHouseholds: memberships,
      setActiveHousehold: access.setActiveHousehold,
    };
  }

  return {
    kind: "personal",
    selection,
    householdId: null,
    householdName: null,
    canSwitch,
    availableHouseholds: memberships,
    setActiveHousehold: access.setActiveHousehold,
  };
}
