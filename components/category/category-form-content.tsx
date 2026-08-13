import type { ComponentProps, ComponentType } from "react";
import { TextInput, View } from "react-native";

import { CategoryColorPicker } from "@/components/category/category-color-picker";
import { CategoryFormPreview } from "@/components/category/category-form-preview";
import { CategoryIconPicker } from "@/components/category/category-icon-picker";
import { CategoryTypePicker } from "@/components/category/category-type-picker";
import {
  ResourceFormField,
  resourceInputClassName,
} from "@/components/resource/resource-form-field";
import { CATEGORY_TYPE_META, type CategoryType } from "@/components/category/category-form-options";
import { Text } from "@/components/ui/text";

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

      <View className="gap-5">
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) => (!value.trim() ? "Category name is required" : undefined),
            onSubmit: ({ value }) => (!value.trim() ? "Category name is required" : undefined),
          }}
        >
          {(field) => (
            <ResourceFormField label="Name" error={field.state.meta.errors[0]}>
              <TextInputComponent
                className={resourceInputClassName}
                onChangeText={field.handleChange}
                placeholder="e.g. Groceries"
                placeholderTextColor="#9a9896"
                returnKeyType="next"
                value={field.state.value}
              />
            </ResourceFormField>
          )}
        </form.Field>

        <form.Field name="type">
          {(field) => (
            <View className="gap-2">
              <Text className="font-body-medium text-sm text-ink/60">Type</Text>
              {typeEditable ? (
                <CategoryTypePicker
                  onChange={(type) => onTypeChange?.(type)}
                  value={field.state.value}
                />
              ) : (
                <View className="rounded-2xl border border-ledger-outline bg-surface px-4 py-3">
                  <Text className="font-body-medium text-base text-ink">
                    {CATEGORY_TYPE_META[field.state.value].label}
                  </Text>
                </View>
              )}
            </View>
          )}
        </form.Field>

        <form.Field name="icon">
          {(field) => (
            <View className="gap-2">
              <Text className="font-body-medium text-sm text-ink/60">Icon</Text>
              <CategoryIconPicker onChange={field.handleChange} value={field.state.value} />
            </View>
          )}
        </form.Field>

        <form.Field name="color">
          {(field) => (
            <View className="gap-2">
              <Text className="font-body-medium text-sm text-ink/60">Accent</Text>
              <CategoryColorPicker onChange={onColorChange} value={field.state.value} />
            </View>
          )}
        </form.Field>
      </View>
    </>
  );
}
