import type { ComponentProps, ComponentType } from "react";
import { TextInput, View } from "react-native";

import { CategoryColorPicker } from "@/components/category/category-color-picker";
import { CategoryFormPreview } from "@/components/category/category-form-preview";
import { CategoryIconPicker } from "@/components/category/category-icon-picker";
import { CategoryTypePicker } from "@/components/category/category-type-picker";
import type { CategoryType } from "@/components/category/category-form-options";
import { Text } from "@/components/ui/text";

import type { UseCategoryFormReturn } from "./form";

type SheetTextInputProps = ComponentProps<typeof TextInput>;

interface CategoryFormContentProps {
  form: UseCategoryFormReturn;
  onColorChange: (color: string) => void;
  onTypeChange: (type: CategoryType) => void;
  TextInputComponent?: ComponentType<SheetTextInputProps>;
}

const inputClassName =
  "rounded-2xl border border-ledger-outline bg-surface px-4 py-3 text-base text-ink";

const sectionLabelClassName = "font-body-medium text-sm text-ink/60";

export function CategoryFormContent({
  form,
  onColorChange,
  onTypeChange,
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
            <View className="gap-2">
              <Text className={sectionLabelClassName}>Name</Text>
              <TextInputComponent
                autoFocus
                className={inputClassName}
                onChangeText={field.handleChange}
                placeholder="e.g. Groceries"
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

        <form.Field name="type">
          {(field) => (
            <View className="gap-2">
              <Text className={sectionLabelClassName}>Type</Text>
              <CategoryTypePicker onChange={onTypeChange} value={field.state.value} />
            </View>
          )}
        </form.Field>

        <form.Field name="icon">
          {(field) => (
            <View className="gap-2">
              <Text className={sectionLabelClassName}>Icon</Text>
              <CategoryIconPicker onChange={field.handleChange} value={field.state.value} />
            </View>
          )}
        </form.Field>

        <form.Field name="color">
          {(field) => (
            <View className="gap-2">
              <Text className={sectionLabelClassName}>Accent</Text>
              <CategoryColorPicker onChange={onColorChange} value={field.state.value} />
            </View>
          )}
        </form.Field>
      </View>
    </>
  );
}
