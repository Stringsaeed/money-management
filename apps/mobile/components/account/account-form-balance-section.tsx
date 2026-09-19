import type { ComponentProps, ComponentType } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { AccountCurrencyPicker } from "@/components/account/account-currency-picker";
import { inputTextStyle } from "@/components/resource/resource-form-field";
import { MoneyText } from "@/components/ui/money-text";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";

import type { AccountFormApi } from "./form";

const AMOUNT_PATTERN = /^\d*(\.\d{0,2})?$/;

type SheetTextInputProps = ComponentProps<typeof TextInput>;

interface AccountFormBalanceSectionProps {
  amountEditable: boolean;
  currencyEditable?: boolean;
  form: AccountFormApi;
  lockedBalanceCents?: number;
  TextInputComponent?: ComponentType<SheetTextInputProps>;
}

export function AccountFormBalanceSection({
  amountEditable,
  currencyEditable = true,
  form,
  lockedBalanceCents,
  TextInputComponent = TextInput,
}: AccountFormBalanceSectionProps) {
  if (!amountEditable) {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Balance</Text>
          <form.Subscribe selector={(state) => state.values.currency}>
            {(currency) => (
              <View style={styles.readOnlyContainer}>
                <MoneyText
                  cents={lockedBalanceCents ?? 0}
                  currency={currency}
                  style={styles.balanceText}
                />
              </View>
            )}
          </form.Subscribe>
          <Text style={styles.hintText}>
            Balance updates through transactions. Delete this account to start over. 💸
          </Text>
        </View>

        <form.Field name="currency">
          {(field) => (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Currency</Text>
              {currencyEditable ? (
                <AccountCurrencyPicker onChange={field.handleChange} value={field.state.value} />
              ) : (
                <View style={styles.readOnlyContainer}>
                  <Text style={styles.readOnlyText}>{field.state.value}</Text>
                  <Text style={styles.hintText}>
                    Currency stays on the Account after it is created. 💱
                  </Text>
                </View>
              )}
            </View>
          )}
        </form.Field>
      </View>
    );
  }

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>Starting balance</Text>
      <View style={styles.inputRow}>
        <form.Field
          name="amount"
          validators={{
            onChange: ({ value }) => {
              if (value.trim() && !AMOUNT_PATTERN.test(value.trim())) {
                return "Enter valid amount with up to 2 decimals.";
              }
            },
          }}
        >
          {(field) => (
            <View style={styles.inputWrapper}>
              <TextInputComponent
                keyboardType="decimal-pad"
                onChangeText={field.handleChange}
                placeholder="0.00"
                placeholderTextColor="#9a9896"
                returnKeyType="done"
                style={[styles.amountInput, inputTextStyle]}
                value={field.state.value}
              />
              {field.state.meta.errors.length > 0 ? (
                <Text style={styles.errorText}>{field.state.meta.errors[0]}</Text>
              ) : null}
            </View>
          )}
        </form.Field>

        <form.Field name="currency">
          {(field) => (
            <AccountCurrencyPicker
              compact
              onChange={field.handleChange}
              value={field.state.value}
            />
          )}
        </form.Field>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    gap: spacing[5],
  },
  fieldGroup: {
    gap: spacing[2],
  },
  label: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.6,
  },
  readOnlyContainer: {
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  balanceText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textBase,
    lineHeight: 20,
    color: colors.ink,
    opacity: 0.7,
    fontVariant: ["tabular-nums"],
    includeFontPadding: false,
  },
  readOnlyText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textBase,
    color: colors.ink,
  },
  hintText: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[2],
  },
  inputWrapper: {
    minWidth: 0,
    flex: 1,
    gap: spacing[2],
  },
  errorText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textXs,
    color: colors.destructive,
  },
  amountInput: {
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: typography.textBase,
    lineHeight: 20,
    color: colors.ink,
  },
});
