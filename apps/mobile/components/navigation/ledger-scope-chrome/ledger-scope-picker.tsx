import { Children, cloneElement, isValidElement, type ReactElement } from "react";

import { openLedgerScopeSheet } from "./ledger-scope-sheet-store";
import type { LedgerScopePickerProps } from "./types";

/**
 * Header-safe trigger. Opens the sheet hosted under BottomSheetProvider.
 * Do not mount ModalBottomSheet here — native-stack headers lack that context.
 */
export function LedgerScopePicker({ scope, children }: LedgerScopePickerProps) {
  const handleOpen = () => {
    if (!scope.canSwitch || !scope.setActiveHousehold) return;
    openLedgerScopeSheet();
  };

  const child = Children.only(children);
  if (!isValidElement(child)) return children;

  return cloneElement(child as ReactElement<{ onPress?: () => void }>, {
    onPress: handleOpen,
  });
}
