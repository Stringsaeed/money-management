import { Pressable, TextInput, View } from "react-native";

import { ColorPicker } from "@/components/common/color-picker";
import { EmojiPicker } from "@/components/common/emoji-picker";
import { EnvelopeCategoryOptionRow } from "@/components/envelopes/envelope-form/envelope-category-option";
import { RestoredCategoryConfirmation } from "@/components/envelopes/envelope-form/restored-category-confirmation";
import {
  inputTextStyle,
  resourceInputClassName,
  ResourceFormField,
} from "@/components/resource/resource-form-field";
import { Text } from "@/components/ui/text";
import type { EnvelopeCategoryOption } from "@/modules/budgeting/budgeting";

import type { UseEnvelopeFormReturn } from "./form";

interface EnvelopeFormContentProps {
  currency: string;
  envelopeId?: string;
  form: UseEnvelopeFormReturn;
  maximumSortOrder: number;
  options: readonly EnvelopeCategoryOption[];
}

export function EnvelopeFormContent({
  currency,
  envelopeId,
  form,
  maximumSortOrder,
  options,
}: EnvelopeFormContentProps) {
  return (
    <View className="gap-5">
      <form.Field
        name="name"
        validators={{
          onSubmit: ({ value }) => (!value.trim() ? "Envelope name is required" : undefined),
        }}
      >
        {(field) => (
          <ResourceFormField label="Name" error={field.state.meta.errors[0]}>
            <TextInput
              className={resourceInputClassName}
              onChangeText={field.handleChange}
              placeholder="e.g. Groceries"
              placeholderTextColor="#9a9896"
              style={inputTextStyle}
              value={field.state.value}
            />
          </ResourceFormField>
        )}
      </form.Field>

      <View className="gap-2">
        <Text className="font-body-medium text-sm text-ink/60">Currency</Text>
        <View className="rounded-2xl border border-ledger-outline bg-surface px-4 py-3">
          <Text className="font-body-semibold text-base text-ink">{currency}</Text>
          <Text className="font-body-normal text-xs text-ink/50">
            Currency can&apos;t be changed after creation.
          </Text>
        </View>
      </View>

      <form.Field name="icon">
        {(field) => (
          <View className="gap-2">
            <Text className="font-body-medium text-sm text-ink/60">Emoji</Text>
            <EmojiPicker value={field.state.value} onChange={field.handleChange} />
          </View>
        )}
      </form.Field>

      <form.Field name="color">
        {(field) => (
          <View className="gap-2">
            <Text className="font-body-medium text-sm text-ink/60">Color</Text>
            <ColorPicker value={field.state.value} onChange={field.handleChange} />
          </View>
        )}
      </form.Field>

      <form.Field
        name="categoryIds"
        validators={{
          onSubmit: ({ value }) =>
            value.length === 0 ? "Choose at least one active expense Category" : undefined,
        }}
      >
        {(field) => (
          <View className="gap-2">
            <Text className="font-body-medium text-sm text-ink/60">Category Mappings</Text>
            {options.length === 0 ? (
              <Text className="font-body-normal text-sm text-ink/60">
                Create an active expense Category before adding an Envelope.
              </Text>
            ) : (
              options.map((option) => (
                <EnvelopeCategoryOptionRow
                  key={option.id}
                  checked={field.state.value.includes(option.id)}
                  option={option}
                  onChange={(categoryId, checked) => {
                    field.handleChange(
                      checked
                        ? [...field.state.value, categoryId]
                        : field.state.value.filter((id) => id !== categoryId),
                    );
                  }}
                />
              ))
            )}
            {field.state.meta.errors[0] ? (
              <Text className="font-body-medium text-xs text-destructive">
                {String(field.state.meta.errors[0])}
              </Text>
            ) : null}
          </View>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.values.categoryIds}>
        {(categoryIds) => {
          const restored = options.filter(
            (option) =>
              option.requiresConfirmation &&
              option.mappedEnvelopeId !== envelopeId &&
              categoryIds.includes(option.id),
          );
          if (restored.length === 0) return null;
          return (
            <form.Field name="confirmedRestoredCategoryIds">
              {(field) => (
                <View className="gap-2">
                  <Text className="font-body-medium text-sm text-ink/60">
                    Restored Category confirmation
                  </Text>
                  {restored.map((option) => {
                    const checked = field.state.value.includes(option.id);
                    return (
                      <RestoredCategoryConfirmation
                        key={option.id}
                        checked={checked}
                        option={option}
                        onChange={(categoryId, confirmed) =>
                          field.handleChange(
                            confirmed
                              ? [...field.state.value, categoryId]
                              : field.state.value.filter((id) => id !== categoryId),
                          )
                        }
                      />
                    );
                  })}
                </View>
              )}
            </form.Field>
          );
        }}
      </form.Subscribe>

      <form.Field name="positiveRollover">
        {(field) => (
          <View className="gap-2">
            <Text className="font-body-medium text-sm text-ink/60">Positive Rollover</Text>
            <Pressable
              accessibilityLabel="Carry positive Available Money forward"
              accessibilityRole="switch"
              accessibilityState={{ checked: field.state.value }}
              className="rounded-2xl border border-ledger-outline bg-surface px-4 py-3"
              onPress={() => field.handleChange(!field.state.value)}
            >
              <Text className="font-body-medium text-sm text-ink">
                {field.state.value ? "Carries forward ✓" : "Starts fresh each month"}
              </Text>
            </Pressable>
          </View>
        )}
      </form.Field>

      <form.Field name="sortOrder">
        {(field) => (
          <View className="gap-2">
            <Text className="font-body-medium text-sm text-ink/60">Manual order</Text>
            <View className="flex-row items-center gap-2">
              <Pressable
                accessibilityLabel="Move Envelope earlier"
                accessibilityRole="button"
                accessibilityState={{ disabled: field.state.value === 0 }}
                className="min-h-12 flex-1 items-center justify-center rounded-xl border border-ledger-outline bg-surface px-3 active:bg-surface-dim disabled:opacity-40"
                disabled={field.state.value === 0}
                onPress={() => field.handleChange(field.state.value - 1)}
              >
                <Text className="font-body-medium text-sm text-ink">Earlier</Text>
              </Pressable>
              <Text
                accessibilityLabel={`Envelope position ${field.state.value + 1}`}
                className="font-body-semibold text-sm text-ink"
              >
                {field.state.value + 1}
              </Text>
              <Pressable
                accessibilityLabel="Move Envelope later"
                accessibilityRole="button"
                accessibilityState={{ disabled: field.state.value >= maximumSortOrder }}
                className="min-h-12 flex-1 items-center justify-center rounded-xl border border-ledger-outline bg-surface px-3 active:bg-surface-dim disabled:opacity-40"
                disabled={field.state.value >= maximumSortOrder}
                onPress={() => field.handleChange(field.state.value + 1)}
              >
                <Text className="font-body-medium text-sm text-ink">Later</Text>
              </Pressable>
            </View>
          </View>
        )}
      </form.Field>
    </View>
  );
}
