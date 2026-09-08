import type { ComponentProps, ComponentType } from "react";
import { TextInput, View } from "react-native";

import { AccountCurrencyPicker } from "@/components/account/account-currency-picker";
import { inputTextStyle, resourceInputClassName } from "@/components/resource/resource-form-field";
import { MoneyText } from "@/components/ui/money-text";
import { Text } from "@/components/ui/text";

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
      <View className="gap-5">
        <View className="gap-2">
          <Text className="font-body-medium text-sm text-ink/60">Balance</Text>
          <form.Subscribe selector={(state) => state.values.currency}>
            {(currency) => (
              <View className="rounded-2xl border border-ledger-outline bg-surface-container px-4 py-3">
                <MoneyText
                  cents={lockedBalanceCents ?? 0}
                  currency={currency}
                  className="font-body-medium text-base leading-5 text-ink/70"
                  style={{ fontVariant: ["tabular-nums"], includeFontPadding: false }}
                />
              </View>
            )}
          </form.Subscribe>
          <Text className="font-body-normal text-xs text-ink/40">
            Balance updates through transactions. Delete this account to start over. 💸
          </Text>
        </View>

        <form.Field name="currency">
          {(field) => (
            <View className="gap-2">
              <Text className="font-body-medium text-sm text-ink/60">Currency</Text>
              {currencyEditable ? (
                <AccountCurrencyPicker onChange={field.handleChange} value={field.state.value} />
              ) : (
                <View className="rounded-2xl border border-ledger-outline bg-surface-container px-4 py-3">
                  <Text className="font-body-medium text-base text-ink">{field.state.value}</Text>
                  <Text className="font-body-normal text-xs text-ink/40">
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
    <View className="gap-2">
      <Text className="font-body-medium text-sm text-ink/60">Starting balance</Text>
      <View className="flex-row items-start gap-2">
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
            <View className="min-w-0 flex-1 gap-2">
              <TextInputComponent
                className={resourceInputClassName}
                keyboardType="decimal-pad"
                onChangeText={field.handleChange}
                placeholder="0.00"
                placeholderTextColor="#9a9896"
                returnKeyType="done"
                style={inputTextStyle}
                value={field.state.value}
              />
              {field.state.meta.errors.length > 0 ? (
                <Text className="font-body-medium text-xs text-destructive">
                  {field.state.meta.errors[0]}
                </Text>
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
