import { useEffect, useRef, useState, type ReactElement } from "react";
import { StyleSheet } from "react-native";
import { LegendList, type LegendListRef } from "@legendapp/list/react-native";

import type { V2Transaction } from "@trove/api/v2/contracts";

import { colors } from "@/ui/trove";

import { TransactionListFooter } from "../transactions/transaction-list-footer";
import { LedgerEntryRow } from "./ledger-entry-row";
import { groupTransactions, headerIndices } from "./ledger-grouping";
import { LedgerListEmpty } from "./ledger-list-empty";
import { ledgerRowDisplay } from "./ledger-row-display";
import { LedgerSectionHeader } from "./ledger-section-header";
import type { LedgerListModel } from "./use-ledger-list";

interface LedgerTransactionListProps {
  readonly list: LedgerListModel;
  readonly header: ReactElement;
  /** Clears the floating tab bar under the last entry. */
  readonly bottomInset: number;
  readonly onOpenTransaction?: (transaction: V2Transaction) => void;
  readonly onAddTransaction?: () => void;
}

/** Board rows are 62pt; day stamps 30pt. */
const ESTIMATED_ROW = 62;

/** Server-paged Transactions grouped by day, with sticky day stamps and a paging footer. */
export function LedgerTransactionList({
  list,
  header,
  bottomInset,
  onOpenTransaction,
  onAddTransaction,
}: LedgerTransactionListProps) {
  const { pages } = list;
  const items = groupTransactions(pages.data, "day", new Date(), pages.hasNextPage);
  const listRef = useRef<LegendListRef>(null);
  const shownKey = useRef(pages.dataKey);
  // Only a pull shows the refresh spinner; background refetches stay silent.
  const [pulling, setPulling] = useState(false);

  // A new filter's results are a different list: start them from the top.
  useEffect(() => {
    if (shownKey.current === pages.dataKey) return;
    shownKey.current = pages.dataKey;
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [pages.dataKey]);

  return (
    <LegendList
      ref={listRef}
      data={items}
      // Tells the list a filter change is a new dataset, so cached layout is not reused.
      dataKey={pages.dataKey}
      // Rows read Account and Category names outside `data`; re-render when those change.
      extraData={list.lookupVersion}
      keyExtractor={(item) => item.key}
      getItemType={(item) => item.type}
      estimatedItemSize={ESTIMATED_ROW}
      stickyHeaderIndices={headerIndices(items)}
      recycleItems
      style={[styles.list, pages.isStale && styles.stale]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshing={pulling}
      onRefresh={() => {
        setPulling(true);
        void list.refresh().finally(() => setPulling(false));
      }}
      onEndReached={pages.loadMore}
      onEndReachedThreshold={0.6}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <LedgerListEmpty
          currency={list.accounts[0]?.currency ?? null}
          failed={pages.isError}
          filtered={list.chips.length > 0}
          onRetry={() => void list.refresh()}
          onClearFilters={list.clear}
          onAddTransaction={onAddTransaction}
        />
      }
      ListFooterComponent={
        <TransactionListFooter
          count={pages.data.length}
          hasNextPage={pages.hasNextPage}
          isFetchingNextPage={pages.isFetchingNextPage}
          nextPageFailed={pages.nextPageFailed}
          onLoadMore={pages.loadMore}
        />
      }
      renderItem={({ item }) => {
        if (item.type === "header") return <LedgerSectionHeader header={item} />;
        const transaction = item.transaction;
        return (
          <LedgerEntryRow
            transaction={transaction}
            lastInSection={item.lastInSection}
            display={ledgerRowDisplay(transaction, {
              category: list.categoryById.get(transaction.categoryId ?? ""),
              account: list.accountById.get(transaction.accountId),
              toAccount: list.accountById.get(transaction.toAccountId ?? ""),
            })}
            onPress={onOpenTransaction}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  stale: { opacity: 0.55 },
  // Horizontal gutters live on each item so sticky day stamps span the full width.
  content: { backgroundColor: colors.bg.canvas },
});
