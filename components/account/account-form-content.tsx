import type { ComponentProps, ComponentType } from "react";
import { TextInput, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { AccountColorPicker } from "@/components/account/account-color-picker";
import { AccountCurrencyPicker } from "@/components/account/account-currency-picker";
import { AccountFormPreview } from "@/components/account/account-form-preview";
import { AccountTypePicker } from "@/components/account/account-type-picker";
import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import type { AccountType } from "@/types";
import type { UseAccountFormReturn } from "./form";

type SheetTextInputProps = ComponentProps<typeof TextInput>;

interface AccountFormContentProps {
  currencyExpanded: boolean;
  form: UseAccountFormReturn;
  onColorChange: (color: string) => void;
  onCurrencyCollapse: VoidFunction;
  onCurrencyExpandToggle: VoidFunction;
  onTypeChange: (type: AccountType) => void;
  TextInputComponent?: ComponentType<SheetTextInputProps>;
}

const inputClassName =
  "rounded-2xl border border-ledger-outline bg-surface px-4 py-3 text-base text-ink";

const sectionLabelClassName = "font-body-medium text-sm text-ink/60";

const AMOUNT_PATTERN = /^\d*(\.\d{0,2})?$/;

export function AccountFormContent({
  currencyExpanded,
  form,
  onColorChange,
  onCurrencyCollapse,
  onCurrencyExpandToggle,
  onTypeChange,
  TextInputComponent = TextInput,
}: AccountFormContentProps) {
  return (
    <>
      <form.Subscribe
        selector={(state) => ({
          amount: state.values.amount,
          color: state.values.color,
          currency: state.values.currency,
          name: state.values.name,
          type: state.values.type,
        })}
      >
        {(previewValues) => <AccountFormPreview values={previewValues} />}
      </form.Subscribe>

      <View className="gap-5">
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) => !value.trim() && "Enter account name.",
          }}
        >
          {(field) => (
            <View className="gap-2">
              <Text className={sectionLabelClassName}>Name</Text>
              <TextInputComponent
                className={inputClassName}
                onChangeText={field.handleChange}
                placeholder="e.g. Main Checking"
                placeholderTextColor="#9a9896"
                returnKeyType="next"
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

        <View className="gap-2">
          <Text className={sectionLabelClassName}>Starting balance</Text>
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
                    className={inputClassName}
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
                  onCompactPress={onCurrencyExpandToggle}
                  onChange={field.handleChange}
                  value={field.state.value}
                />
              )}
            </form.Field>
          </View>

          {currencyExpanded ? (
            <Animated.View
              entering={FadeIn.duration(200)}
              layout={layoutTransition}
              className="pt-2"
            >
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

        <form.Field name="type">
          {(field) => (
            <View className="gap-2">
              <Text className={sectionLabelClassName}>Account type</Text>
              <AccountTypePicker onChange={onTypeChange} value={field.state.value} />
            </View>
          )}
        </form.Field>

        <form.Field name="color">
          {(field) => (
            <View className="gap-2">
              <Text className={sectionLabelClassName}>Accent</Text>
              <AccountColorPicker onChange={onColorChange} value={field.state.value} />
            </View>
          )}
        </form.Field>
      </View>
    </>
  );
}
