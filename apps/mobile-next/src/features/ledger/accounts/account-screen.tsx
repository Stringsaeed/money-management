import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { LegendList } from "@legendapp/list/react-native";

import { useAccountsQuery, useLedgerMutations, useTransactionsQuery } from "@/data/ledger-queries";
import { Button } from "@/ui/button";
import { EmptyState } from "@/ui/empty-state";
import { Screen } from "@/ui/screen";
import { Sheet } from "@/ui/sheet";
import { Text } from "@/ui/text";
import { colors, spacing, typography } from "@/ui/design-tokens";
import { formatMoneyMinor } from "@/utils/money";

import { AccountForm } from "./account-form";
import { TransactionRow } from "../transactions/transaction-row";

export interface AccountScreenProps {
  readonly id?: string;
  readonly onBack?: () => void;
  readonly onOpenTransaction?: (id: string) => void;
}

export function AccountScreen({ id, onBack, onOpenTransaction }: AccountScreenProps) {
  const accounts = useAccountsQuery();
  const account = accounts.data.find((item) => item.id === id);
  const transactions = useTransactionsQuery({ accountId: id });
  const mutations = useLedgerMutations();
  const [editOpen, setEditOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  if (id === "new") {
    return (
      <Screen style={styles.screen}>
        <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
          <AccountForm
            busy={busy}
            error={error}
            onCancel={onBack}
            onSubmit={async (input) => {
              setBusy(true);
              try {
                await mutations.createAccount(input);
                onBack?.();
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : "Could not create account.");
              } finally {
                setBusy(false);
              }
            }}
          />
        </ScrollView>
      </Screen>
    );
  }
  if (accounts.isLoading)
    return (
      <Screen>
        <Text style={styles.status}>Loading account…</Text>
      </Screen>
    );
  if (!account)
    return (
      <Screen>
        <EmptyState
          title="Account not found"
          message="This account may have been removed."
          onRetry={() => void accounts.retry()}
        />
      </Screen>
    );

  return (
    <Screen>
      <LegendList
        data={transactions.data}
        keyExtractor={(item) => item.id}
        estimatedItemSize={68}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Button title="Back" variant="ghost" onPress={onBack} />
            <Text variant="headline">{account.name}</Text>
            <Text variant="amount">{formatMoneyMinor(account.balanceMinor, account.currency)}</Text>
            <Text style={styles.meta}>
              {account.type.replace("_", " ")} · {account.currency}
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.actions}>
              <Button
                title="Edit"
                variant="secondary"
                onPress={() => {
                  setError(undefined);
                  setEditOpen(true);
                }}
              />
              <Button
                title={account.archived ? "Restore" : "Archive"}
                variant="ghost"
                onPress={() =>
                  void (
                    account.archived
                      ? mutations.restoreAccount(account.id, account.version)
                      : mutations.archiveAccount(account.id, account.version)
                  ).catch((cause) =>
                    setError(cause instanceof Error ? cause.message : "Could not update account."),
                  )
                }
              />
              <Button
                title="Delete"
                variant="destructive"
                onPress={() =>
                  void mutations
                    .deleteAccount(account.id, account.version)
                    .then(onBack)
                    .catch((cause) =>
                      setError(
                        cause instanceof Error ? cause.message : "Could not delete account.",
                      ),
                    )
                }
              />
            </View>
            <Text variant="title">Transactions</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No transactions"
            message="Transactions for this account will appear here."
          />
        }
        renderItem={({ item }) => (
          <TransactionRow
            transaction={item}
            onPress={(transaction) => onOpenTransaction?.(transaction.id)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <Sheet open={editOpen} onDismiss={() => setEditOpen(false)} snapPoints={["half", "full"]}>
        <AccountForm
          account={account}
          busy={busy}
          error={error}
          onCancel={() => setEditOpen(false)}
          onSubmit={async (input) => {
            setBusy(true);
            try {
              await mutations.updateAccount(account.id, input, account.version);
              setEditOpen(false);
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "Could not save account.");
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
  screen: { paddingHorizontal: spacing[5], paddingTop: spacing[4] },
  formContent: { paddingBottom: spacing[16] },
  content: {
    gap: spacing[3],
    paddingBottom: spacing[16],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
  },
  header: { gap: spacing[3] },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  meta: {
    color: colors.mutedForeground,
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
  },
  separator: { backgroundColor: colors.ledgerOutline, height: 1 },
  status: { color: colors.mutedForeground, padding: spacing[5] },
  error: { color: colors.destructive },
});
