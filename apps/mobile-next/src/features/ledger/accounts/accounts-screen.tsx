import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { LegendList } from "@legendapp/list/react-native";

import { useAccountsQuery, useLedgerMutations } from "@/data/ledger-queries";
import { Button } from "@/ui/button";
import { Chip } from "@/ui/chip";
import { EmptyState } from "@/ui/empty-state";
import { Screen } from "@/ui/screen";
import { Sheet } from "@/ui/sheet";
import { Surface } from "@/ui/surface";
import { Text } from "@/ui/text";
import { colors, spacing, typography } from "@/ui/design-tokens";
import { formatMoneyMinor } from "@/utils/money";

import { AccountForm } from "./account-form";

export interface AccountsScreenProps {
  readonly onOpenAccount?: (id: string) => void;
}

export function AccountsScreen({ onOpenAccount }: AccountsScreenProps) {
  const accounts = useAccountsQuery();
  const mutations = useLedgerMutations();
  const [formOpen, setFormOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string>();
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
              <Button
                title="Add account"
                onPress={() => {
                  setFormError(undefined);
                  setFormOpen(true);
                }}
              />
              <Chip
                label="Archived"
                selected={showArchived}
                onPress={() => setShowArchived((value) => !value)}
              />
            </View>
            {formError ? <Text style={styles.error}>{formError}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          !accounts.isLoading ? (
            <EmptyState
              title="No accounts"
              message="Create an account to start your ledger."
              onRetry={() => setFormOpen(true)}
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
      <Sheet open={formOpen} onDismiss={() => setFormOpen(false)} snapPoints={["half", "full"]}>
        <AccountForm
          error={formError}
          onCancel={() => setFormOpen(false)}
          busy={busy}
          onSubmit={async (input) => {
            setBusy(true);
            try {
              await mutations.createAccount(input);
              setFormOpen(false);
            } catch (error) {
              setFormError(error instanceof Error ? error.message : "Could not create account.");
            } finally {
              setBusy(false);
            }
          }}
        />
      </Sheet>
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
  error: { color: colors.destructive },
});
