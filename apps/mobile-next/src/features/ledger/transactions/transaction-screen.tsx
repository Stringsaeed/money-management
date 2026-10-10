import { StyleSheet, View } from "react-native";

import { useAccountsQuery, useCategoriesQuery } from "@/data/ledger-queries";
import { useTransactionQuery } from "@/data/transaction-list-queries";
import { EmptyState, IconButton, layout, radius, Screen, Skeleton, space } from "@/ui/trove";

import type { TransactionCreateActions } from "./transaction-create-actions";
import { TransactionForm } from "./transaction-form";
import { useTransactionActions } from "./use-transaction-actions";

export interface TransactionScreenProps extends TransactionCreateActions {
  readonly id?: string;
  readonly onBack: () => void;
  /** Opens a saved transaction for editing, so the AI-filed toast can offer "Change". */
  readonly onChangeCategory?: (transactionId: string) => void;
}

export function TransactionScreen({
  id = "new",
  onBack,
  onChangeCategory,
  onCreateAccount,
  onCreateCategory,
}: TransactionScreenProps) {
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  const existing = useTransactionQuery(id === "new" ? undefined : id);
  const transaction = existing.data;
  const actions = useTransactionActions(transaction, onBack, onChangeCategory);

  if (accounts.isLoading || categories.isLoading || (id !== "new" && existing.isLoading))
    return (
      <Screen>
        <View
          accessibilityLabel="Loading form"
          accessibilityState={{ busy: true }}
          style={styles.loading}
        >
          <Skeleton height={28} width="50%" />
          <Skeleton borderRadius={radius.md} height={48} />
          <Skeleton height={72} width="70%" />
          <Skeleton borderRadius={radius.md} height={48} />
        </View>
      </Screen>
    );
  if (id !== "new" && !transaction)
    return (
      <Screen>
        <View style={styles.close}>
          <IconButton icon="close" accessibilityLabel="Close" onPress={onBack} variant="ghost" />
        </View>
        <View style={styles.empty}>
          <EmptyState
            actionLabel="Try again"
            icon="receipt"
            message="This entry may have been deleted."
            onAction={() => void existing.retry()}
            title="Transaction not found"
          />
        </View>
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
  loading: { gap: space[4], padding: layout.screenGutter },
  close: { margin: space[4] },
  empty: { paddingHorizontal: layout.screenGutter },
});
