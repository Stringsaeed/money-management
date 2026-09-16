import type { ComponentProps, ComponentType } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { AccountColorPicker } from "@/components/account/account-color-picker";
import { AccountFormBalanceSection } from "@/components/account/account-form-balance-section";
import { AccountFormPreview } from "@/components/account/account-form-preview";
import { AccountIconPicker } from "@/components/account/account-icon-picker";
import { AccountTypePicker } from "@/components/account/account-type-picker";
import { inputTextStyle } from "@/components/resource/resource-form-field";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";
import type { AccountType } from "@/types";

import { ACCOUNT_TYPE_META } from "./account-form-options";
import type { AccountFormApi } from "./form";

type SheetTextInputProps = ComponentProps<typeof TextInput>;

interface AccountFormContentProps {
  amountEditable?: boolean;
  form: AccountFormApi;
  lockedBalanceCents?: number;
  onColorChange: (color: string) => void;
  onIconChange: (icon: string) => void;
  onTypeChange: (type: AccountType) => void;
  TextInputComponent?: ComponentType<SheetTextInputProps>;
  typeEditable?: boolean;
  currencyEditable?: boolean;
}

export function AccountFormContent({
  amountEditable = true,
  form,
  lockedBalanceCents,
  onColorChange,
  onIconChange,
  onTypeChange,
  TextInputComponent = TextInput,
  typeEditable = true,
  currencyEditable = true,
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

      <View style={styles.fieldsContainer}>
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) => !value.trim() && "Enter account name.",
          }}
        >
          {(field) => (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInputComponent
                onChangeText={field.handleChange}
                placeholder="e.g. Main Checking"
                placeholderTextColor="#9a9896"
                returnKeyType="next"
                style={[styles.textInput, inputTextStyle]}
                value={field.state.value}
              />
              {field.state.meta.errors[0] ? (
                <Text style={styles.errorText}>{String(field.state.meta.errors[0])}</Text>
              ) : null}
            </View>
          )}
        </form.Field>

        <AccountFormBalanceSection
          amountEditable={amountEditable}
          currencyEditable={currencyEditable}
          form={form}
          lockedBalanceCents={lockedBalanceCents}
          TextInputComponent={TextInputComponent}
        />

        <form.Field name="type">
          {(field) => (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Account type</Text>
              {typeEditable ? (
                <View style={styles.typePickerWrapper}>
                  <AccountTypePicker
                    contentContainerStyle={styles.typePickerContent}
                    onChange={onTypeChange}
                    value={field.state.value}
                  />
                </View>
              ) : (
                <View style={styles.readOnlyContainer}>
                  <Text style={styles.readOnlyText}>
                    {ACCOUNT_TYPE_META[field.state.value].emoji}{" "}
                    {ACCOUNT_TYPE_META[field.state.value].label}
                  </Text>
                </View>
              )}
            </View>
          )}
        </form.Field>

        <form.Field name="icon">
          {(field) => (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Icon</Text>
              <AccountIconPicker onChange={onIconChange} value={field.state.value} />
            </View>
          )}
        </form.Field>

        <form.Field name="color">
          {(field) => (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Accent</Text>
              <AccountColorPicker onChange={onColorChange} value={field.state.value} />
            </View>
          )}
        </form.Field>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fieldsContainer: {
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
  textInput: {
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
  errorText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textXs,
    color: colors.destructive,
  },
  typePickerWrapper: {
    marginHorizontal: -spacing[5],
  },
  typePickerContent: {
    gap: spacing[2],
    paddingHorizontal: spacing[5],
  },
  readOnlyContainer: {
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  readOnlyText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textBase,
    color: colors.ink,
  },
});
