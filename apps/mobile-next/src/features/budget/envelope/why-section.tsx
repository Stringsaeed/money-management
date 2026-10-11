import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import type { V2Category, V2Transaction } from "@trove/api/v2/contracts";

import { space, Text } from "@/ui/trove";

import { LedgerRow } from "../../ledger/list/ledger-row";
import { ledgerRowDisplay } from "../../ledger/list/ledger-row-display";

import { largestTransactions } from "./envelope-model";

interface WhySectionProps {
  readonly transactions: readonly V2Transaction[];
  readonly categories: ReadonlyMap<string, V2Category>;
}

/** O1 "Why": the largest expenses this period. */
export function WhySection({ transactions, categories }: WhySectionProps) {
  const largest = largestTransactions(transactions);
  if (largest.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text variant="titleMd">Why</Text>
      {largest.map((transaction) => (
        <LedgerRow
          key={transaction.id}
          transaction={transaction}
          display={ledgerRowDisplay(transaction, {
            category: transaction.categoryId ? categories.get(transaction.categoryId) : undefined,
          })}
          onPress={() => router.push(`/transactions/${transaction.id}`)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space[3] },
});
