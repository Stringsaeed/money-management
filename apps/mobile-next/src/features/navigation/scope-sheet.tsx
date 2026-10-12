import type { V2LedgerScope } from "@trove/api/v2/contracts";

import type { HouseholdDetail } from "@/features/household/household-client";
import { Sheet } from "@/ui/trove";

import { ScopeSheetBody } from "./scope-sheet-body";

interface ScopeSheetProps {
  readonly open: boolean;
  readonly onDismiss: () => void;
  readonly scope: V2LedgerScope;
  readonly household: HouseholdDetail | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly onSelect: (scope: V2LedgerScope) => void;
  readonly onOpenHousehold: () => void;
  readonly onOpenSettings: () => void;
}

/**
 * H1, shown app-wide from the tab bar's scope button. The body mounts only while the sheet
 * does, so its budget read (for Safe to spend) runs only when someone opens it.
 */
export function ScopeSheet({ open, onDismiss, ...body }: ScopeSheetProps) {
  return (
    <Sheet open={open} onDismiss={onDismiss} testID="ledger-scope-sheet">
      <ScopeSheetBody {...body} />
    </Sheet>
  );
}
