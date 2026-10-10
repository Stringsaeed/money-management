/* oxlint-disable complexity -- recurring authoring keeps cadence, bounds, and kind-specific fields together for a coherent editor. */

import { useState } from "react";
import { StyleSheet, View } from "react-native";

import type { V2Account, V2Category, V2RecurringRule } from "@trove/api/v2/contracts";

import type { RecurringRuleInput } from "@/data/ledger-client";
import {
  Banner,
  Button,
  ListGroup,
  NoteField,
  SegmentedControl,
  space,
  Text,
  TextField,
  type SegmentOption,
} from "@/ui/trove";
import { parseDateKey, todayDateKey } from "@/utils/date";
import { decimalFromMinor, parseMoneyMinor } from "@/utils/money";

import { TransactionOptionSheet } from "../transaction-option-sheet";
import { RecurringDateRow } from "./recurring-date-row";

type RuleKind = RecurringRuleInput["kind"];
type RuleFrequency = RecurringRuleInput["frequency"];

const KIND_OPTIONS = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "transfer", label: "Transfer" },
] as const satisfies readonly SegmentOption<RuleKind>[];

const FREQUENCY_OPTIONS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
] as const satisfies readonly SegmentOption<RuleFrequency>[];

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
  const [kind, setKind] = useState<RuleKind>(rule?.kind ?? "expense");
  const [accountId, setAccountId] = useState(rule?.accountId ?? firstAccount?.id ?? "");
  const [categoryId, setCategoryId] = useState(rule?.categoryId ?? null);
  const [toAccountId, setToAccountId] = useState(rule?.toAccountId ?? null);
  const [amount, setAmount] = useState(
    rule ? decimalFromMinor(rule.amountMinor, rule.currency) : "",
  );
  const [frequency, setFrequency] = useState<RuleFrequency>(rule?.frequency ?? "month");
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
  const selectKind = (nextKind: RuleKind) => {
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
      setValidationError("Choose valid start and end dates.");
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
      <TextField label="Name" value={name} onChangeText={setName} placeholder="Rent" />
      <View style={styles.group}>
        <Text variant="labelSm" tone="secondary">
          Kind
        </Text>
        <SegmentedControl
          accessibilityLabel="Kind"
          options={KIND_OPTIONS}
          value={kind}
          onChange={selectKind}
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
        <Text tone="negative" variant="bodySm">
          Create an account before adding a recurring rule.
        </Text>
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
        <Text variant="labelSm" tone="secondary">
          Frequency
        </Text>
        <SegmentedControl
          accessibilityLabel="Frequency"
          options={FREQUENCY_OPTIONS}
          value={frequency}
          onChange={setFrequency}
        />
      </View>
      <TextField
        label="Every N periods"
        value={intervalCount}
        onChangeText={setIntervalCount}
        keyboardType="number-pad"
      />
      <ListGroup dividerInset={60}>
        <RecurringDateRow
          title="Starts on"
          value={startDate}
          fallback={todayDateKey()}
          onChange={setStartDate}
        />
        <RecurringDateRow
          title="Ends on"
          value={endDate}
          fallback={startDate}
          emptyLabel="No end date"
          onChange={setEndDate}
        />
      </ListGroup>
      {endDate ? (
        <Button
          label="Remove end date"
          variant="tertiary"
          size="sm"
          onPress={() => setEndDate("")}
        />
      ) : null}
      <TextField
        label="Ends after N occurrences (optional)"
        value={endCount}
        onChangeText={setEndCount}
        keyboardType="number-pad"
      />
      <NoteField
        value={note}
        onChangeText={setNote}
        placeholder="Add a note (optional)"
        multiline
      />
      {(error ?? validationError) ? (
        <Banner tone="negative" message={error ?? validationError} />
      ) : null}
      <View style={styles.actions}>
        {onCancel ? <Button label="Cancel" variant="tertiary" onPress={onCancel} /> : null}
        <Button
          label={rule ? "Save changes" : "Create rule"}
          onPress={() => void submit()}
          loading={busy}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: space[4] },
  group: { gap: space[2] },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: space[2],
    justifyContent: "flex-end",
  },
});
