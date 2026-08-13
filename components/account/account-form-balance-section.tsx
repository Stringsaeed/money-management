import type { ComponentProps, ComponentType } from "react";
import { TextInput, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { AccountCurrencyPicker } from "@/components/account/account-currency-picker";
import { resourceInputClassName } from "@/components/resource/resource-form-field";
import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import { formatCents } from "@/utils/currency";

import type { AccountFormApi } from "./form";

const AMOUNT_PATTERN = /^\d*(\.\d{0,2})?$/;

type SheetTextInputProps = ComponentProps<typeof TextInput>;

interface AccountFormBalanceSectionProps {
  amountEditable: boolean;
  currencyExpanded: boolean;
  form: AccountFormApi;
  lockedBalanceCents?: number;
  onCurrencyCollapse: VoidFunction;
  onCurrencyExpandToggle: VoidFunction;
  TextInputComponent?: ComponentType<SheetTextInputProps>;
}

export function AccountFormBalanceSection({
  amountEditable,
  currencyExpanded,
  form,
  lockedBalanceCents,
  onCurrencyCollapse,
  onCurrencyExpandToggle,
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
                <Text
                  className="font-heading-normal text-base italic text-ink/70"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {formatCents(lockedBalanceCents ?? 0, currency)}
                </Text>
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
              <AccountCurrencyPicker onChange={field.handleChange} value={field.state.value} />
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
              onCompactPress={onCurrencyExpandToggle}
              value={field.state.value}
            />
          )}
        </form.Field>
      </View>

      {currencyExpanded ? (
        <Animated.View entering={FadeIn.duration(200)} layout={layoutTransition} className="pt-2">
          <form.Field name="currency">
            {(field) => (
              <AccountCurrencyPicker
                onChange={(currency) => {
                  field.handleChange(currency);
                  onCurrencyCollapse();
                }}
                value={field.state.value}
              />
            )}
          </form.Field>
        </Animated.View>
      ) : null}
    </View>
  );
}
