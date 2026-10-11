import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import type { V2BudgetPeriod } from "@trove/api/v2/contracts";

import { useCategoriesQuery } from "@/data/ledger-queries";
import { useTransactionPagesQuery } from "@/data/transaction-list-queries";
import { Button } from "@/ui/button";
import { spacing } from "@/ui/design-tokens";
import { Section } from "@/ui/section";
import { Text } from "@/ui/text";

import { TransactionRow } from "../../ledger/transactions/transaction-row";

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
    <Section title="This period">
      {list.isError ? (
        <View style={styles.status}>
          <Text variant="caption">{"Couldn't load these transactions."}</Text>
          <Button title="Retry" variant="secondary" onPress={() => void list.refresh()} />
        </View>
      ) : list.isLoading ? (
        <Text variant="caption">Loading transactions…</Text>
      ) : list.data.length === 0 ? (
        <Text variant="caption">Nothing spent here yet this period.</Text>
      ) : (
        <>
          {list.data.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              category={transaction.categoryId ? byId.get(transaction.categoryId) : undefined}
              onPress={() => router.push(`/transactions/${transaction.id}`)}
            />
          ))}
          {list.hasNextPage ? (
            <Button
              title="Show more"
              variant="secondary"
              loading={list.isFetchingNextPage}
              onPress={list.loadMore}
            />
          ) : null}
        </>
      )}
    </Section>
  );
}

const styles = StyleSheet.create({ status: { gap: spacing[2] } });
