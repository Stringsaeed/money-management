import type { ReactNode } from "react";

import type { V2Transaction } from "@trove/api/v2/contracts";

import type { LedgerNavigation } from "../ledger-manage-links";
import type { LedgerListModel } from "../use-ledger-list";

export interface LedgerVariantProps {
  readonly list: LedgerListModel;
  readonly navigation: LedgerNavigation;
  readonly onOpenTransaction?: (transaction: V2Transaction) => void;
  /** Design-review layout switcher, rendered above the variant's own header. */
  readonly switcher: ReactNode;
}
