/* oxlint-disable complexity -- the screen coordinates independent loading, empty, error, stat, and list states. */

import { EaseView } from "react-native-ease";
import { StyleSheet, View } from "react-native";
import { LegendList } from "@legendapp/list/react-native";

import { useCategoriesQuery, useHomeQuery, useRecurringQuery } from "@/data/ledger-queries";
import { EmptyState } from "@/ui/empty-state";
import { Screen } from "@/ui/screen";
import { Surface } from "@/ui/surface";
import { Text } from "@/ui/text";
import { colors, spacing, typography } from "@/ui/design-tokens";
import { useReducedMotion } from "@/ui/motion";
import { formatMoneyMinor } from "@/utils/money";

import { HomeStatCard } from "./home-stat-card";
import { HomeTransactionRow } from "./home-transaction-row";

export function HomeScreen() {
  const home = useHomeQuery();
  const reducedMotion = useReducedMotion();
  const categories = useCategoriesQuery();
  const recurring = useRecurringQuery();

  if (home.isLoading)
    return (
      <Screen>
        <Text style={styles.status}>Loading your ledger…</Text>
      </Screen>
    );
  if (home.isError || !home.data) {
    return (
      <Screen>
        <EmptyState
          title="Home is unavailable"
          message="Check your connection and try again."
          onRetry={() => void home.retry()}
        />
      </Screen>
    );
  }

  const recent = home.data.recentTransactions;
  const upcoming = recurring.data.filter((rule) => rule.lifecycle === "active").slice(0, 3);
  const categoryById = new Map(categories.data.map((category) => [category.id, category.name]));

  return (
    <Screen>
      <LegendList
        data={recent}
        keyExtractor={(item) => item.id}
        estimatedItemSize={64}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <EaseView
              initialAnimate={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={
                reducedMotion
                  ? { type: "none" }
                  : { type: "timing", duration: 220, easing: "easeOut" }
              }
            >
              <Text variant="headline" style={styles.title}>
                Home
              </Text>
            </EaseView>
            <Surface style={styles.balanceSurface}>
              <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
              <View style={styles.balanceGroup}>
                {home.data.accounts.map((account) => (
                  <Text key={account.currency} style={styles.balance}>
                    {formatMoneyMinor(account.balanceMinor, account.currency)}
                  </Text>
                ))}
              </View>
              <Text style={styles.balanceDetail}>
                {home.data.accounts.length} account{home.data.accounts.length === 1 ? "" : "s"}
              </Text>
            </Surface>
            <View style={styles.statsRow}>
              {home.data.totals.flatMap((total) => [
                <HomeStatCard
                  key={`${total.currency}:income`}
                  label={`${total.currency} Income`}
                  value={formatMoneyMinor(total.incomeMinor, total.currency)}
                  tone="positive"
                />,
                <HomeStatCard
                  key={`${total.currency}:expense`}
                  label={`${total.currency} Expenses`}
                  value={formatMoneyMinor(total.expenseMinor, total.currency)}
                  tone="negative"
                />,
              ])}
            </View>
            <Text variant="title">Upcoming</Text>
            <View style={styles.upcomingGroup}>
              {upcoming.length === 0 ? (
                <Text style={styles.muted}>No active recurring Rules.</Text>
              ) : (
                upcoming.map((rule) => (
                  <Text key={rule.id} style={styles.upcoming}>
                    {rule.name} · {formatMoneyMinor(rule.amountMinor, rule.currency)}
                  </Text>
                ))
              )}
            </View>
            <Text variant="title">Recent Journal</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState title="No transactions yet" message="Add your first entry from the Ledger." />
        }
        renderItem={({ item }) => (
          <HomeTransactionRow
            transaction={item}
            categoryName={categoryById.get(item.categoryId ?? "")}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    gap: spacing[2],
    paddingBottom: spacing[16],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
  },
  header: { gap: spacing[4] },
  title: { color: colors.ink, fontFamily: typography.fontHeadingNormal, fontStyle: "italic" },
  balanceSurface: { gap: spacing[2], padding: spacing[5] },
  balanceLabel: {
    color: colors.mutedForeground,
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textXs,
    letterSpacing: typography.trackingWide,
  },
  balance: {
    color: colors.ink,
    fontFamily: typography.fontHeadingMedium,
    fontSize: typography.text4xl,
    fontVariant: ["tabular-nums"],
  },
  balanceGroup: { gap: spacing[1] },
  balanceDetail: {
    color: colors.mutedForeground,
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
  },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing[3] },
  muted: {
    color: colors.mutedForeground,
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
  },
  upcoming: {
    color: colors.ink,
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textSm,
  },
  upcomingGroup: { gap: spacing[2] },
  separator: { backgroundColor: colors.ledgerOutline, height: 1 },
  status: { color: colors.mutedForeground, padding: spacing[5] },
});
