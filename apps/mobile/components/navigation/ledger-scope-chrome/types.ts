import type { LedgerScope } from "@/modules/access";

export interface LedgerScopePickerProps {
  readonly scope: LedgerScope;
  readonly children: React.ReactElement;
}
