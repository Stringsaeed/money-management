import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { LegendList } from "@legendapp/list/react-native";

import { useAccountsQuery, useCategoriesQuery } from "@/data/ledger-queries";
import { useTransactionPagesQuery } from "@/data/transaction-list-queries";
import { useLedgerMutationsWithSound } from "@/features/sound";
import {
  BalanceCard,
  Banner,
  Button,
  colors,
  EmptyState,
  Header,
  layout,
  Screen,
  SectionHeader,
  Skeleton,
  space,
  TransactionRow,
} from "@/ui/trove";

import { TransactionListFooter } from "../transactions/transaction-list-footer";
import { confirmLedgerDeletion } from "../delete-confirmation";
import { accountTransactionDisplay } from "./account-transaction-display";
import { accountTypeOption } from "./account-display";

export interface AccountScreenProps {
  readonly id?: string;
  readonly onBack?: () => void;
  readonly onEdit?: () => void;
  readonly onOpenTransaction?: (id: string) => void;
}

export function AccountScreen({ id, onBack, onEdit, onOpenTransaction }: AccountScreenProps) {
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  const account = accounts.data.find((item) => item.id === id);
  const transactions = useTransactionPagesQuery({ accountIds: id ? [id] : [] });
  const mutations = useLedgerMutationsWithSound();
  const [error, setError] = useState<string>();
  const [deleteBusy, setDeleteBusy] = useState(false);

  if (accounts.isLoading)
    return (
      <Screen>
        <View style={styles.top}>
          <Header variant="compact" title="Account" onBack={onBack} />
        </View>
        <View accessibilityState={{ busy: true }} style={styles.loading}>
          <Skeleton height={32} width="60%" />
          <Skeleton height={96} />
        </View>
      </Screen>
    );
  if (!account)
    return (
      <Screen>
        <View style={styles.top}>
          <Header variant="compact" title="Account" onBack={onBack} />
        </View>
        <View style={styles.loading}>
          <EmptyState
            title="Account not found"
            message="This account may have been removed."
            icon="info"
            actionLabel="Try again"
            onAction={() => void accounts.retry()}
          />
        </View>
      </Screen>
    );

  const typeLabel = accountTypeOption(account.type).label;

  return (
    <Screen>
      <View style={styles.top}>
        <Header variant="compact" title={account.name} onBack={onBack} />
      </View>
      <LegendList
        data={transactions.data}
        keyExtractor={(item) => item.id}
        estimatedItemSize={64}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <BalanceCard
              label={typeLabel}
              minor={account.balanceMinor}
              currency={account.currency}
              caption={`${typeLabel} · ${account.currency}`}
            />
            {error ? <Banner tone="negative" message={error} /> : null}
            <View style={styles.actions}>
              <Button
                label="Edit"
                variant="secondary"
                size="sm"
                disabled={deleteBusy}
                onPress={() => {
                  setError(undefined);
                  onEdit?.();
                }}
              />
              <Button
                label={account.archived ? "Restore" : "Archive"}
                variant="tertiary"
                size="sm"
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
                label="Delete account"
                variant="delete"
                size="sm"
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
            <SectionHeader title="Transactions" />
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
              icon="info"
              actionLabel="Try again"
              onAction={() => void transactions.refresh()}
            />
          ) : (
            <EmptyState
              title="No transactions"
              message="Transactions for this account will appear here."
              icon="receipt"
            />
          )
        }
        renderItem={({ item }) => {
          const display = accountTransactionDisplay(
            item,
            categories.data.find((category) => category.id === item.categoryId),
          );
          return (
            <View style={styles.row}>
              <TransactionRow
                title={display.title}
                subtitle={display.subtitle}
                minor={display.minor}
                currency={item.currency}
                icon={display.icon}
                signDisplay={display.signDisplay}
                onPress={() => onOpenTransaction?.(item.id)}
              />
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: layout.screenGutter },
  loading: { gap: space[4], padding: layout.screenGutter },
  content: {
    paddingBottom: space[16],
    paddingHorizontal: layout.screenGutter,
    paddingTop: space[4],
  },
  header: { gap: space[4], paddingBottom: space[2] },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
  // The row carries its own card padding; bleed it so the tile lines up with the gutter.
  row: { marginHorizontal: -layout.cardPadding },
  separator: { backgroundColor: colors.border.subtle, height: StyleSheet.hairlineWidth },
});
