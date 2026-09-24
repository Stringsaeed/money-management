import { StyleSheet } from "react-native";

import { useAccountsQuery, useCategoriesQuery, useTransactionsQuery } from "@/data/ledger-queries";
import { EmptyState } from "@/ui/empty-state";
import { IconButton } from "@/ui/icon-button";
import { Screen } from "@/ui/screen";
import { Text } from "@/ui/text";
import { colors, spacing } from "@/ui/design-tokens";

import type { TransactionCreateActions } from "./transaction-create-actions";
import { TransactionForm } from "./transaction-form";
import { useTransactionActions } from "./use-transaction-actions";

export interface TransactionScreenProps extends TransactionCreateActions {
  readonly id?: string;
  readonly onBack?: () => void;
}

export function TransactionScreen({
  id = "new",
  onBack,
  onCreateAccount,
  onCreateCategory,
}: TransactionScreenProps) {
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  const transactions = useTransactionsQuery();
  const transaction = id === "new" ? undefined : transactions.data.find((item) => item.id === id);
  const actions = useTransactionActions(transaction, onBack);

  if (accounts.isLoading || categories.isLoading || (id !== "new" && transactions.isLoading))
    return (
      <Screen>
        <Text style={styles.status}>Loading form…</Text>
      </Screen>
    );
  if (id !== "new" && !transaction)
    return (
      <Screen>
        {onBack ? (
          <IconButton name="x" accessibilityLabel="Close" onPress={onBack} style={styles.close} />
        ) : null}
        <EmptyState
          title="Transaction not found"
          message="This entry may have been deleted."
          onRetry={() => void transactions.retry()}
        />
      </Screen>
    );

  return (
    <Screen>
      <TransactionForm
        transaction={transaction}
        accounts={accounts.data}
        categories={categories.data}
        busy={actions.busy}
        error={actions.error}
        onCancel={onBack}
        onDelete={actions.confirmDelete}
        onSubmit={actions.save}
        onCreateAccount={onCreateAccount}
        onCreateCategory={onCreateCategory}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: { color: colors.mutedForeground, padding: spacing[5] },
  close: { margin: spacing[4] },
});
