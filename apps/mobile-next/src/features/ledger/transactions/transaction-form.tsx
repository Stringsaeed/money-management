import { StyleSheet, View } from "react-native";

import type { V2Account, V2Category, V2Transaction } from "@trove/api/v2/contracts";

import type { TransactionInput } from "@/data/ledger-client";
import { layout, space, Text } from "@/ui/trove";

import { EditorHeader } from "../editor/editor-header";
import { InlineField } from "../editor/inline-field";

import { AmountDisplay } from "./amount-display";
import { NumPad } from "./num-pad";
import { TransactionBreadcrumbs } from "./transaction-breadcrumbs";
import type { TransactionCreateActions } from "./transaction-create-actions";
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
        <EditorHeader
          title={transaction ? "Edit transaction" : "New transaction"}
          busy={busy}
          deleteLabel="Delete transaction"
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
            autoCategorize={form.autoCategorize}
            date={form.draft.date}
            onAccountChange={form.selectAccount}
            onToAccountChange={form.setToAccountId}
            onSelectCategory={form.selectCategory}
            onSelectTransfer={form.selectTransfer}
            onSelectAutoCategory={form.selectAutoCategory}
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
            <Text accessibilityRole="alert" style={styles.error} tone="negative" variant="labelMd">
              {message}
            </Text>
          ) : null}
        </View>
        <InlineField
          emoji="📝"
          accessibilityLabel="Note"
          placeholder={
            form.autoCategorize ? "Add a note and AI picks the category…" : "Add a note…"
          }
          value={form.draft.note}
          onChange={form.setNote}
          testID="transaction-note-field"
        />
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
  controls: { paddingTop: space[1] },
  amount: {
    flex: 1,
    gap: space[2],
    justifyContent: "center",
    paddingHorizontal: layout.screenGutter,
  },
  error: { textAlign: "center" },
});
