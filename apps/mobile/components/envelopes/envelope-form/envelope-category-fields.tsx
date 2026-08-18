import { View } from "react-native";

import { EnvelopeCategoryOptionRow } from "@/components/envelopes/envelope-form/envelope-category-option";
import { RestoredCategoryConfirmation } from "@/components/envelopes/envelope-form/restored-category-confirmation";
import { Text } from "@/components/ui/text";
import type { EnvelopeCategoryOption } from "@/modules/budgeting/budgeting";

import type { UseEnvelopeFormReturn } from "./form";

interface EnvelopeCategoryFieldsProps {
  envelopeId?: string;
  form: UseEnvelopeFormReturn;
  options: readonly EnvelopeCategoryOption[];
}

export function EnvelopeCategoryFields({ envelopeId, form, options }: EnvelopeCategoryFieldsProps) {
  return (
    <>
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
    </>
  );
}
