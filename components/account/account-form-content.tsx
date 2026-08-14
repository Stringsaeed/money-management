import type { ComponentProps, ComponentType } from "react";
import { TextInput, View } from "react-native";

import { AccountColorPicker } from "@/components/account/account-color-picker";
import { AccountFormBalanceSection } from "@/components/account/account-form-balance-section";
import { AccountFormPreview } from "@/components/account/account-form-preview";
import { AccountIconPicker } from "@/components/account/account-icon-picker";
import { AccountTypePicker } from "@/components/account/account-type-picker";
import {
  inputTextStyle,
  ResourceFormField,
  resourceInputClassName,
} from "@/components/resource/resource-form-field";
import { Text } from "@/components/ui/text";
import type { AccountType } from "@/types";

import type { AccountFormApi } from "./form";

type SheetTextInputProps = ComponentProps<typeof TextInput>;

interface AccountFormContentProps {
  amountEditable?: boolean;
  currencyExpanded: boolean;
  form: AccountFormApi;
  lockedBalanceCents?: number;
  onColorChange: (color: string) => void;
  onCurrencyCollapse: VoidFunction;
  onCurrencyExpandToggle: VoidFunction;
  onIconChange: (icon: string) => void;
  onTypeChange: (type: AccountType) => void;
  TextInputComponent?: ComponentType<SheetTextInputProps>;
}

export function AccountFormContent({
  amountEditable = true,
  currencyExpanded,
  form,
  lockedBalanceCents,
  onColorChange,
  onCurrencyCollapse,
  onCurrencyExpandToggle,
  onIconChange,
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
          icon: state.values.icon,
          name: state.values.name,
          type: state.values.type,
        })}
      >
        {(previewValues) => (
          <AccountFormPreview lockedBalanceCents={lockedBalanceCents} values={previewValues} />
        )}
      </form.Subscribe>

      <View className="gap-5">
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) => !value.trim() && "Enter account name.",
          }}
        >
          {(field) => (
            <ResourceFormField label="Name" error={field.state.meta.errors[0]}>
              <TextInputComponent
                className={resourceInputClassName}
                onChangeText={field.handleChange}
                placeholder="e.g. Main Checking"
                placeholderTextColor="#9a9896"
                returnKeyType="next"
                style={inputTextStyle}
                value={field.state.value}
              />
            </ResourceFormField>
          )}
        </form.Field>

        <AccountFormBalanceSection
          amountEditable={amountEditable}
          currencyExpanded={currencyExpanded}
          form={form}
          lockedBalanceCents={lockedBalanceCents}
          onCurrencyCollapse={onCurrencyCollapse}
          onCurrencyExpandToggle={onCurrencyExpandToggle}
          TextInputComponent={TextInputComponent}
        />

        <form.Field name="type">
          {(field) => (
            <View className="gap-2">
              <Text className="font-body-medium text-sm text-ink/60">Account type</Text>
              <View className="-mx-5">
                <AccountTypePicker
                  contentContainerClassName="gap-2 px-5"
                  onChange={onTypeChange}
                  value={field.state.value}
                />
              </View>
            </View>
          )}
        </form.Field>

        <form.Field name="icon">
          {(field) => (
            <View className="gap-2">
              <Text className="font-body-medium text-sm text-ink/60">Icon</Text>
              <AccountIconPicker onChange={onIconChange} value={field.state.value} />
            </View>
          )}
        </form.Field>

        <form.Field name="color">
          {(field) => (
            <View className="gap-2">
              <Text className="font-body-medium text-sm text-ink/60">Accent</Text>
              <AccountColorPicker onChange={onColorChange} value={field.state.value} />
            </View>
          )}
        </form.Field>
      </View>
    </>
  );
}
