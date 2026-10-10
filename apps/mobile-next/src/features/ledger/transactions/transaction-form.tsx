import { StyleSheet, View } from "react-native";

import type { V2Account, V2Category, V2Transaction } from "@trove/api/v2/contracts";

import type { TransactionInput } from "@/data/ledger-client";
import { EditorHeader, EntryAmount, Keypad, layout, NoteField, space, Text } from "@/ui/trove";

import { TransactionBreadcrumbs } from "./transaction-breadcrumbs";
import type { TransactionCreateActions } from "./transaction-create-actions";
import { useKeypadHeight } from "./use-keypad-height";
import { useTransactionForm } from "./use-transaction-form";

/** Whole digits the amount accepts. */
const MAX_INTEGER_DIGITS = 12;

interface TransactionFormProps extends TransactionCreateActions {
  readonly transaction?: V2Transaction;
  readonly accounts: readonly V2Account[];
  readonly categories: readonly V2Category[];
  readonly busy?: boolean;
  readonly error?: string;
  readonly onCancel: () => void;
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
  const keypadHeight = useKeypadHeight();
  const message = error ?? form.validationError;

  return (
    <View style={styles.container}>
      {/* The keypad is taller than the system keyboard, so the note field above it stays
          visible without keyboard avoidance. */}
      <View style={styles.body}>
        <View style={styles.header}>
          <EditorHeader
            title={transaction ? "Edit entry" : "New entry"}
            deleteLabel="Delete transaction"
            onClose={onCancel}
            onDelete={onDelete}
            onSave={() => void form.submit()}
            saveDisabled={busy || !form.canSave}
          />
        </View>
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
          <EntryAmount
            currency={form.currency ?? ""}
            negative={form.draft.kind === "expense"}
            value={form.draft.amount}
          />
          {message ? (
            <Text accessibilityRole="alert" style={styles.error} tone="negative" variant="labelMd">
              {message}
            </Text>
          ) : null}
        </View>
        <View style={styles.note}>
          <NoteField
            emoji="📝"
            onChangeText={form.setNote}
            placeholder={
              form.autoCategorize ? "Add a note and AI picks the category…" : "Add a note…"
            }
            testID="transaction-note-field"
            value={form.draft.note}
          />
        </View>
      </View>
      <View style={[styles.keypad, { height: keypadHeight }]} testID="transaction-keypad">
        <Keypad
          fill
          maxFractionDigits={form.fractionDigits}
          maxIntegerDigits={MAX_INTEGER_DIGITS}
          onChange={form.changeAmount}
          onClear={form.clearAmount}
          value={form.draft.amount}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1 },
  header: { paddingHorizontal: layout.screenGutter },
  controls: { paddingTop: space[1] },
  amount: {
    flex: 1,
    gap: space[2],
    justifyContent: "center",
    paddingHorizontal: layout.screenGutter,
  },
  error: { textAlign: "center" },
  note: { paddingHorizontal: layout.screenGutter },
  keypad: { paddingHorizontal: layout.screenGutter, paddingBottom: space[2] },
});
