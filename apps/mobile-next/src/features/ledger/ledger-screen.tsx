import { StyleSheet, View } from "react-native";

import type { V2Transaction } from "@trove/api/v2/contracts";

import { spacing } from "@/ui/design-tokens";
import { useReducedMotion } from "@/ui/motion";
import { Screen } from "@/ui/screen";

import { LedgerFilterSheet } from "./list/ledger-filter-sheet";
import { LedgerHeader } from "./list/ledger-header";
import { LedgerManageLinks } from "./list/ledger-manage-links";
import { LedgerTransactionList } from "./list/ledger-transaction-list";
import { useLedgerList } from "./list/use-ledger-list";
import { useSearchReveal } from "./list/use-search-reveal";

export interface LedgerScreenProps {
  readonly onAddTransaction?: () => void;
  readonly onOpenTransaction?: (transaction: V2Transaction) => void;
  readonly onOpenAccounts?: () => void;
  readonly onOpenCategories?: () => void;
  readonly onOpenRecurring?: () => void;
}

export function LedgerScreen({
  onAddTransaction,
  onOpenTransaction,
  onOpenAccounts,
  onOpenCategories,
  onOpenRecurring,
}: LedgerScreenProps) {
  const list = useLedgerList();
  const reveal = useSearchReveal(useReducedMotion());

  return (
    <Screen edges={["top"]}>
      <LedgerHeader list={list} searchHidden={reveal.hidden} />
      <LedgerTransactionList
        list={list}
        scrollOffset={reveal.scrollOffset}
        onOpenTransaction={onOpenTransaction}
        onAddTransaction={onAddTransaction}
        header={
          <View style={styles.links}>
            <LedgerManageLinks
              navigation={{ onAddTransaction, onOpenAccounts, onOpenCategories, onOpenRecurring }}
            />
          </View>
        }
      />
      <LedgerFilterSheet list={list} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  links: { paddingTop: spacing[3] },
});
