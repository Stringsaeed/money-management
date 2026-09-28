import type { ReactElement } from "react";
import { StyleSheet } from "react-native";
import { LegendList } from "@legendapp/list/react-native";

import type { V2Transaction } from "@trove/api/v2/contracts";

import { colors, spacing } from "@/ui/design-tokens";

import { TransactionListFooter } from "../transactions/transaction-list-footer";
import { groupTransactions, headerIndices, type LedgerGrouping } from "./ledger-grouping";
import { LedgerListEmpty } from "./ledger-list-empty";
import { LedgerRow } from "./ledger-row";
import { ledgerRowDisplay } from "./ledger-row-display";
import { LedgerSectionHeader } from "./ledger-section-header";
import { LedgerStatementRow } from "./ledger-statement-row";
import type { LedgerListModel } from "./use-ledger-list";

export const LEDGER_INSET = spacing[5];

interface LedgerTransactionListProps {
  readonly list: LedgerListModel;
  readonly header: ReactElement;
  readonly grouping: LedgerGrouping;
  readonly density: "comfortable" | "statement";
  readonly onOpenTransaction?: (transaction: V2Transaction) => void;
  readonly onAddTransaction?: () => void;
}

/** Server-paged, date-sectioned Transaction list with sticky headers and paging footer. */
export function LedgerTransactionList({
  list,
  header,
  grouping,
  density,
  onOpenTransaction,
  onAddTransaction,
}: LedgerTransactionListProps) {
  const { pages } = list;
  const items = groupTransactions(pages.data, grouping, new Date());
  return (
    <LegendList
      data={items}
      keyExtractor={(item) => item.key}
      getItemType={(item) => (item.type === "header" ? "header" : density)}
      estimatedItemSize={density === "statement" ? 53 : 64}
      stickyHeaderIndices={headerIndices(items)}
      recycleItems
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      refreshing={pages.isRefreshing}
      onRefresh={() => void pages.refresh()}
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
        if (item.type === "header")
          return (
            <LedgerSectionHeader header={item} tone={grouping === "month" ? "month" : "day"} />
          );
        const transaction = item.transaction;
        const display = ledgerRowDisplay(transaction, {
          category: list.categoryById.get(transaction.categoryId ?? ""),
          account: list.accountById.get(transaction.accountId),
          toAccount: list.accountById.get(transaction.toAccountId ?? ""),
          showDate: grouping === "month" && density === "comfortable",
        });
        return density === "statement" ? (
          <LedgerStatementRow
            transaction={transaction}
            display={display}
            onPress={onOpenTransaction}
          />
        ) : (
          <LedgerRow
            transaction={transaction}
            display={display}
            divider={!item.lastInSection}
            onPress={onOpenTransaction}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: colors.background,
    paddingBottom: 140,
    paddingHorizontal: LEDGER_INSET,
  },
});
