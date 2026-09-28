import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { LegendList } from "@legendapp/list/react-native";

import { useAccountsQuery } from "@/data/ledger-queries";
import { useTransactionPagesQuery } from "@/data/transaction-list-queries";
import { useLedgerMutationsWithSound } from "@/features/sound";
import { Button } from "@/ui/button";
import { EmptyState } from "@/ui/empty-state";
import { Screen } from "@/ui/screen";
import { Text } from "@/ui/text";
import { colors, spacing, typography } from "@/ui/design-tokens";
import { formatMoneyMinor } from "@/utils/money";

import { TransactionListFooter } from "../transactions/transaction-list-footer";
import { TransactionRow } from "../transactions/transaction-row";
import { confirmLedgerDeletion } from "../delete-confirmation";

export interface AccountScreenProps {
  readonly id?: string;
  readonly onBack?: () => void;
  readonly onEdit?: () => void;
  readonly onOpenTransaction?: (id: string) => void;
}

export function AccountScreen({ id, onBack, onEdit, onOpenTransaction }: AccountScreenProps) {
  const accounts = useAccountsQuery();
  const account = accounts.data.find((item) => item.id === id);
  const transactions = useTransactionPagesQuery({ accountIds: id ? [id] : [] });
  const mutations = useLedgerMutationsWithSound();
  const [error, setError] = useState<string>();
  const [deleteBusy, setDeleteBusy] = useState(false);

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
                disabled={deleteBusy}
                onPress={() => {
                  setError(undefined);
                  onEdit?.();
                }}
              />
              <Button
                title={account.archived ? "Restore" : "Archive"}
                variant="ghost"
                disabled={deleteBusy}
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
                title="Delete account"
                variant="destructive"
                loading={deleteBusy}
                disabled={deleteBusy}
                onPress={() =>
                  confirmLedgerDeletion("account", account.name, () => {
                    setError(undefined);
                    setDeleteBusy(true);
                    void mutations
                      .deleteAccount(account.id, account.version)
                      .then(onBack)
                      .catch((cause) =>
                        setError(
                          cause instanceof Error
                            ? cause.message
                            : "Could not delete account. Try again.",
                        ),
                      )
                      .finally(() => setDeleteBusy(false));
                  })
                }
              />
            </View>
            <Text variant="title">Transactions</Text>
          </View>
        }
        onEndReached={transactions.loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          <TransactionListFooter
            count={transactions.data.length}
            hasNextPage={transactions.hasNextPage}
            isFetchingNextPage={transactions.isFetchingNextPage}
            nextPageFailed={transactions.nextPageFailed}
            onLoadMore={transactions.loadMore}
          />
        }
        ListEmptyComponent={
          transactions.isLoading ? null : transactions.isError ? (
            <EmptyState
              title="Transactions are unavailable"
              message="Check your connection and try again."
              onRetry={() => void transactions.refresh()}
            />
          ) : (
            <EmptyState
              title="No transactions"
              message="Transactions for this account will appear here."
            />
          )
        }
        renderItem={({ item }) => (
          <TransactionRow
            transaction={item}
            onPress={(transaction) => onOpenTransaction?.(transaction.id)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
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
