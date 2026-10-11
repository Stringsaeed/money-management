import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import type { V2BudgetPeriod } from "@trove/api/v2/contracts";

import { useCategoriesQuery } from "@/data/ledger-queries";
import { useTransactionPagesQuery } from "@/data/transaction-list-queries";
import { Button, space, Text } from "@/ui/trove";

import { LedgerRow } from "../../ledger/list/ledger-row";
import { ledgerRowDisplay } from "../../ledger/list/ledger-row-display";

interface EnvelopeTransactionsProps {
  /** Never empty: an empty filter would list every transaction. */
  readonly categoryIds: readonly string[];
  readonly period: V2BudgetPeriod;
}

/** This period's expenses in the envelope's categories, newest first. */
export function EnvelopeTransactions({ categoryIds, period }: EnvelopeTransactionsProps) {
  const list = useTransactionPagesQuery({
    categoryIds,
    kinds: ["expense"],
    from: period.start,
    to: period.end,
  });
  const categories = useCategoriesQuery();
  const byId = new Map(categories.data.map((category) => [category.id, category]));

  return (
    <View style={styles.section}>
      <Text variant="titleMd">This period</Text>
      {list.isError ? (
        <View style={styles.status}>
          <Text tone="secondary" variant="bodySm">
            {"Couldn't load these transactions."}
          </Text>
          <Button fullWidth label="Retry" variant="secondary" onPress={() => void list.refresh()} />
        </View>
      ) : list.isLoading ? (
        <Text tone="secondary" variant="bodySm">
          Loading transactions…
        </Text>
      ) : list.data.length === 0 ? (
        <Text tone="secondary" variant="bodySm">
          Nothing spent here yet this period.
        </Text>
      ) : (
        <>
          {list.data.map((transaction) => (
            <LedgerRow
              key={transaction.id}
              transaction={transaction}
              display={ledgerRowDisplay(transaction, {
                category: transaction.categoryId ? byId.get(transaction.categoryId) : undefined,
              })}
              onPress={() => router.push(`/transactions/${transaction.id}`)}
            />
          ))}
          {list.hasNextPage ? (
            <Button
              fullWidth
              label="Show more"
              variant="secondary"
              loading={list.isFetchingNextPage}
              onPress={list.loadMore}
            />
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space[3] },
  status: { gap: space[2] },
});
