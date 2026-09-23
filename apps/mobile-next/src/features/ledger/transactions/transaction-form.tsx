/* oxlint-disable complexity -- transaction entry intentionally coordinates kind-specific fields and native pickers in one focused form. */

import { useState } from "react";
import { DateTimePicker as ExpoDateTimePicker } from "@expo/ui/community/datetime-picker";
import { StyleSheet, View } from "react-native";

import type { V2Account, V2Category, V2Transaction } from "@trove/api/v2/contracts";

import type { TransactionInput } from "@/data/ledger-client";
import { Button } from "@/ui/button";
import { Chip } from "@/ui/chip";
import { Sheet } from "@/ui/sheet";
import { TextField } from "@/ui/text-field";
import { Text } from "@/ui/text";
import { colors, spacing } from "@/ui/design-tokens";
import { dateKeyFromPicker, datePickerValue, parseDateKey, todayDateKey } from "@/utils/date";
import { decimalFromMinor, parseMoneyMinor } from "@/utils/money";

import { TransactionOptionSheet } from "./transaction-option-sheet";

interface TransactionFormProps {
  readonly transaction?: V2Transaction;
  readonly accounts: readonly V2Account[];
  readonly categories: readonly V2Category[];
  readonly busy?: boolean;
  readonly error?: string;
  readonly onCancel?: () => void;
  readonly onSubmit: (input: TransactionInput) => Promise<void>;
}

export function TransactionForm({
  transaction,
  accounts,
  categories,
  busy = false,
  error,
  onCancel,
  onSubmit,
}: TransactionFormProps) {
  const firstAccount = accounts.find((item) => !item.archived);
  const [kind, setKind] = useState<TransactionInput["kind"]>(transaction?.kind ?? "expense");
  const [accountId, setAccountId] = useState(transaction?.accountId ?? firstAccount?.id ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(transaction?.categoryId ?? null);
  const [toAccountId, setToAccountId] = useState<string | null>(transaction?.toAccountId ?? null);
  const [amount, setAmount] = useState(
    transaction ? decimalFromMinor(transaction.amountMinor, transaction.currency) : "",
  );
  const [date, setDate] = useState(transaction?.date ?? todayDateKey());
  const [note, setNote] = useState(transaction?.note ?? "");
  const [dateOpen, setDateOpen] = useState(false);
  const [validationError, setValidationError] = useState<string>();

  const activeAccounts = accounts.filter((item) => !item.archived);
  const activeCategories = categories.filter(
    (item) => !item.archived && (kind === "transfer" || item.kind === kind),
  );
  const selectKind = (nextKind: TransactionInput["kind"]) => {
    setKind(nextKind);
    setCategoryId(null);
    setToAccountId(null);
    setValidationError(undefined);
  };
  const submit = async () => {
    const currency = accounts.find((item) => item.id === accountId)?.currency ?? "USD";
    const amountMinor = parseMoneyMinor(amount || "0", currency);
    if (!accountId) {
      setValidationError(
        activeAccounts.length === 0
          ? "Create an account before adding a transaction."
          : "Choose an account.",
      );
      return;
    }
    if (amountMinor === null || amountMinor <= 0) {
      setValidationError(`Enter a valid positive ${currency} amount.`);
      return;
    }
    if (!parseDateKey(date)) {
      setValidationError("Enter a valid date in YYYY-MM-DD format.");
      return;
    }
    if (kind === "transfer" && (!toAccountId || toAccountId === accountId)) {
      setValidationError("Choose a different destination account for this transfer.");
      return;
    }
    setValidationError(undefined);
    await onSubmit({
      accountId,
      categoryId: kind === "transfer" ? null : categoryId,
      toAccountId: kind === "transfer" ? toAccountId : null,
      kind,
      amountMinor,
      date,
      note: note.trim(),
    });
  };

  return (
    <View style={styles.content}>
      <Text variant="title">{transaction ? "Edit Transaction" : "Add Transaction"}</Text>
      <View style={styles.chips}>
        <Chip label="Expense" selected={kind === "expense"} onPress={() => selectKind("expense")} />
        <Chip label="Income" selected={kind === "income"} onPress={() => selectKind("income")} />
        <Chip
          label="Transfer"
          selected={kind === "transfer"}
          onPress={() => selectKind("transfer")}
        />
      </View>
      <TextField
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />
      {activeAccounts.length > 0 ? (
        <TransactionOptionSheet
          label="Account"
          value={activeAccounts.find((item) => item.id === accountId)?.name}
          options={activeAccounts.map((item) => ({
            id: item.id,
            label: `${item.name} · ${item.currency}`,
          }))}
          onChange={setAccountId}
        />
      ) : (
        <Text style={styles.error}>Create an account before adding a transaction.</Text>
      )}
      {kind !== "transfer" ? (
        <TransactionOptionSheet
          label="Category"
          value={activeCategories.find((item) => item.id === categoryId)?.name ?? "No category"}
          options={[
            { id: "", label: "No category" },
            ...activeCategories.map((item) => ({ id: item.id, label: item.name })),
          ]}
          onChange={(id) => setCategoryId(id || null)}
        />
      ) : (
        <TransactionOptionSheet
          label="Destination account"
          value={activeAccounts.find((item) => item.id === toAccountId)?.name}
          options={activeAccounts
            .filter((item) => item.id !== accountId)
            .map((item) => ({ id: item.id, label: `${item.name} · ${item.currency}` }))}
          onChange={setToAccountId}
        />
      )}
      <TextField
        label="Date"
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
        onFocus={() => setDateOpen(true)}
      />
      <TextField
        label="Note"
        value={note}
        onChangeText={setNote}
        placeholder="Optional note"
        multiline
      />
      {(error ?? validationError) ? (
        <Text style={styles.error}>{error ?? validationError}</Text>
      ) : null}
      <View style={styles.actions}>
        {onCancel ? <Button title="Cancel" variant="ghost" onPress={onCancel} /> : null}
        <Button
          title={transaction ? "Save changes" : "Save transaction"}
          onPress={() => void submit()}
          loading={busy}
        />
      </View>
      <Sheet open={dateOpen} onDismiss={() => setDateOpen(false)}>
        <Text variant="title">Date</Text>
        <ExpoDateTimePicker
          key={date}
          value={datePickerValue(date)}
          mode="date"
          display="inline"
          presentation="inline"
          style={styles.datePicker}
          timeZoneName="UTC"
          onValueChange={(_, value) => setDate(dateKeyFromPicker(value))}
        />
        <Button title="Done" onPress={() => setDateOpen(false)} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing[4], paddingBottom: spacing[8] },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  actions: { flexDirection: "row", gap: spacing[2], justifyContent: "flex-end" },
  datePicker: { width: "100%" },
  error: { color: colors.destructive },
});
