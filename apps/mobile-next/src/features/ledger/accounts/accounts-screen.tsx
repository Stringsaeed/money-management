import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { LegendList } from "@legendapp/list/react-native";

import { useAccountsQuery } from "@/data/ledger-queries";
import { Button } from "@/ui/button";
import { Chip } from "@/ui/chip";
import { EmptyState } from "@/ui/empty-state";
import { Screen } from "@/ui/screen";
import { Surface } from "@/ui/surface";
import { Text } from "@/ui/text";
import { colors, spacing, typography } from "@/ui/design-tokens";
import { formatMoneyMinor } from "@/utils/money";

export interface AccountsScreenProps {
  readonly onOpenAccount?: (id: string) => void;
  readonly onAddAccount?: () => void;
}

export function AccountsScreen({ onOpenAccount, onAddAccount }: AccountsScreenProps) {
  const accounts = useAccountsQuery();
  const [showArchived, setShowArchived] = useState(false);
  const active = accounts.data.filter((account) =>
    showArchived ? account.archived : !account.archived,
  );

  if (accounts.isError)
    return (
      <Screen>
        <EmptyState
          title="Accounts unavailable"
          message="Check your connection and try again."
          onRetry={() => void accounts.retry()}
        />
      </Screen>
    );

  return (
    <Screen>
      <LegendList
        data={active}
        keyExtractor={(item) => item.id}
        estimatedItemSize={84}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="headline">Accounts</Text>
            <View style={styles.headerActions}>
              <Button title="Add account" onPress={onAddAccount} />
              <Chip
                label="Archived"
                selected={showArchived}
                onPress={() => setShowArchived((value) => !value)}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          !accounts.isLoading ? (
            <EmptyState
              title="No accounts"
              message="Create an account to start your ledger."
              action={onAddAccount ? { label: "Add account", onPress: onAddAccount } : undefined}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Surface variant="raised" style={styles.card}>
            <Button title={item.name} variant="ghost" onPress={() => onOpenAccount?.(item.id)} />
            <Text style={styles.meta}>
              {item.type.replace("_", " ")} · {item.currency}
            </Text>
            <Text variant="amount" style={styles.amount}>
              {formatMoneyMinor(item.balanceMinor, item.currency)}
            </Text>
          </Surface>
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
  header: { gap: spacing[2], paddingBottom: spacing[2] },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
    justifyContent: "space-between",
  },
  card: { gap: spacing[1], padding: spacing[4] },
  meta: {
    color: colors.mutedForeground,
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
  },
  amount: { fontSize: typography.textXl },
  separator: { height: spacing[2] },
});
