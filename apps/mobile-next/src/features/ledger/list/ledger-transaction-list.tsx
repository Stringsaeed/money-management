import { useEffect, useRef, useState, type ReactElement } from "react";
import { StyleSheet } from "react-native";
import type { LegendListRef } from "@legendapp/list/react-native";
import { AnimatedLegendList } from "@legendapp/list/reanimated";
// oxlint-disable-next-line no-restricted-imports -- Only the SharedValue type, fed by the list's UI-thread scroll offset.
import type { SharedValue } from "react-native-reanimated";

import type { V2Transaction } from "@trove/api/v2/contracts";

import { colors } from "@/ui/design-tokens";

import { TransactionListFooter } from "../transactions/transaction-list-footer";
import { groupTransactions, headerIndices } from "./ledger-grouping";
import { LEDGER_INSET } from "./ledger-header";
import { LedgerListEmpty } from "./ledger-list-empty";
import { LedgerRow } from "./ledger-row";
import { ledgerRowDisplay } from "./ledger-row-display";
import { LedgerSectionHeader } from "./ledger-section-header";
import type { LedgerListModel } from "./use-ledger-list";

interface LedgerTransactionListProps {
  readonly list: LedgerListModel;
  readonly scrollOffset: SharedValue<number>;
  readonly header: ReactElement;
  readonly onOpenTransaction?: (transaction: V2Transaction) => void;
  readonly onAddTransaction?: () => void;
}

/** Server-paged Transactions grouped by day, with sticky day headers and a paging footer. */
export function LedgerTransactionList({
  list,
  scrollOffset,
  header,
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
    <AnimatedLegendList
      ref={listRef}
      data={items}
      // Tells the list a filter change is a new dataset, so cached layout is not reused.
      dataKey={pages.dataKey}
      // Rows read Account and Category names outside `data`; re-render when those change.
      extraData={list.lookupVersion}
      keyExtractor={(item) => item.key}
      getItemType={(item) => item.type}
      estimatedItemSize={64}
      stickyHeaderIndices={headerIndices(items)}
      sharedValues={{ scrollOffset }}
      recycleItems
      style={[styles.list, pages.isStale && styles.stale]}
      contentContainerStyle={styles.content}
      keyboardDismissMode="on-drag"
      refreshing={pulling}
      onRefresh={() => {
        setPulling(true);
        void pages.refresh().finally(() => setPulling(false));
      }}
      onEndReached={pages.loadMore}
      onEndReachedThreshold={0.6}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <LedgerListEmpty
          loading={pages.isLoading}
          failed={pages.isError}
          filtered={list.chips.length > 0}
          onRetry={() => void pages.refresh()}
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
          <LedgerRow
            transaction={transaction}
            display={ledgerRowDisplay(transaction, {
              category: list.categoryById.get(transaction.categoryId ?? ""),
              account: list.accountById.get(transaction.accountId),
              toAccount: list.accountById.get(transaction.toAccountId ?? ""),
            })}
            divider={!item.lastInSection}
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
  content: {
    backgroundColor: colors.background,
    paddingBottom: 140,
    paddingHorizontal: LEDGER_INSET,
  },
});
