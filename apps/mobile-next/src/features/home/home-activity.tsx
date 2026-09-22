import { Pressable, StyleSheet, View } from "react-native";
import type { V2Category, V2Transaction } from "@trove/api/v2/contracts";

import { Text } from "@/ui/text";
import { Icon } from "@/ui/icon";
import { spacing, typography } from "@/ui/design-tokens";
import { TilePanel } from "@/ui/tiled-garden/tile-panel";
import { tileColors } from "@/ui/tiled-garden/tile-tokens";
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
  const names = new Map(categories.map((category) => [category.id, category.name]));
  return (
    <TilePanel tone="cream" style={styles.panel}>
      <View style={styles.heading}>
        <View style={styles.copy}>
          <Text style={styles.title}>Latest activity</Text>
          <Text style={styles.subtitle}>
            {household
              ? "Everyone in your household, together."
              : "The latest in your personal ledger."}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View all transactions"
          onPress={onViewAll}
          style={({ pressed }) => [styles.link, pressed && styles.pressed]}
        >
          <Icon name="arrow-right" color={tileColors.ink} size={20} />
        </Pressable>
      </View>
      {transactions.length === 0 ? (
        <Text style={styles.empty}>
          Your next entry starts the story. Add a transaction to see it here.
        </Text>
      ) : (
        transactions.map((transaction) => (
          <HomeTransactionRow
            key={transaction.id}
            transaction={transaction}
            categoryName={names.get(transaction.categoryId ?? "")}
            onPress={onOpen}
          />
        ))
      )}
    </TilePanel>
  );
}

const styles = StyleSheet.create({
  panel: { gap: spacing[1] },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingBottom: spacing[2],
  },
  copy: { flex: 1 },
  title: {
    color: tileColors.ink,
    fontSize: typography.textLg,
    fontFamily: typography.fontBodyBold,
  },
  subtitle: { color: tileColors.muted, fontSize: typography.textXs },
  link: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: tileColors.pink,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: tileColors.grout,
  },
  pressed: { opacity: 0.68 },
  empty: { color: tileColors.muted, fontSize: typography.textSm, paddingVertical: spacing[4] },
});
