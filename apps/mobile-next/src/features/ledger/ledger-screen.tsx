import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { LegendList } from "@legendapp/list/react-native";

import type { V2Transaction } from "@trove/api/v2/contracts";

import { useAccountsQuery, useCategoriesQuery, useTransactionsQuery } from "@/data/ledger-queries";
import { Button } from "@/ui/button";
import { Chip } from "@/ui/chip";
import { EmptyState } from "@/ui/empty-state";
import { Screen } from "@/ui/screen";
import { Section } from "@/ui/section";
import { Text } from "@/ui/text";
import { colors, spacing, typography } from "@/ui/design-tokens";

import { TransactionRow } from "./transactions/transaction-row";

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
  const [accountId, setAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [kind, setKind] = useState<V2Transaction["kind"] | null>(null);
  const transactions = useTransactionsQuery({ accountId, categoryId, kind });
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  const categoryById = new Map(categories.data.map((category) => [category.id, category]));

  if (transactions.isError) {
    return (
      <Screen>
        <EmptyState
          title="Ledger is unavailable"
          message="Check your connection and try again."
          onRetry={() => void transactions.retry()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <LegendList
        data={transactions.data}
        keyExtractor={(item) => item.id}
        estimatedItemSize={68}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="headline" style={styles.title}>
              Ledger
            </Text>
            <View style={styles.actionRow}>
              <Button title="Add transaction" onPress={onAddTransaction} />
              <Button title="Accounts" variant="secondary" onPress={onOpenAccounts} />
            </View>
            <Section title="Filter">
              <View style={styles.chips}>
                <Chip label="All" selected={!kind} onPress={() => setKind(null)} />
                <Chip
                  label="Income"
                  selected={kind === "income"}
                  onPress={() => setKind(kind === "income" ? null : "income")}
                />
                <Chip
                  label="Expenses"
                  selected={kind === "expense"}
                  onPress={() => setKind(kind === "expense" ? null : "expense")}
                />
                <Chip
                  label="Transfers"
                  selected={kind === "transfer"}
                  onPress={() => setKind(kind === "transfer" ? null : "transfer")}
                />
              </View>
              <View style={styles.chips}>
                {accounts.data
                  .filter((account) => !account.archived)
                  .slice(0, 6)
                  .map((account) => (
                    <Chip
                      key={account.id}
                      label={account.name}
                      selected={accountId === account.id}
                      onPress={() => setAccountId(accountId === account.id ? null : account.id)}
                    />
                  ))}
              </View>
              <View style={styles.chips}>
                {categories.data
                  .filter((category) => !category.archived)
                  .slice(0, 6)
                  .map((category) => (
                    <Chip
                      key={category.id}
                      label={category.name}
                      selected={categoryId === category.id}
                      onPress={() => setCategoryId(categoryId === category.id ? null : category.id)}
                    />
                  ))}
              </View>
            </Section>
            <View style={styles.links}>
              <Button title="Categories" variant="ghost" onPress={onOpenCategories} />
              <Button title="Recurring" variant="ghost" onPress={onOpenRecurring} />
            </View>
          </View>
        }
        ListEmptyComponent={
          !transactions.isLoading ? (
            <EmptyState
              title="No transactions"
              message="Add an entry to start your ledger."
              onRetry={onAddTransaction}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <TransactionRow
            transaction={item}
            category={categoryById.get(item.categoryId ?? "")}
            onPress={onOpenTransaction}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing[2],
    paddingBottom: spacing[16],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
  },
  header: { gap: spacing[4] },
  title: { color: colors.ink, fontFamily: typography.fontHeadingNormal, fontStyle: "italic" },
  actionRow: { flexDirection: "row", gap: spacing[2] },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  links: { flexDirection: "row", gap: spacing[2] },
  separator: { backgroundColor: colors.ledgerOutline, height: 1 },
});
