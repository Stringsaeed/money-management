import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { MoneyText } from "@/components/ui/money-text";
import { TransactionGroup } from "@/components/transaction/transaction-group";
import { useAccount } from "@/hooks/use-accounts";
import { useTransactions } from "@/hooks/use-transactions";
import { colors, radii, shadows, spacing, typography } from "@/lib/design-tokens";
import { useUIStore } from "@/stores/ui-store";
import { formatMonth, addMonths } from "@/utils/date";
import type { DayGroup } from "@/types";

function groupByDay(transactions: import("@/types").TransactionWithDetails[]): DayGroup[] {
  const map = new Map<string, DayGroup>();
  for (const t of transactions) {
    if (!map.has(t.date)) {
      map.set(t.date, { date: t.date, transactions: [], totalIncome: 0, totalExpense: 0 });
    }
    const group = map.get(t.date)!;
    group.transactions.push(t);
    if (t.type === "income") group.totalIncome += t.amount;
    else if (t.type === "expense") group.totalExpense += t.amount;
  }
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
}

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: account, isLoading: loadingAccount } = useAccount(id);
  const { selectedYear, selectedMonth, setSelectedMonth } = useUIStore();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { data: transactions = [], isLoading: loadingTxns } = useTransactions({
    year: selectedYear ?? undefined,
    month: selectedMonth ?? undefined,
    accountId: id,
  });

  if (loadingAccount) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    );
  }
  if (!account) return null;

  const groups = groupByDay(transactions);
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const fabShadow = colorScheme === "dark" ? shadows.lg : shadows.md;

  return (
    <ScrollView style={styles.scrollView}>
      <View
        style={[
          styles.header,
          { backgroundColor: account.color, paddingTop: insets.top + spacing[4] },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.accountType}>
          {account.type.replace("_", " ")} · {account.currency}
        </Text>
        <Text style={styles.accountName}>{account.name}</Text>

        <View style={styles.monthNav}>
          <Pressable
            onPress={() => {
              if (!selectedYear || !selectedMonth) return;
              const prev = addMonths(selectedYear, selectedMonth, -1);
              setSelectedMonth(prev.year, prev.month);
            }}
          >
            <Text style={styles.navArrow}>‹</Text>
          </Pressable>
          {!!selectedMonth && !!selectedYear && (
            <Text style={styles.monthLabel}>{formatMonth(selectedYear, selectedMonth)}</Text>
          )}
          <Pressable
            onPress={() => {
              if (!selectedYear || !selectedMonth) return;
              const next = addMonths(selectedYear, selectedMonth, 1);
              setSelectedMonth(next.year, next.month);
            }}
          >
            <Text style={styles.navArrow}>›</Text>
          </Pressable>
        </View>

        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>INCOME</Text>
            <MoneyText
              cents={totalIncome}
              currency={account.currency}
              sign="+"
              style={styles.summaryAmount}
            />
          </View>
          <View>
            <Text style={styles.summaryLabel}>EXPENSES</Text>
            <MoneyText
              cents={totalExpense}
              currency={account.currency}
              sign="-"
              style={styles.summaryAmount}
            />
          </View>
        </View>
      </View>

      <View style={styles.transactionsContainer}>
        {loadingTxns ? (
          <ActivityIndicator style={styles.loadingIndicator} />
        ) : groups.length === 0 ? (
          <Text style={styles.emptyText}>No transactions this month</Text>
        ) : (
          groups.map((g) => <TransactionGroup key={g.date} group={g} currency={account.currency} />)
        )}
      </View>

      <Pressable
        onPress={() => router.push("/transaction/new")}
        style={[styles.fab, { backgroundColor: account.color, boxShadow: fabShadow }]}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  header: {
    paddingBottom: spacing[6],
    paddingHorizontal: spacing[5],
  },
  backButton: {
    marginBottom: spacing[4],
  },
  backText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: typography.textLg,
  },
  accountType: {
    color: "white",
    fontSize: typography.textBase,
    opacity: 0.8,
  },
  accountName: {
    color: "white",
    fontSize: typography.text2xl,
    fontFamily: typography.fontHeadingBold,
    marginTop: spacing[1],
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing[4],
    gap: spacing[4],
  },
  navArrow: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 20,
  },
  monthLabel: {
    color: "white",
    fontSize: 15,
    fontFamily: typography.fontBodySemibold,
    flex: 1,
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    marginTop: spacing[4],
    gap: spacing[5],
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
  },
  summaryAmount: {
    color: "white",
    fontSize: 15,
    fontFamily: typography.fontBodySemibold,
  },
  transactionsContainer: {
    paddingVertical: spacing[2],
  },
  loadingIndicator: {
    marginTop: spacing[8],
  },
  emptyText: {
    textAlign: "center",
    color: colors.mutedForeground,
    marginTop: spacing[12],
  },
  fab: {
    position: "absolute",
    bottom: spacing[8],
    right: spacing[5],
    width: 56,
    height: 56,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  fabText: {
    color: "white",
    fontSize: 28,
    lineHeight: 30,
  },
});
