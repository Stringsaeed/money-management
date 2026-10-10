import { useState } from "react";
import { StyleSheet, View } from "react-native";

import type { V2Account } from "@trove/api/v2/contracts";

import type { AccountInput } from "@/data/ledger-client";
import {
  Breadcrumb,
  EditorHeader,
  EntryAmount,
  Keypad,
  layout,
  NoteField,
  space,
  Text,
  type BreadcrumbSegmentSpec,
} from "@/ui/trove";

import { accountTypeOption } from "./account-display";
import { MAX_ENTRY_INTEGER_DIGITS } from "./account-entry";
import { AccountTypePicker } from "./account-type-picker";
import { BalanceSignToggle } from "./balance-sign-toggle";
import { CurrencyPicker } from "./currency-picker";
import { useAccountEditor } from "./use-account-editor";

type OpenSheet = "type" | "currency";

interface AccountEditorFormProps {
  readonly account?: V2Account;
  readonly defaultCurrency: string;
  readonly busy?: boolean;
  readonly error?: string;
  readonly onCancel?: () => void;
  readonly onSubmit: (input: AccountInput) => Promise<void>;
}

export function AccountEditorForm({
  account,
  defaultCurrency,
  busy = false,
  error,
  onCancel,
  onSubmit,
}: AccountEditorFormProps) {
  const form = useAccountEditor({ account, defaultCurrency, onSubmit });
  const [sheet, setSheet] = useState<OpenSheet>();
  const message = error ?? form.validationError;
  const option = accountTypeOption(form.draft.type);
  const segments: readonly BreadcrumbSegmentSpec[] = [
    {
      key: "type",
      emoji: option.emoji,
      label: option.label,
      state: sheet === "type" ? "active" : "set",
      accessibilityLabel: `Account type: ${option.label}`,
      onPress: () => setSheet("type"),
    },
    {
      key: "currency",
      emoji: "💱",
      label: form.draft.currency,
      state: sheet === "currency" ? "active" : "set",
      accessibilityLabel: `Currency: ${form.draft.currency}`,
      onPress: () => setSheet("currency"),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <EditorHeader
          title={account ? "Edit account" : "New account"}
          saveDisabled={busy}
          onClose={() => onCancel?.()}
          onSave={() => void form.submit()}
        />
        <Breadcrumb accessibilityLabel="Account details" segments={segments} />
        <NoteField
          autoCapitalize="words"
          emoji={option.emoji}
          maxLength={120}
          onChangeText={form.setName}
          placeholder="Name this account…"
          testID="account-name-field"
          value={form.draft.name}
        />
      </View>
      <View style={styles.amount}>
        <Text tone="tertiary" variant="stamp">
          {`Opening balance · ${form.draft.currency}`}
        </Text>
        <EntryAmount
          currency={form.draft.currency}
          negative={form.draft.negative}
          value={form.draft.amount}
        />
        <BalanceSignToggle negative={form.draft.negative} onChange={form.selectSign} />
        {message ? (
          <Text accessibilityRole="alert" tone="negative" style={styles.centered}>
            {message}
          </Text>
        ) : null}
      </View>
      <Keypad
        fill
        maxFractionDigits={form.fractionDigits}
        maxIntegerDigits={MAX_ENTRY_INTEGER_DIGITS}
        onChange={form.changeAmount}
        onClear={form.clearAmount}
        style={styles.keypad}
        value={form.draft.amount}
      />
      <AccountTypePicker
        open={sheet === "type"}
        type={form.draft.type}
        onChange={form.selectType}
        onDismiss={() => setSheet(undefined)}
      />
      <CurrencyPicker
        open={sheet === "currency"}
        currency={form.draft.currency}
        onChange={form.selectCurrency}
        onDismiss={() => setSheet(undefined)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: layout.screenGutter, paddingTop: space[2] },
  top: { gap: space[3] },
  amount: {
    alignItems: "center",
    flex: 1,
    gap: space[3],
    justifyContent: "center",
  },
  centered: { textAlign: "center" },
  // Keys fill their share of the height, but the pad stops growing before it crowds the amount.
  keypad: { maxHeight: 320 },
});
