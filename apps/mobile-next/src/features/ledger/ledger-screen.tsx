import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { V2Transaction } from "@trove/api/v2/contracts";

import { Screen } from "@/ui/trove";

import { LedgerFilterSheet } from "./list/ledger-filter-sheet";
import { LedgerHeader } from "./list/ledger-header";
import { LedgerListHeader } from "./list/ledger-list-header";
import { LedgerListSkeleton } from "./list/ledger-list-skeleton";
import { LedgerTransactionList } from "./list/ledger-transaction-list";
import { useLedgerList } from "./list/use-ledger-list";

export interface LedgerScreenProps {
  readonly onAddTransaction?: () => void;
  readonly onOpenTransaction?: (transaction: V2Transaction) => void;
  readonly onOpenAccounts?: () => void;
  readonly onOpenCategories?: () => void;
  readonly onOpenRecurring?: () => void;
}

/** The floating tab bar plus the board's breathing room above it, over the bottom inset. */
const TAB_BAR_CLEARANCE = 96;

/** Ledger tab: the "ledger feature" board — search, shortcuts, the month's totals, then days. */
export function LedgerScreen({
  onAddTransaction,
  onOpenTransaction,
  onOpenAccounts,
  onOpenCategories,
  onOpenRecurring,
}: LedgerScreenProps) {
  const list = useLedgerList();
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom + TAB_BAR_CLEARANCE;
  const loading = list.pages.isLoading;

  return (
    <Screen edges={["top"]}>
      <LedgerHeader
        applied={list.chips.length}
        loading={loading}
        onOpenFilters={list.openFilters}
      />
      {loading ? (
        <LedgerListSkeleton bottomInset={bottomInset} />
      ) : (
        <LedgerTransactionList
          bottomInset={bottomInset}
          header={
            <LedgerListHeader
              list={list}
              navigation={{ onAddTransaction, onOpenAccounts, onOpenCategories, onOpenRecurring }}
              showTotals={list.pages.data.length > 0}
            />
          }
          list={list}
          onAddTransaction={onAddTransaction}
          onOpenTransaction={onOpenTransaction}
        />
      )}
      <LedgerFilterSheet list={list} />
    </Screen>
  );
}
