import { StyleSheet, View } from "react-native";
import type { V2Category, V2Transaction } from "@trove/api/v2/contracts";

import { Button, Card, layout, space, Text } from "@/ui/trove";
import { HomeTransactionRow } from "./home-transaction-row";

interface HomeActivityProps {
  readonly transactions: readonly V2Transaction[];
  readonly categories: readonly V2Category[];
  readonly household: boolean;
  readonly onOpen: (transaction: V2Transaction) => void;
  readonly onViewAll: () => void;
}

export function HomeActivity({
  transactions,
  categories,
  household,
  onOpen,
  onViewAll,
}: HomeActivityProps) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  return (
    <Card style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.copy}>
          <Text variant="titleSm">Latest activity</Text>
          <Text tone="secondary" variant="bodySm">
            {household
              ? "Everyone in your household, together."
              : "The latest in your personal ledger."}
          </Text>
        </View>
        <Button
          accessibilityLabel="View all transactions"
          label="View all"
          onPress={onViewAll}
          size="sm"
          variant="tertiary"
        />
      </View>
      {transactions.length === 0 ? (
        <Text style={styles.empty} tone="secondary">
          Your next entry starts the story. Add a transaction to see it here.
        </Text>
      ) : (
        transactions.map((transaction) => (
          <HomeTransactionRow
            key={transaction.id}
            transaction={transaction}
            category={byId.get(transaction.categoryId ?? "")}
            onPress={onOpen}
          />
        ))
      )}
    </Card>
  );
}

// TransactionRow carries its own horizontal padding, so the card gives up its own.
const styles = StyleSheet.create({
  card: { paddingHorizontal: 0, paddingBottom: space[2] },
  heading: {
    alignItems: "center",
    flexDirection: "row",
    gap: space[2],
    paddingBottom: space[2],
    paddingHorizontal: layout.cardPadding,
  },
  copy: { flex: 1 },
  empty: { paddingHorizontal: layout.cardPadding, paddingVertical: space[4] },
});
