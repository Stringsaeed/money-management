import { StyleSheet, View } from "react-native";
import { LegendList } from "@legendapp/list/react-native";

import type { V2Transaction } from "@trove/api/v2/contracts";

import { colors, layout } from "@/ui/trove";

import { LedgerEntryRow } from "../list/ledger-entry-row";
import { groupTransactions, headerIndices } from "../list/ledger-grouping";
import { ledgerRowDisplay } from "../list/ledger-row-display";
import { LedgerSectionHeader } from "../list/ledger-section-header";
import { TransactionListFooter } from "../transactions/transaction-list-footer";
import { resultsStamp } from "./search-model";
import { SearchMessage } from "./search-message";
import { SearchSkeleton } from "./search-skeleton";
import { SearchStatus } from "./search-status";
import type { LedgerSearchModel } from "./use-ledger-search";

interface SearchResultsProps {
  readonly search: LedgerSearchModel;
  readonly bottomInset: number;
  readonly onOpenTransaction: (transaction: V2Transaction) => void;
}

/** Board rhythm: 14pt between the filters, the results strip, and each month. */
const GAP = 14;

/** Matches grouped by month under sticky stamps, with the results strip above and paging below. */
export function SearchResults({ search, bottomInset, onOpenTransaction }: SearchResultsProps) {
  const { pages, today } = search;
  if (!search.active) return <SearchMessage kind="idle" />;
  if (pages.isLoading) return <SearchSkeleton />;
  if (pages.isError) return <SearchMessage kind="failed" onRetry={() => void search.refresh()} />;
  const items = groupTransactions(pages.data, "month", today, pages.hasNextPage);
  const count = search.summary.data?.count ?? pages.data.length;

  return (
    <LegendList
      data={items}
      dataKey={pages.dataKey}
      extraData={`${search.lookupVersion}|${search.query}`}
      keyExtractor={(item) => item.key}
      getItemType={(item) => item.type}
      estimatedItemSize={60}
      stickyHeaderIndices={headerIndices(items)}
      recycleItems
      style={[styles.list, pages.isStale && styles.stale]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      onEndReached={pages.loadMore}
      onEndReachedThreshold={0.6}
      ListHeaderComponent={
        pages.data.length > 0 ? (
          <View style={styles.status}>
            <SearchStatus
              stamp={resultsStamp(count, search.state.date, today)}
              totals={search.totals}
            />
          </View>
        ) : null
      }
      ListEmptyComponent={<SearchMessage kind="empty" />}
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
        if (item.type === "header") return <LedgerSectionHeader compact header={item} />;
        const transaction = item.transaction;
        return (
          <LedgerEntryRow
            display={ledgerRowDisplay(
              transaction,
              {
                category: search.categoryById.get(transaction.categoryId ?? ""),
                account: search.accountById.get(transaction.accountId),
                toAccount: search.accountById.get(transaction.toAccountId ?? ""),
              },
              { datedFrom: today },
            )}
            highlight={search.query}
            lastInSection={item.lastInSection}
            layout="search"
            onPress={onOpenTransaction}
            transaction={transaction}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  stale: { opacity: 0.55 },
  // Items span the full width so sticky month stamps can; gutters live on each item.
  content: { backgroundColor: colors.bg.canvas, paddingTop: GAP },
  status: { paddingBottom: GAP, paddingHorizontal: layout.screenGutter },
});
