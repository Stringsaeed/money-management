import { StyleSheet, View } from "react-native";

import type { V2Account, V2Category, V2Transaction } from "@trove/api/v2/contracts";

import type { TransactionInput } from "@/data/ledger-client";
import { colors, spacing, typography } from "@/ui/design-tokens";
import { Text } from "@/ui/text";

import { AmountDisplay } from "./amount-display";
import { NoteInput } from "./note-input";
import { NumPad } from "./num-pad";
import { TransactionBreadcrumbs } from "./transaction-breadcrumbs";
import type { TransactionCreateActions } from "./transaction-create-actions";
import { TransactionHeader } from "./transaction-header";
import { useTransactionForm } from "./use-transaction-form";

interface TransactionFormProps extends TransactionCreateActions {
  readonly transaction?: V2Transaction;
  readonly accounts: readonly V2Account[];
  readonly categories: readonly V2Category[];
  readonly busy?: boolean;
  readonly error?: string;
  readonly onCancel?: () => void;
  readonly onDelete?: () => void;
  readonly onSubmit: (input: TransactionInput) => Promise<void>;
}

export function TransactionForm({
  transaction,
  accounts,
  categories,
  busy = false,
  error,
  onCancel,
  onDelete,
  onSubmit,
  onCreateAccount,
  onCreateCategory,
}: TransactionFormProps) {
  const form = useTransactionForm({ transaction, accounts, categories, onSubmit });
  const message = error ?? form.validationError;

  return (
    <View style={styles.container}>
      {/* The pad is taller than the system keyboard, so the note field above it stays
          visible without keyboard avoidance. */}
      <View style={styles.body}>
        <TransactionHeader
          title={transaction ? "Edit transaction" : "New transaction"}
          busy={busy}
          onCancel={onCancel}
          onDelete={onDelete}
          onSave={() => void form.submit()}
        />
        <View style={styles.controls}>
          <TransactionBreadcrumbs
            kind={form.draft.kind}
            accounts={form.activeAccounts}
            categories={form.activeCategories}
            accountId={form.draft.accountId}
            toAccountId={form.draft.toAccountId}
            categoryId={form.draft.categoryId}
            date={form.draft.date}
            onAccountChange={form.selectAccount}
            onToAccountChange={form.setToAccountId}
            onSelectCategory={form.selectCategory}
            onSelectTransfer={form.selectTransfer}
            onDateChange={form.setDate}
            onCreateAccount={onCreateAccount}
            onCreateCategory={onCreateCategory}
          />
        </View>
        <View style={styles.amount}>
          <AmountDisplay
            amount={form.draft.amount}
            currency={form.currency}
            fractionDigits={form.fractionDigits}
          />
          {message ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {message}
            </Text>
          ) : null}
        </View>
        <NoteInput value={form.draft.note} onChange={form.setNote} />
      </View>
      <NumPad
        allowDecimal={form.fractionDigits > 0}
        onKey={form.pressKey}
        onClear={form.clearAmount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1 },
  controls: { paddingTop: spacing[1] },
  amount: {
    flex: 1,
    gap: spacing[2],
    justifyContent: "center",
    paddingHorizontal: spacing[5],
  },
  error: {
    color: colors.destructive,
    fontFamily: typography.fontBodyMedium,
    textAlign: "center",
  },
});
