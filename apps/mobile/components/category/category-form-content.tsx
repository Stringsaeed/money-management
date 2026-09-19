import type { ComponentProps, ComponentType } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { CategoryColorPicker } from "@/components/category/category-color-picker";
import { CategoryFormPreview } from "@/components/category/category-form-preview";
import { CategoryIconPicker } from "@/components/category/category-icon-picker";
import { CategoryTypePicker } from "@/components/category/category-type-picker";
import { inputTextStyle } from "@/components/resource/resource-form-field";
import { CATEGORY_TYPE_META, type CategoryType } from "@/components/category/category-form-options";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";

import type { UseCategoryFormReturn } from "./form";

type SheetTextInputProps = ComponentProps<typeof TextInput>;

interface CategoryFormContentProps {
  form: UseCategoryFormReturn;
  onColorChange: (color: string) => void;
  onTypeChange?: (type: CategoryType) => void;
  typeEditable?: boolean;
  TextInputComponent?: ComponentType<SheetTextInputProps>;
}

export function CategoryFormContent({
  form,
  onColorChange,
  onTypeChange,
  typeEditable = true,
  TextInputComponent = TextInput,
}: CategoryFormContentProps) {
  return (
    <>
      <form.Subscribe
        selector={(state) => ({
          color: state.values.color,
          icon: state.values.icon,
          name: state.values.name,
          type: state.values.type,
        })}
      >
        {(previewValues) => <CategoryFormPreview values={previewValues} />}
      </form.Subscribe>

      <View style={styles.fieldsContainer}>
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) => (!value.trim() ? "Category name is required" : undefined),
            onSubmit: ({ value }) => (!value.trim() ? "Category name is required" : undefined),
          }}
        >
          {(field) => (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInputComponent
                onChangeText={field.handleChange}
                placeholder="e.g. Groceries"
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

        <form.Field name="type">
          {(field) => (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Type</Text>
              {typeEditable ? (
                <CategoryTypePicker
                  onChange={(type) => onTypeChange?.(type)}
                  value={field.state.value}
                />
              ) : (
                <View style={styles.readOnlyContainer}>
                  <Text style={styles.readOnlyText}>
                    {CATEGORY_TYPE_META[field.state.value].label}
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
              <CategoryIconPicker onChange={field.handleChange} value={field.state.value} />
            </View>
          )}
        </form.Field>

        <form.Field name="color">
          {(field) => (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Accent</Text>
              <CategoryColorPicker onChange={onColorChange} value={field.state.value} />
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
  readOnlyContainer: {
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  readOnlyText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textBase,
    color: colors.ink,
  },
});
