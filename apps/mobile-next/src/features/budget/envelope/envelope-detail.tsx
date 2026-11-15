import { router } from "expo-router";
import { StyleSheet } from "react-native";
import { LegendList } from "@legendapp/list/react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { V2Transaction } from "@trove/api/v2/contracts";

import { ActionBar, layout, Screen } from "@/ui/trove";

import { TransactionListFooter } from "../../ledger/transactions/transaction-list-footer";
import { CoverMoveSheet } from "../cover/cover-move-sheet";
import { envelopeMoveRequest } from "../cover/cover-move-model";
import { useBudgetCurrency } from "../currency/use-budget-currency";
import { envelopeEmojiOrTag } from "../envelope-emoji";
import { envelopeLines, type ActiveBudgetView, type EnvelopeLine } from "../home/home-model";
import { QuickAddSheet } from "../quick-add/quick-add-sheet";
import { useBudgetRole } from "../role/use-budget-role";

import { codeAmount } from "./envelope-figures";
import { EnvelopeHeader } from "./envelope-header";
import { EnvelopeMenuSheet } from "./envelope-menu-sheet";
import { EnvelopeOverview } from "./envelope-overview";
import { spendingRowDisplay } from "./spending-display";
import { SpendingListStatus } from "./spending-list-status";
import { SpendingRow } from "./spending-row";
import { useEnvelopeSheets } from "./use-envelope-sheets";
import { useEnvelopeSpending } from "./use-envelope-spending";

interface EnvelopeDetailProps {
  readonly view: ActiveBudgetView;
  readonly line: EnvelopeLine;
}

/** Board spending rows are 52pt. */
const ESTIMATED_ROW = 52;

const openTransaction = (transaction: V2Transaction) =>
  router.push(`/transactions/${transaction.id}`);

/** M4 with O1: one envelope's plan against what happened, and what to do when it is over. */
export function EnvelopeDetail({ view, line }: EnvelopeDetailProps) {
  const { envelope, totals } = line;
  const currency = useBudgetCurrency();
  const insets = useSafeAreaInsets();
  const sheets = useEnvelopeSheets();
  const { canAddSpending } = useBudgetRole();
  const spending = useEnvelopeSpending(view, line);
  const { list } = spending;
  const over = totals.leftMinor < 0;
  const today = new Date();

  return (
    <Screen edges={["top"]} style={styles.screen}>
      <EnvelopeHeader
        emoji={envelopeEmojiOrTag(envelope, spending.categoriesById)}
        title={envelope.name}
        onBack={() => router.back()}
        onMore={sheets.openMenu}
      />
      <LegendList
        data={list.data}
        dataKey={list.dataKey}
        extraData={spending.lookupVersion}
        keyExtractor={(transaction) => transaction.id}
        estimatedItemSize={ESTIMATED_ROW}
        recycleItems
        style={styles.list}
        contentContainerStyle={[
          styles.content,
          canAddSpending ? null : { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.6}
        ListHeaderComponent={
          <EnvelopeOverview
            currency={currency}
            line={line}
            spending={spending}
            view={view}
            onOpenTransaction={openTransaction}
          />
        }
        ListEmptyComponent={
          <SpendingListStatus hasCategories={spending.hasCategories} list={list} />
        }
        ListFooterComponent={
          <TransactionListFooter
            count={list.data.length}
            hasNextPage={list.hasNextPage}
            isFetchingNextPage={list.isFetchingNextPage}
            nextPageFailed={list.nextPageFailed}
            onLoadMore={list.loadMore}
          />
        }
        renderItem={({ item }) => (
          <SpendingRow
            display={spendingRowDisplay(
              item,
              {
                category: spending.categoriesById.get(item.categoryId ?? ""),
                account: spending.accountsById.get(item.accountId),
              },
              today,
            )}
            transaction={item}
            onPress={openTransaction}
          />
        )}
      />
      {canAddSpending ? (
        <ActionBar
          secondary={{
            label: "Move money",
            onPress: () =>
              sheets.coverMove.show(
                envelopeMoveRequest(envelopeLines(view), view.current.unassignedMinor, envelope.id),
              ),
          }}
          primary={
            over
              ? {
                  label: `Cover ${codeAmount(-totals.leftMinor, currency)}`,
                  tone: "negative",
                  onPress: () => sheets.coverMove.show({ kind: "cover", targetId: envelope.id }),
                }
              : { label: "Add spending", onPress: sheets.openQuickAdd }
          }
        />
      ) : null}
      <EnvelopeMenuSheet
        line={line}
        open={sheets.menu.open}
        session={sheets.menu.session}
        view={view}
        onDismiss={sheets.closeMenu}
      />
      <QuickAddSheet
        open={sheets.quickAdd.open}
        preselectedEnvelopeId={envelope.id}
        session={sheets.quickAdd.session}
        view={view}
        onCover={(saved) => sheets.coverAfterQuickAdd(saved.envelopeId)}
        onDismiss={sheets.closeQuickAdd}
      />
      <CoverMoveSheet controller={sheets.coverMove} view={view} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Board top padding is 56pt on a 47pt status bar: the inset plus 9.
  screen: { paddingTop: 9 },
  list: { flex: 1 },
  content: { paddingBottom: 24, paddingHorizontal: layout.screenGutter, paddingTop: 16 },
});
