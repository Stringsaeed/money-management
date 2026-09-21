import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

import {
  useAccountsQuery,
  useCategoriesQuery,
  useLedgerMutations,
  useTransactionsQuery,
} from "@/data/ledger-queries";
import { Button } from "@/ui/button";
import { EmptyState } from "@/ui/empty-state";
import { Screen } from "@/ui/screen";
import { Text } from "@/ui/text";
import { colors, spacing } from "@/ui/design-tokens";

import { TransactionForm } from "./transaction-form";

export interface TransactionScreenProps {
  readonly id?: string;
  readonly onBack?: () => void;
}

export function TransactionScreen({ id = "new", onBack }: TransactionScreenProps) {
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  const transactions = useTransactionsQuery();
  const mutations = useLedgerMutations();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const transaction = id === "new" ? undefined : transactions.data.find((item) => item.id === id);

  if (accounts.isLoading || categories.isLoading || (id !== "new" && transactions.isLoading))
    return (
      <Screen>
        <Text style={styles.status}>Loading form…</Text>
      </Screen>
    );
  if (id !== "new" && !transaction)
    return (
      <Screen>
        <EmptyState
          title="Transaction not found"
          message="This entry may have been deleted."
          onRetry={() => void transactions.retry()}
        />
      </Screen>
    );

  return (
    <Screen style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        <TransactionForm
          transaction={transaction}
          accounts={accounts.data}
          categories={categories.data}
          busy={busy}
          error={error}
          onCancel={onBack}
          onSubmit={async (input) => {
            setBusy(true);
            try {
              if (transaction)
                await mutations.updateTransaction(transaction.id, input, transaction.version);
              else await mutations.createTransaction(input);
              onBack?.();
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "Could not save transaction.");
            } finally {
              setBusy(false);
            }
          }}
        />
        {transaction ? (
          <View style={styles.actions}>
            <Button
              title="Delete transaction"
              variant="destructive"
              disabled={busy}
              onPress={() =>
                Alert.alert(
                  "Delete transaction?",
                  "This removes the entry and updates your account balance.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: () => {
                        setBusy(true);
                        void mutations
                          .deleteTransaction(transaction.id, transaction.version)
                          .then(() => onBack?.())
                          .catch((cause) =>
                            setError(
                              cause instanceof Error
                                ? cause.message
                                : "Could not delete the transaction. Try again.",
                            ),
                          )
                          .finally(() => setBusy(false));
                      },
                    },
                  ],
                )
              }
            />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: spacing[5], paddingTop: spacing[4] },
  formContent: { paddingBottom: spacing[16] },
  actions: { paddingTop: spacing[4] },
  status: { color: colors.mutedForeground, padding: spacing[5] },
});
