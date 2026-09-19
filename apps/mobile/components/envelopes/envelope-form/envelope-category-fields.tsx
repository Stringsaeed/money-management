import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { EnvelopeCategoryOptionRow } from "@/components/envelopes/envelope-form/envelope-category-option";
import { RestoredCategoryConfirmation } from "@/components/envelopes/envelope-form/restored-category-confirmation";
import { styles } from "@/components/envelopes/styles";
import { Text } from "@/components/ui/text";
import { layoutTransition } from "@/components/transaction/constants";
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
          <View style={styles.gap2}>
            <Text style={styles.textMediumSmInk60}>Category Mappings</Text>
            {options.length === 0 ? (
              <Text style={styles.textNormalSmInk60}>
                Create an active expense Category before adding an Envelope.
              </Text>
            ) : (
              options.map((option) => (
                <EnvelopeCategoryOptionRow
                  key={option.id}
                  checked={field.state.value.includes(option.id)}
                  option={option}
                  scheduledFromPeriod={
                    option.futureMappedEnvelopeId === envelopeId
                      ? (option.futureMappingPeriod ?? undefined)
                      : undefined
                  }
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
              <Animated.View entering={FadeIn} exiting={FadeOut} layout={layoutTransition}>
                <Text style={styles.textDestructiveXs}>{String(field.state.meta.errors[0])}</Text>
              </Animated.View>
            ) : null}
          </View>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.values.categoryIds}>
        {(categoryIds) => {
          const restored = options.filter((option) => {
            const hasOngoingTargetMapping =
              option.mappedEnvelopeId === envelopeId && option.mappedThroughPeriod === null;
            const hasScheduledTargetMapping = option.futureMappedEnvelopeId === envelopeId;
            return (
              option.requiresConfirmation &&
              !hasOngoingTargetMapping &&
              !hasScheduledTargetMapping &&
              categoryIds.includes(option.id)
            );
          });
          if (restored.length === 0) return null;
          return (
            <form.Field name="confirmedRestoredCategoryIds">
              {(field) => (
                <Animated.View
                  entering={FadeIn}
                  exiting={FadeOut}
                  layout={layoutTransition}
                  style={styles.gap2}
                >
                  <Text style={styles.textMediumSmInk60}>Restored Category confirmation</Text>
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
                </Animated.View>
              )}
            </form.Field>
          );
        }}
      </form.Subscribe>
    </>
  );
}
