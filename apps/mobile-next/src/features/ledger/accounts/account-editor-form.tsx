import { StyleSheet, View } from "react-native";

import type { V2Account } from "@trove/api/v2/contracts";

import type { AccountInput } from "@/data/ledger-client";
import { space, Text } from "@/ui/trove";

import { BreadcrumbBar } from "../editor/breadcrumb-bar";
import { EditorHeader } from "../editor/editor-header";
import { InlineField } from "../editor/inline-field";
import { AmountDisplay } from "../transactions/amount-display";
import { BreadcrumbSeparator } from "../transactions/breadcrumb-segment";
import { NumPad } from "../transactions/num-pad";
import { accountTypeOption } from "./account-display";
import { AccountTypePicker } from "./account-type-picker";
import { BalanceSignToggle } from "./balance-sign-toggle";
import { CurrencyPicker } from "./currency-picker";
import { useAccountEditor } from "./use-account-editor";

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
  const message = error ?? form.validationError;

  return (
    <View style={styles.container}>
      {/* The pad is taller than the system keyboard, so the name field above it stays
          visible without keyboard avoidance. */}
      <View style={styles.body}>
        <EditorHeader
          title={account ? "Edit account" : "New account"}
          busy={busy}
          onCancel={onCancel}
          onSave={() => void form.submit()}
        />
        <View style={styles.controls}>
          <BreadcrumbBar>
            <AccountTypePicker type={form.draft.type} onChange={form.selectType} />
            <BreadcrumbSeparator />
            <CurrencyPicker currency={form.draft.currency} onChange={form.selectCurrency} />
          </BreadcrumbBar>
        </View>
        <View style={styles.amount}>
          <Text tone="secondary" variant="labelSm" style={styles.centered}>
            Opening balance
          </Text>
          <AmountDisplay
            amount={form.draft.amount}
            currency={form.draft.currency}
            fractionDigits={form.fractionDigits}
            negative={form.draft.negative}
          />
          <BalanceSignToggle negative={form.draft.negative} onToggle={form.toggleSign} />
          {message ? (
            <Text accessibilityRole="alert" tone="negative" style={styles.centered}>
              {message}
            </Text>
          ) : null}
        </View>
        <InlineField
          emoji={accountTypeOption(form.draft.type).emoji}
          accessibilityLabel="Account name"
          placeholder="Name this account…"
          value={form.draft.name}
          onChange={form.setName}
          autoCapitalize="words"
          maxLength={120}
          testID="account-name-field"
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
    paddingHorizontal: space[5],
  },
  centered: { textAlign: "center" },
});
