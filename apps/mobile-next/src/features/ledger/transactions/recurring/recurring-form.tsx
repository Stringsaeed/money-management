/* oxlint-disable complexity -- recurring authoring keeps cadence, bounds, and kind-specific fields together for a coherent editor. */

import { useState } from "react";
import { StyleSheet, View } from "react-native";

import type { V2Account, V2Category, V2RecurringRule } from "@trove/api/v2/contracts";

import type { RecurringRuleInput } from "@/data/ledger-client";
import { Button } from "@/ui/button";
import { Chip } from "@/ui/chip";
import { TextField } from "@/ui/text-field";
import { Text } from "@/ui/text";
import { colors, spacing } from "@/ui/design-tokens";
import { parseDateKey, todayDateKey } from "@/utils/date";
import { decimalFromMinor, parseMoneyMinor } from "@/utils/money";

import { TransactionOptionSheet } from "../transaction-option-sheet";

interface RecurringFormProps {
  readonly rule?: V2RecurringRule;
  readonly accounts: readonly V2Account[];
  readonly categories: readonly V2Category[];
  readonly busy?: boolean;
  readonly error?: string;
  readonly onCancel?: () => void;
  readonly onSubmit: (input: RecurringRuleInput) => Promise<void>;
}

export function RecurringForm({
  rule,
  accounts,
  categories,
  busy = false,
  error,
  onCancel,
  onSubmit,
}: RecurringFormProps) {
  const firstAccount = accounts.find((item) => !item.archived);
  const [name, setName] = useState(rule?.name ?? "");
  const [kind, setKind] = useState<RecurringRuleInput["kind"]>(rule?.kind ?? "expense");
  const [accountId, setAccountId] = useState(rule?.accountId ?? firstAccount?.id ?? "");
  const [categoryId, setCategoryId] = useState(rule?.categoryId ?? null);
  const [toAccountId, setToAccountId] = useState(rule?.toAccountId ?? null);
  const [amount, setAmount] = useState(
    rule ? decimalFromMinor(rule.amountMinor, rule.currency) : "",
  );
  const [frequency, setFrequency] = useState<RecurringRuleInput["frequency"]>(
    rule?.frequency ?? "month",
  );
  const [intervalCount, setIntervalCount] = useState(String(rule?.intervalCount ?? 1));
  const [startDate, setStartDate] = useState(rule?.startDate ?? todayDateKey());
  const [endDate, setEndDate] = useState(rule?.endDate ?? "");
  const [endCount, setEndCount] = useState(rule?.endCount ? String(rule.endCount) : "");
  const [note, setNote] = useState(rule?.note ?? "");
  const [validationError, setValidationError] = useState<string>();
  const activeAccounts = accounts.filter((item) => !item.archived);
  const activeCategories = categories.filter(
    (item) => !item.archived && (kind === "transfer" || item.kind === kind),
  );
  const selectKind = (nextKind: RecurringRuleInput["kind"]) => {
    setKind(nextKind);
    setCategoryId(null);
    setToAccountId(null);
    setValidationError(undefined);
  };
  const submit = async () => {
    const currency = accounts.find((item) => item.id === accountId)?.currency ?? "USD";
    const amountMinor = parseMoneyMinor(amount || "0", currency);
    if (!name.trim()) {
      setValidationError("Enter a name for this recurring rule.");
      return;
    }
    if (!accountId) {
      setValidationError(
        activeAccounts.length === 0
          ? "Create an account before adding a recurring rule."
          : "Choose an account.",
      );
      return;
    }
    if (amountMinor === null || amountMinor <= 0) {
      setValidationError(`Enter a valid positive ${currency} amount.`);
      return;
    }
    const parsedInterval = Number.parseInt(intervalCount || "1", 10);
    if (!Number.isInteger(parsedInterval) || parsedInterval < 1) {
      setValidationError("Every N periods must be a whole number greater than zero.");
      return;
    }
    const parsedEndCount = endCount ? Number(endCount) : null;
    if (parsedEndCount !== null && (!Number.isInteger(parsedEndCount) || parsedEndCount < 1)) {
      setValidationError("Occurrences must be a whole number greater than zero.");
      return;
    }
    if (!parseDateKey(startDate) || (endDate && !parseDateKey(endDate))) {
      setValidationError("Enter valid start and end dates in YYYY-MM-DD format.");
      return;
    }
    if (endDate && endDate < startDate) {
      setValidationError("End date must not precede the start date.");
      return;
    }
    if (kind === "transfer" && (!toAccountId || toAccountId === accountId)) {
      setValidationError("Choose a different destination account for this transfer.");
      return;
    }
    setValidationError(undefined);
    await onSubmit({
      name: name.trim(),
      accountId,
      categoryId: kind === "transfer" ? null : categoryId,
      toAccountId: kind === "transfer" ? toAccountId : null,
      kind,
      amountMinor,
      currency,
      note: note.trim(),
      frequency,
      intervalCount: parsedInterval,
      startDate,
      endDate: endDate || null,
      endCount: parsedEndCount,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  return (
    <View style={styles.content}>
      <Text variant="title">{rule ? "Edit Recurring Rule" : "Add Recurring Rule"}</Text>
      <TextField label="Name" value={name} onChangeText={setName} placeholder="Rent" />
      <View style={styles.group}>
        <Text variant="label">Kind</Text>
        <View style={styles.chips}>
          <Chip
            label="Expense"
            selected={kind === "expense"}
            onPress={() => selectKind("expense")}
          />
          <Chip label="Income" selected={kind === "income"} onPress={() => selectKind("income")} />
          <Chip
            label="Transfer"
            selected={kind === "transfer"}
            onPress={() => selectKind("transfer")}
          />
        </View>
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
        <Text style={styles.error}>Create an account before adding a recurring rule.</Text>
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
      <View style={styles.group}>
        <Text variant="label">Frequency</Text>
        <View style={styles.chips}>
          {(["day", "week", "month", "year"] as const).map((item) => (
            <Chip
              key={item}
              label={item}
              selected={frequency === item}
              onPress={() => setFrequency(item)}
            />
          ))}
        </View>
      </View>
      <TextField
        label="Every N periods"
        value={intervalCount}
        onChangeText={setIntervalCount}
        keyboardType="number-pad"
      />
      <TextField
        label="Starts on"
        value={startDate}
        onChangeText={setStartDate}
        placeholder="YYYY-MM-DD"
      />
      <TextField
        label="Ends on (optional)"
        value={endDate}
        onChangeText={setEndDate}
        placeholder="YYYY-MM-DD"
      />
      <TextField
        label="Ends after N occurrences (optional)"
        value={endCount}
        onChangeText={setEndCount}
        keyboardType="number-pad"
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
          title={rule ? "Save changes" : "Create rule"}
          onPress={() => void submit()}
          loading={busy}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing[4], paddingBottom: spacing[8] },
  group: { gap: spacing[2] },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  actions: { flexDirection: "row", gap: spacing[2], justifyContent: "flex-end" },
  error: { color: colors.destructive },
});
